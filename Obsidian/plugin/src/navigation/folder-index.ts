
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
import { DEFAULT_CALENDAR_FOLDER, isChildOfHabitsRoot } from "../habits/habit-bundle";
import { DEFAULT_FOLDER_INDEX_SETTINGS, FolderIndexSettings } from "./types";

const FOLDER_TITLE_SELECTOR = ".nav-folder-title";
const BREADCRUMB_SELECTOR = ".view-header-breadcrumb";
const BREADCRUMB_CONTAINER_SELECTOR = ".view-header-title-container";
const BREADCRUMB_PARENT_SELECTOR = ".view-header-title-parent";
const CHEVRON_SELECTOR =
	".collapse-icon, .nav-folder-collapse-indicator, .tree-item-icon.collapse-icon";
const HIDDEN_INDEX_CLASS = "nui-hidden-folder-index";
const HIDDEN_INDEX_TITLE_CLASS = "nui-folder-index-open";

export class FolderIndexManager {
	private clickHandler: ((event: MouseEvent) => void) | null = null;
	private hideStyleEl: HTMLStyleElement | null = null;
	private hideObserver: MutationObserver | null = null;
	private headerSyncTimer: number | null = null;
	private syncing = false;
	lastClickedFolderPath: string | null = null;

	constructor(
		private plugin: Plugin,
		private getSettings: () => FolderIndexSettings,
	) {}

	onload(): void {
		this.registerClickHandler();
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

		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
		if (!(folder instanceof TFolder)) {
			return false;
		}

		const indexFile = await this.resolveFolderIndexFile(folder);
		if (indexFile) {
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
		const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
		if (!(folder instanceof TFolder)) {
			new Notice(`Folder not found: "${folderPath}".`);
			return null;
		}

		const existing = await this.resolveFolderIndexFile(folder);
		if (existing) {
			await openFileInWorkspace(this.plugin.app, existing);
			return existing;
		}

		const indexPath = getFolderIndexPath(folder);
		const file = await this.plugin.app.vault.create(indexPath, "");
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
		if (!activeFile?.parent) {
			return null;
		}

		const parentFolder = activeFile.parent.parent;
		if (!(parentFolder instanceof TFolder)) {
			return null;
		}

		return parentFolder.path;
	}

	async goToParentFolder(): Promise<boolean> {
		const parentPath = this.resolveParentFolderPath();
		if (parentPath === null) {
			return false;
		}

		return this.openFolderIndex(parentPath);
	}

	private async resolveFolderIndexFile(folder: TFolder): Promise<TFile | null> {
		const indexPath = getFolderIndexPath(folder);
		const indexFile = this.plugin.app.vault.getAbstractFileByPath(indexPath);
		return indexFile instanceof TFile ? indexFile : null;
	}

	private isHabitFolder(folder: TFolder): boolean {
		return isChildOfHabitsRoot(folder, DEFAULT_CALENDAR_FOLDER);
	}

	private async syncFolderIndexRename(
		folder: TFolder,
		oldPath: string,
	): Promise<void> {
		if (this.syncing) return;
		if (this.isHabitFolder(folder)) return;

		const oldFolderName = oldPath.split("/").pop();
		if (!oldFolderName) {
			return;
		}

		const stalePath = `${folder.path}/${oldFolderName}.md`;
		const targetPath = getFolderIndexPath(folder);
		if (stalePath === targetPath) {
			return;
		}

		const staleFile = this.plugin.app.vault.getAbstractFileByPath(stalePath);
		if (staleFile instanceof TFile) {
			const targetExists = this.plugin.app.vault.getAbstractFileByPath(targetPath);
			if (targetExists instanceof TFile) {
				return;
			}
			this.syncing = true;
			try {
				await this.plugin.app.fileManager.renameFile(staleFile, targetPath);
			} finally {
				this.syncing = false;
			}
		}
	}

	private async syncIndexFolderRename(
		file: TFile,
		oldPath: string,
	): Promise<void> {
		if (this.syncing) return;
		if (!isFolderIndexPath(oldPath)) return;

		const parent = file.parent;
		if (!(parent instanceof TFolder)) return;
		if (this.isHabitFolder(parent)) return;

		const newName = file.basename;
		if (parent.name === newName) return;

		const newFolderPath = parent.parent
			? `${parent.parent.path}/${newName}`
			: newName;

		if (this.plugin.app.vault.getAbstractFileByPath(newFolderPath)) return;

		this.syncing = true;
		try {
			await this.plugin.app.fileManager.renameFile(parent, newFolderPath);
		} finally {
			this.syncing = false;
		}
	}

	private registerRenameHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFolder) {
					void this.syncFolderIndexRename(file, oldPath);
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

			if (view.file && isFolderIndexFile(view.file)) {
				container.classList.add(HIDDEN_INDEX_TITLE_CLASS);
			} else {
				container.classList.remove(HIDDEN_INDEX_TITLE_CLASS);
			}
		}
	}

	private clearAllFolderIndexHeaderClasses(): void {
		for (const container of Array.from(
			document.querySelectorAll(`.${HIDDEN_INDEX_TITLE_CLASS}`),
		)) {
			container.classList.remove(HIDDEN_INDEX_TITLE_CLASS);
		}
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

			if (event.metaKey || event.ctrlKey) {
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

		const settings = this.getSettings();
		if (!settings.hideIndexInExplorer) {
			return;
		}

		this.hideStyleEl = document.createElement("style");
		this.hideStyleEl.textContent = `.nav-file.${HIDDEN_INDEX_CLASS} { display: none; }`;
		document.head.appendChild(this.hideStyleEl);

		const run = () => this.markHiddenFolderIndexFiles();
		run();

		this.hideObserver = new MutationObserver(() => run());
		this.hideObserver.observe(document.body, { childList: true, subtree: true });
	}

	private markHiddenFolderIndexFiles(): void {
		for (const el of Array.from(document.querySelectorAll(".nav-file"))) {
			el.classList.remove(HIDDEN_INDEX_CLASS);
		}

		for (const el of Array.from(
			document.querySelectorAll(".nav-file-title[data-path]"),
		)) {
			if (!(el instanceof HTMLElement)) {
				continue;
			}

			const filePath = el.getAttribute("data-path");
			if (!filePath || !isFolderIndexPath(filePath)) {
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

export function getFolderIndexPath(folder: TFolder): string {
	return folder.path ? `${folder.path}/${folder.name}.md` : `${folder.name}.md`;
}

export function isFolderIndexPath(filePath: string): boolean {
	const parts = filePath.split("/");
	const fileName = parts.pop();
	if (!fileName?.endsWith(".md")) {
		return false;
	}

	const folderName = parts[parts.length - 1];
	if (!folderName) {
		return false;
	}

	return fileName === `${folderName}.md`;
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
		titleParent.querySelectorAll(BREADCRUMB_SELECTOR),
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

