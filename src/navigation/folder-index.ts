
import {
	App,
	Keymap,
	MarkdownView,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	TFolder,
	WorkspaceLeaf,
} from "obsidian";
import {
	getFolderIndexPath,
	isFolderIndexPath,
	resolveFolderPath,
	resolveParentFolderPathFromFilePath,
	shouldHideNavFilePath,
} from "./folder-index-path";
import { DEFAULT_FOLDER_INDEX_SETTINGS, FolderIndexSettings } from "./types";
import {
	beginBreadcrumbFolderRename,
	isBreadcrumbFolderEditing,
} from "./breadcrumb-folder-rename";

export {
	getFolderIndexPath,
	isFolderIndexPath,
	isSameNamedFolderNote,
} from "./folder-index-path";

const FOLDER_TITLE_SELECTOR = ".nav-folder-title";
const BREADCRUMB_SELECTOR = ".view-header-breadcrumb";
const BREADCRUMB_SEPARATOR_SELECTOR = ".view-header-breadcrumb-separator";
const BREADCRUMB_CONTAINER_SELECTOR = ".view-header-title-container";
const BREADCRUMB_PARENT_SELECTOR = ".view-header-title-parent";
const VAULT_BREADCRUMB_CLASS = "nui-vault-breadcrumb";
const VAULT_BREADCRUMB_SEPARATOR_CLASS = "nui-vault-breadcrumb-separator";
const CHEVRON_SELECTOR =
	".collapse-icon, .nav-folder-collapse-indicator, .tree-item-icon.collapse-icon";
const HIDDEN_INDEX_CLASS = "nui-hidden-folder-index";
const HIDDEN_INDEX_TITLE_CLASS = "nui-folder-index-open";
const BREADCRUMB_CLICKABLE_CLASS = "nui-breadcrumb-clickable";

export class FolderIndexManager {
	private clickHandler: ((event: MouseEvent) => void) | null = null;
	private hideStyleEl: HTMLStyleElement | null = null;
	private hideObserver: MutationObserver | null = null;
	private headerSyncTimer: number | null = null;
	private syncing = false;
	private breadcrumbContextFolderPath: string | null = null;
	private breadcrumbContextMenuTarget: HTMLElement | null = null;
	lastClickedFolderPath: string | null = null;

	constructor(
		private plugin: Plugin,
		private getSettings: () => FolderIndexSettings,
	) {}

	onload(): void {
		this.registerClickHandler();
		this.registerBreadcrumbContextMenuHandlers();
		this.registerRenameHandler();
		this.registerHeaderSync();
		this.applyHideFolderIndexStyle();
	}

	onunload(): void {
		this.unregisterClickHandler();
		this.unregisterHeaderSync();
		this.removeHideFolderIndexStyle();
	}

	onSettingsChanged(): void {
		this.applyHideFolderIndexStyle();
		this.scheduleHeaderSync();
	}

	async openFolderIndex(folderPath: string): Promise<boolean> {
		this.lastClickedFolderPath = folderPath;

		const indexPath = getFolderIndexPath({ path: folderPath });
		const indexFile = this.plugin.app.vault.getAbstractFileByPath(indexPath);
		if (indexFile instanceof TFile) {
			await openFileInWorkspace(this.plugin.app, indexFile);
			return true;
		}

		const created = await this.createFolderIndex(folderPath, { silent: true });
		return created !== null;
	}

	async createFolderIndex(
		folderPath: string,
		options: { silent?: boolean } = {},
	): Promise<TFile | null> {
		const folder = this.resolveFolder(folderPath);
		if (!folder) {
			new Notice(`Folder not found: "${folderPath}".`);
			return null;
		}

		const existing = await this.resolveFolderIndexFile(folder);
		if (existing) {
			await openFileInWorkspace(this.plugin.app, existing);
			return existing;
		}

		const indexPath = getFolderIndexPath(folder);
		const file = await this.plugin.app.vault.create(
			indexPath,
			buildFolderIndexContent(folder.name),
		);
		await openFileInWorkspace(this.plugin.app, file);
		if (!options.silent) {
			new Notice(`Created ${indexPath}`);
		}
		return file;
	}

	resolveTargetFolderPath(): string | null {
		if (this.lastClickedFolderPath) {
			return this.lastClickedFolderPath;
		}

		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			return null;
		}

		const parent = activeFile.parent;
		return parent?.path ?? "";
	}

	resolveParentFolderPath(): string | null {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			return null;
		}

		return resolveParentFolderPathFromFilePath(activeFile.path);
	}

	async goToParentFolder(): Promise<boolean> {
		const parentPath = this.resolveParentFolderPath();
		if (parentPath === null) {
			return false;
		}

		return this.openFolderIndex(parentPath);
	}

	private resolveFolder(folderPath: string): TFolder | null {
		const resolved = resolveFolderPath(
			folderPath,
			() => this.plugin.app.vault.getRoot(),
			(path) => {
				const folder = this.plugin.app.vault.getAbstractFileByPath(path);
				return folder instanceof TFolder ? folder : null;
			},
		);
		return resolved instanceof TFolder ? resolved : null;
	}

	private async resolveFolderIndexFile(folder: TFolder): Promise<TFile | null> {
		const indexPath = getFolderIndexPath(folder);
		const indexFile = this.plugin.app.vault.getAbstractFileByPath(indexPath);
		return indexFile instanceof TFile ? indexFile : null;
	}

	private registerRenameHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", () => {
				// Folder and index.md names are independent now; just refresh header state.
				this.scheduleHeaderSync();
			}),
		);
	}

	private registerHeaderSync(): void {
		const schedule = () => this.scheduleHeaderSync();

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-open", schedule),
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", schedule),
		);

		schedule();
	}

	private unregisterHeaderSync(): void {
		if (this.headerSyncTimer !== null) {
			window.clearTimeout(this.headerSyncTimer);
			this.headerSyncTimer = null;
		}

		this.clearAllFolderIndexHeaderClasses();
	}

	private scheduleHeaderSync(): void {
		if (this.headerSyncTimer !== null) {
			window.clearTimeout(this.headerSyncTimer);
		}

		this.headerSyncTimer = window.setTimeout(() => {
			this.headerSyncTimer = null;
			requestAnimationFrame(() => {
				this.syncFolderIndexHeaders();
			});
		}, 0);
	}

	private syncFolderIndexHeaders(): void {
		if (!this.getSettings().enabled) {
			this.clearAllFolderIndexHeaderClasses();
			return;
		}

		for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) {
				continue;
			}

			const container = view.containerEl.querySelector(
				BREADCRUMB_CONTAINER_SELECTOR,
			);
			if (!(container instanceof HTMLElement)) {
				continue;
			}

			this.syncVaultBreadcrumb(container);
			this.syncClickableBreadcrumbs(container);

			if (view.file && isFolderIndexFile(view.file)) {
				container.classList.add(HIDDEN_INDEX_TITLE_CLASS);
			} else {
				container.classList.remove(HIDDEN_INDEX_TITLE_CLASS);
			}
		}
	}

	private syncVaultBreadcrumb(container: HTMLElement): void {
		const titleParent = container.querySelector(BREADCRUMB_PARENT_SELECTOR);
		if (!(titleParent instanceof HTMLElement)) {
			return;
		}

		let breadcrumb = titleParent.querySelector(`.${VAULT_BREADCRUMB_CLASS}`);
		if (!(breadcrumb instanceof HTMLElement)) {
			breadcrumb = document.createElement("div");
			breadcrumb.classList.add(
				BREADCRUMB_SELECTOR.slice(1),
				VAULT_BREADCRUMB_CLASS,
			);
			breadcrumb.setAttribute("aria-label", "Open vault index");
		}
		breadcrumb.textContent = this.plugin.app.vault.getName();

		let separator = titleParent.querySelector(
			`.${VAULT_BREADCRUMB_SEPARATOR_CLASS}`,
		);
		if (!(separator instanceof HTMLElement)) {
			separator = document.createElement("div");
			separator.classList.add(
				BREADCRUMB_SEPARATOR_SELECTOR.slice(1),
				VAULT_BREADCRUMB_SEPARATOR_CLASS,
			);
			separator.textContent = "/";
		}

		titleParent.prepend(separator);
		titleParent.prepend(breadcrumb);
	}

	private syncClickableBreadcrumbs(container: HTMLElement): void {
		const titleParent = container.querySelector(BREADCRUMB_PARENT_SELECTOR);
		if (!(titleParent instanceof HTMLElement)) {
			return;
		}

		const enabled = this.getSettings().enabled;
		const rootIndex = this.plugin.app.vault.getAbstractFileByPath("index.md");
		const vaultBreadcrumb = titleParent.querySelector(`.${VAULT_BREADCRUMB_CLASS}`);
		if (vaultBreadcrumb instanceof HTMLElement) {
			vaultBreadcrumb.classList.toggle(
				BREADCRUMB_CLICKABLE_CLASS,
				enabled && rootIndex instanceof TFile,
			);
		}

		for (const el of Array.from(titleParent.querySelectorAll(BREADCRUMB_SELECTOR))) {
			if (!(el instanceof HTMLElement)) {
				continue;
			}
			if (el.classList.contains(VAULT_BREADCRUMB_CLASS)) {
				continue;
			}

			if (!enabled) {
				el.classList.remove(BREADCRUMB_CLICKABLE_CLASS);
				continue;
			}

			const folderPath = resolveBreadcrumbFolderPath(this.plugin.app, el);
			el.classList.toggle(BREADCRUMB_CLICKABLE_CLASS, folderPath !== null);
		}
	}

	private clearAllFolderIndexHeaderClasses(): void {
		for (const container of Array.from(
			document.querySelectorAll(`.${HIDDEN_INDEX_TITLE_CLASS}`),
		)) {
			container.classList.remove(HIDDEN_INDEX_TITLE_CLASS);
		}
		for (const element of Array.from(
			document.querySelectorAll(
				`.${VAULT_BREADCRUMB_CLASS}, .${VAULT_BREADCRUMB_SEPARATOR_CLASS}`,
			),
		)) {
			element.remove();
		}
		for (const breadcrumb of Array.from(
			document.querySelectorAll(`.${BREADCRUMB_CLICKABLE_CLASS}`),
		)) {
			breadcrumb.classList.remove(BREADCRUMB_CLICKABLE_CLASS);
		}
	}

	private registerBreadcrumbContextMenuHandlers(): void {
		this.plugin.registerDomEvent(
			document,
			"contextmenu",
			(event) => {
				if (!this.getSettings().enabled) {
					this.breadcrumbContextFolderPath = null;
					this.breadcrumbContextMenuTarget = null;
					return;
				}

				const target = event.target;
				if (!(target instanceof HTMLElement)) {
					this.breadcrumbContextFolderPath = null;
					this.breadcrumbContextMenuTarget = null;
					return;
				}

				if (target.closest(`.${VAULT_BREADCRUMB_CLASS}`)) {
					this.breadcrumbContextFolderPath = null;
					this.breadcrumbContextMenuTarget = null;
					return;
				}

				const breadcrumbEl = target.closest(BREADCRUMB_SELECTOR);
				if (!(breadcrumbEl instanceof HTMLElement)) {
					this.breadcrumbContextFolderPath = null;
					this.breadcrumbContextMenuTarget = null;
					return;
				}

				this.breadcrumbContextMenuTarget = breadcrumbEl;
				this.breadcrumbContextFolderPath = resolveBreadcrumbFolderPath(
					this.plugin.app,
					breadcrumbEl,
				);
			},
			true,
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-menu", (menu) => {
				const folderPath = this.breadcrumbContextFolderPath;
				const breadcrumbEl = this.breadcrumbContextMenuTarget;
				this.breadcrumbContextFolderPath = null;
				this.breadcrumbContextMenuTarget = null;
				if (folderPath === null || !this.getSettings().enabled) {
					return;
				}

				const folder = this.resolveFolder(folderPath);
				if (!folder || !(breadcrumbEl instanceof HTMLElement)) {
					return;
				}

				menu.addItem((item) => {
					item
						.setTitle("Rename")
						.setIcon("pencil")
						.onClick(() => {
							window.setTimeout(() => {
								beginBreadcrumbFolderRename(
									this.plugin.app,
									breadcrumbEl,
									folder,
								);
							}, 0);
						});
				});
			}),
		);
	}

	private registerClickHandler(): void {
		this.clickHandler = (event: MouseEvent) => {
			const settings = this.getSettings();
			if (!settings.enabled) {
				return;
			}

			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				return;
			}

			const vaultBreadcrumb = target.closest(`.${VAULT_BREADCRUMB_CLASS}`);
			if (vaultBreadcrumb instanceof HTMLElement) {
				const rootIndex = this.plugin.app.vault.getAbstractFileByPath("index.md");
				if (rootIndex instanceof TFile) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					void openFileInWorkspace(this.plugin.app, rootIndex, {
						anchorEl: vaultBreadcrumb,
						evt: event,
					});
				}
				return;
			}

			if (event.metaKey || event.ctrlKey) {
				return;
			}

			if (isBreadcrumbFolderEditing()) {
				return;
			}

			const breadcrumbEl = target.closest(BREADCRUMB_SELECTOR);
			if (breadcrumbEl instanceof HTMLElement) {
				const folderPath = resolveBreadcrumbFolderPath(
					this.plugin.app,
					breadcrumbEl,
				);
				if (folderPath !== null) {
					event.preventDefault();
					event.stopPropagation();
					event.stopImmediatePropagation();
					void this.openFolderIndex(folderPath);
				}
				return;
			}

			if (isChevronClick(target)) {
				return;
			}

			const titleEl = target.closest(FOLDER_TITLE_SELECTOR);
			if (!(titleEl instanceof HTMLElement)) {
				return;
			}

			const folderPath = titleEl.getAttribute("data-path");
			if (!folderPath) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			void this.openFolderIndex(folderPath);
		};

		this.plugin.registerDomEvent(
			document,
			"click",
			this.clickHandler,
			true,
		);
	}

	private unregisterClickHandler(): void {
		this.clickHandler = null;
	}

	private applyHideFolderIndexStyle(): void {
		this.removeHideFolderIndexStyle();

		this.hideStyleEl = document.createElement("style");
		this.hideStyleEl.textContent = `.nav-file.${HIDDEN_INDEX_CLASS} { display: none; }`;
		document.head.appendChild(this.hideStyleEl);

		const run = () => this.markHiddenNavFiles();
		run();

		this.hideObserver = new MutationObserver(() => run());
		this.hideObserver.observe(document.body, { childList: true, subtree: true });
	}

	private markHiddenNavFiles(): void {
		for (const el of Array.from(document.querySelectorAll(".nav-file"))) {
			el.classList.remove(HIDDEN_INDEX_CLASS);
		}

		const hideIndexInExplorer = this.getSettings().hideIndexInExplorer;

		for (const el of Array.from(
			document.querySelectorAll(".nav-file-title[data-path]"),
		)) {
			if (!(el instanceof HTMLElement)) {
				continue;
			}

			const filePath = el.getAttribute("data-path");
			if (
				!filePath ||
				!shouldHideNavFilePath(filePath, hideIndexInExplorer)
			) {
				continue;
			}

			el.closest(".nav-file")?.classList.add(HIDDEN_INDEX_CLASS);
		}
	}

	private removeHideFolderIndexStyle(): void {
		this.hideObserver?.disconnect();
		this.hideObserver = null;
		this.hideStyleEl?.remove();
		this.hideStyleEl = null;

		for (const el of Array.from(
			document.querySelectorAll(`.nav-file.${HIDDEN_INDEX_CLASS}`),
		)) {
			el.classList.remove(HIDDEN_INDEX_CLASS);
		}
	}
}

export function buildFolderIndexContent(folderName: string): string {
	return `# ${folderName}\n\n`;
}

export function isFolderIndexFile(file: TFile): boolean {
	return isFolderIndexPath(file.path);
}

export function findHostFileForElement(
	app: App,
	el: HTMLElement,
): TFile | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (!leaf.view.containerEl.contains(el)) continue;
		const view = leaf.view;
		if (view instanceof MarkdownView && view.file) {
			return view.file;
		}
	}
	return null;
}

export function findMarkdownLeafForElement(
	app: App,
	el: HTMLElement,
): WorkspaceLeaf | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (leaf.view.containerEl.contains(el)) {
			return leaf;
		}
	}
	return null;
}

export async function openFileInWorkspace(
	app: App,
	file: TFile,
	options?: { anchorEl?: HTMLElement; evt?: MouseEvent },
): Promise<void> {
	let newLeaf: ReturnType<typeof Keymap.isModEvent> | "tab" = false;
	if (options?.evt) {
		newLeaf =
			options.evt.button === 1 ? "tab" : Keymap.isModEvent(options.evt);
	}
	if (newLeaf) {
		await app.workspace.getLeaf(newLeaf).openFile(file);
		return;
	}

	const hostLeaf = options?.anchorEl
		? findMarkdownLeafForElement(app, options.anchorEl)
		: null;
	const leaf = hostLeaf ?? app.workspace.getMostRecentLeaf();
	if (!leaf) return;

	const pinned = leaf.getViewState()?.pinned ?? false;
	const targetLeaf = pinned ? app.workspace.getLeaf("tab") : leaf;
	await targetLeaf.openFile(file);
	app.workspace.setActiveLeaf(targetLeaf, { focus: true });
}

function isChevronClick(target: HTMLElement): boolean {
	return !!target.closest(CHEVRON_SELECTOR);
}

function getFileForViewHeaderEl(app: App, headerEl: HTMLElement): TFile | null {
	const workspaceLeaf = headerEl.closest(".workspace-leaf");
	if (workspaceLeaf) {
		for (const leaf of app.workspace.getLeavesOfType("markdown")) {
			if (workspaceLeaf.contains(leaf.view.containerEl)) {
				const view = leaf.view;
				if (view instanceof MarkdownView && view.file) {
					return view.file;
				}
			}
		}
	}

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (!leaf.view.containerEl.contains(headerEl)) {
			continue;
		}

		const view = leaf.view;
		if (view instanceof MarkdownView && view.file) {
			return view.file;
		}
	}

	return app.workspace.getActiveFile();
}

export function resolveBreadcrumbFolderPath(
	app: App,
	breadcrumbEl: HTMLElement,
): string | null {
	const container = breadcrumbEl.closest(BREADCRUMB_CONTAINER_SELECTOR);
	if (!container) {
		return null;
	}

	const titleParent = container.querySelector(BREADCRUMB_PARENT_SELECTOR);
	if (!titleParent) {
		return null;
	}

	const breadcrumbs = Array.from(
		titleParent.querySelectorAll(
			`${BREADCRUMB_SELECTOR}:not(.${VAULT_BREADCRUMB_CLASS})`,
		),
	);
	const index = breadcrumbs.indexOf(breadcrumbEl);
	if (index < 0) {
		return null;
	}

	const file = getFileForViewHeaderEl(app, breadcrumbEl);
	if (!file?.parent) {
		return null;
	}

	const folderParts = file.parent.path ? file.parent.path.split("/") : [];
	if (index >= folderParts.length) {
		return null;
	}

	return folderParts.slice(0, index + 1).join("/");
}

export function mergeFolderIndexSettings(
	loaded: Partial<FolderIndexSettings> | null,
): FolderIndexSettings {
	return {
		...DEFAULT_FOLDER_INDEX_SETTINGS,
		...loaded,
	};
}

export function getParentFolderPath(file: TAbstractFile): string | null {
	if (file.parent instanceof TFolder) {
		return file.parent.path;
	}
	return null;
}

