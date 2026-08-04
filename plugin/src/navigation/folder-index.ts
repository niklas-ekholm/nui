
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
import { isFolderIndexCreateSuppressed } from "./folder-index-suppress";
import { DEFAULT_CALENDAR_FOLDER, isInsideHabitsRoot } from "../habits/habit-bundle";
import type { FolderIndexSettings } from "../settings/nui-settings";
import {
	beginBreadcrumbFolderRename,
	isBreadcrumbFolderEditing,
} from "./breadcrumb-folder-rename";

export {
	getFolderIndexPath,
	isFolderIndexPath,
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
		private getHabitsRoot: () => string = () => DEFAULT_CALENDAR_FOLDER,
	) {}

	onload(): void {
		this.registerClickHandler();
		// Register after layout ready — vault emits create for existing folders on load.
		this.plugin.app.workspace.onLayoutReady(() => {
			this.registerCreateHandler();
		});
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

		const folder = this.resolveFolder(folderPath);
		if (!folder) {
			return false;
		}

		let indexFile = await this.resolveFolderIndexFile(folder);
		if (!indexFile) {
			indexFile = await this.createFolderIndex(folderPath, { silent: true });
			if (!indexFile) {
				return false;
			}
		}

		await openFileInWorkspace(this.plugin.app, indexFile);
		return true;
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
			buildFolderIndexContent(),
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

		return resolveParentFolderPathFromFilePath(
			activeFile.path,
			(indexPath) => {
				const file =
					this.plugin.app.vault.getAbstractFileByPath(indexPath);
				return file instanceof TFile;
			},
		);
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

	private isHabitFolder(folder: TFolder): boolean {
		return isInsideHabitsRoot(folder, this.getHabitsRoot());
	}

	private async syncFolderIndexRename(
		folder: TFolder,
		oldPath: string,
		attempt = 0,
	): Promise<void> {
		if (this.syncing) return;
		if (this.isHabitFolder(folder)) return;

		const oldFolderName = oldPath.split("/").pop();
		if (!oldFolderName || oldFolderName === folder.name) {
			return;
		}

		const liveFolder = this.plugin.app.vault.getAbstractFileByPath(folder.path);
		if (!(liveFolder instanceof TFolder)) {
			if (attempt < 3) {
				window.setTimeout(() => {
					void this.syncFolderIndexRename(folder, oldPath, attempt + 1);
				}, 50 * (attempt + 1));
			}
			return;
		}
		if (this.isHabitFolder(liveFolder)) {
			return;
		}

		const targetPath = getFolderIndexPath(liveFolder);
		const targetExists = this.plugin.app.vault.getAbstractFileByPath(targetPath);
		const staleFile = findStaleFolderIndexFile(liveFolder, oldFolderName);

		if (
			staleFile &&
			targetExists instanceof TFile &&
			staleFile.path !== targetPath
		) {
			new Notice(
				`Folder index already exists at ${targetPath}; left ${staleFile.path} unchanged.`,
			);
			return;
		}

		if (staleFile) {
			if (staleFile.path === targetPath) {
				return;
			}
			this.syncing = true;
			try {
				await this.plugin.app.fileManager.renameFile(staleFile, targetPath);
			} finally {
				this.syncing = false;
			}
			return;
		}

		if (targetExists instanceof TFile) {
			return;
		}

		// Child paths can lag the folder rename event — retry before creating.
		if (attempt < 3) {
			window.setTimeout(() => {
				void this.syncFolderIndexRename(folder, oldPath, attempt + 1);
			}, 50 * (attempt + 1));
			return;
		}

		this.syncing = true;
		try {
			await this.plugin.app.vault.create(
				targetPath,
				buildFolderIndexContent(),
			);
		} finally {
			this.syncing = false;
		}
	}

	private async syncIndexFolderRename(
		file: TFile,
		oldPath: string,
	): Promise<void> {
		if (this.syncing) return;
		if (!isFolderIndexPath(oldPath)) return;

		const oldParentPath = parentPathOf(oldPath);
		const parent = file.parent;
		if (!(parent instanceof TFolder)) return;
		if (this.isHabitFolder(parent)) return;

		// Parent folder renamed in place: Old/Old.md → New/Old.md — sync hub to New.md.
		if (parent.path !== oldParentPath) {
			if (!isParentFolderRename(oldPath, file.path)) {
				return;
			}
			if (parent.name === file.basename) {
				return;
			}
			const targetPath = getFolderIndexPath(parent);
			if (this.plugin.app.vault.getAbstractFileByPath(targetPath)) {
				return;
			}
			this.syncing = true;
			try {
				await this.plugin.app.fileManager.renameFile(file, targetPath);
			} finally {
				this.syncing = false;
			}
			return;
		}

		const newName = file.basename;
		if (parent.name === newName) return;

		const newFolderPath = parent.parent
			? `${parent.parent.path}/${newName}`
			: newName;

		if (this.plugin.app.vault.getAbstractFileByPath(newFolderPath)) {
			new Notice(
				`Cannot sync folder rename: "${newFolderPath}" already exists.`,
			);
			return;
		}

		this.syncing = true;
		try {
			await this.plugin.app.fileManager.renameFile(parent, newFolderPath);
		} finally {
			this.syncing = false;
		}
	}

	private async onFolderCreated(folder: TFolder): Promise<void> {
		if (isFolderIndexCreateSuppressed()) return;
		if (this.isHabitFolder(folder)) return;

		const indexPath = getFolderIndexPath(folder);
		const existing = this.plugin.app.vault.getAbstractFileByPath(indexPath);
		if (!(existing instanceof TFile)) {
			try {
				const file = await this.plugin.app.vault.create(
					indexPath,
					buildFolderIndexContent(),
				);
				await openFileInWorkspace(this.plugin.app, file);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not create folder index";
				new Notice(`Folder index: ${message}`);
			}
		}
	}

	private registerCreateHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", (file) => {
				if (file instanceof TFolder) {
					void this.onFolderCreated(file);
				}
			}),
		);
	}

	private registerRenameHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFolder) {
					// Defer so child paths settle after the folder rename.
					window.setTimeout(() => {
						void this.syncFolderIndexRename(file, oldPath);
					}, 0);
				} else if (file instanceof TFile) {
					void this.syncIndexFolderRename(file, oldPath);
				}
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
			breadcrumb.setAttribute("aria-label", "Open vault hub");
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
		const vaultBreadcrumb = titleParent.querySelector(`.${VAULT_BREADCRUMB_CLASS}`);
		if (vaultBreadcrumb instanceof HTMLElement) {
			// Clickable whenever the feature is on: like every other folder, the
			// root hub is created on click if it doesn't exist yet.
			vaultBreadcrumb.classList.toggle(BREADCRUMB_CLICKABLE_CLASS, enabled);
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
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				// Same path every other folder takes: open the hub, creating it
				// first if it doesn't exist yet.
				void this.openFolderIndex("");
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

		const settings = this.getSettings();
		const hiding = {
			hideIndexInExplorer: settings.hideIndexInExplorer,
			hideAgentStubs: settings.hideAgentStubs,
		};

		for (const el of Array.from(
			document.querySelectorAll(".nav-file-title[data-path]"),
		)) {
			if (!(el instanceof HTMLElement)) {
				continue;
			}

			const filePath = el.getAttribute("data-path");
			if (!filePath || !shouldHideNavFilePath(filePath, hiding)) {
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

function parentPathOf(filePath: string): string {
	const slash = filePath.lastIndexOf("/");
	return slash >= 0 ? filePath.slice(0, slash) : "";
}

/** Prefer in-memory children — path lookup can lag folder rename on iCloud. */
function findStaleFolderIndexFile(
	folder: TFolder,
	oldFolderName: string,
): TFile | null {
	const fileName = `${oldFolderName}.md`;
	for (const child of folder.children) {
		if (child instanceof TFile && child.name === fileName) {
			return child;
		}
	}
	const byPath = folder.path ? `${folder.path}/${fileName}` : fileName;
	const file = folder.vault.getAbstractFileByPath(byPath);
	return file instanceof TFile ? file : null;
}

/** True when only the parent folder name segment changed (not a move to another tree). */
function isParentFolderRename(oldPath: string, newPath: string): boolean {
	const oldParts = oldPath.split("/");
	const newParts = newPath.split("/");
	if (oldParts.length !== newParts.length || oldParts.length < 2) {
		return false;
	}
	if (oldParts[oldParts.length - 1] !== newParts[newParts.length - 1]) {
		return false;
	}
	let diffs = 0;
	for (let i = 0; i < oldParts.length - 1; i++) {
		if (oldParts[i] !== newParts[i]) {
			diffs++;
		}
	}
	return diffs === 1;
}

/**
 * Seed content for a freshly created hub note. Empty: inline title shows the
 * note's name, so no H1 is needed.
 */
export function buildFolderIndexContent(): string {
	return "";
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

/** Host note for an embedded block, including the active-file fallback Bases uses. */
export function findHostFileWithFallback(
	app: App,
	el: HTMLElement,
): TFile | null {
	const fromLeaf = findHostFileForElement(app, el);
	if (fromLeaf) return fromLeaf;

	const hostPath = el
		.closest<HTMLElement>(
			".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
		)
		?.getAttribute("data-nui-embed-host-path")
		?.trim();
	if (hostPath) {
		const file = app.vault.getFileByPath(hostPath);
		if (file instanceof TFile) return file;
	}

	const active = app.workspace.getActiveFile();
	if (!active) return null;

	const leaf = app.workspace.activeLeaf;
	if (!leaf?.view.containerEl.contains(el)) return null;
	return active;
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

export function getParentFolderPath(file: TAbstractFile): string | null {
	if (file.parent instanceof TFolder) {
		return file.parent.path;
	}
	return null;
}
