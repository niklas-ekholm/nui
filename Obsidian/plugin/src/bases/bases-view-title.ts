
import { App, FileView, Notice, TFile } from "obsidian";
import {
	findHostFileForElement,
	openFileInWorkspace,
} from "../navigation/folder-index";

const TITLE_CLASS = "nui-bases-view-title";
const TITLE_CLICKABLE_CLASS = "nui-bases-view-title-clickable";
const TITLE_EDITABLE_CLASS = "nui-bases-view-title-editable";
const TITLE_FILE_PATH_ATTR = "nuiTitleFilePath";
const TIMELINE_BASES_ROOT_CLASS = "nui-timeline-bases-root";
const CONTENTS_BASE_PATH = "Bases/Contents.base";

export function findBasesRoot(el: HTMLElement): HTMLElement | null {
	return el.closest(".bases-view, [data-type='bases']");
}

export function applyTimelineBasesChrome(containerEl: HTMLElement): void {
	const root = findBasesRoot(containerEl);
	root?.classList.add(TIMELINE_BASES_ROOT_CLASS);
}

function findEmbedRoot(el: HTMLElement): HTMLElement | null {
	return el.closest(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
}

function findHostFile(app: App, el: HTMLElement): TFile | null {
	return (
		findHostFileForElement(app, el) ??
		(() => {
			const active = app.workspace.getActiveFile();
			if (!active) return null;
			const leaf = app.workspace.activeLeaf;
			if (!leaf?.view.containerEl.contains(el)) return null;
			return active;
		})()
	);
}

function resolveBaseFileFromLink(
	app: App,
	link: string,
	hostPath: string,
): TFile | null {
	const path = link.split("#")[0]?.trim();
	if (!path) return null;

	const file =
		app.vault.getFileByPath(path) ??
		app.metadataCache.getFirstLinkpathDest(path, hostPath);
	if (file instanceof TFile && file.extension === "base") {
		return file;
	}
	return null;
}

function readEmbedPathFromDom(embedRoot: HTMLElement): string | null {
	for (const attr of ["src", "data-src", "alt"]) {
		const value = embedRoot.getAttribute(attr)?.trim();
		if (value) return value;
	}
	return null;
}

function findBaseEmbedFileFromMetadata(
	app: App,
	host: TFile,
	el: HTMLElement,
	viewName?: string,
): TFile | null {
	const embeds = (app.metadataCache.getFileCache(host)?.embeds ?? []).filter(
		(entry) => entry.link.endsWith(".base"),
	);
	if (embeds.length === 0) return null;

	if (viewName) {
		const needle = `#${viewName}`;
		const match = embeds.find(
			(entry) =>
				entry.original.includes(needle) ||
				entry.link.includes(needle),
		);
		if (match) {
			const file = resolveBaseFileFromLink(app, match.link, host.path);
			if (file) return file;
		}
	}

	const embedRoot = findEmbedRoot(el);
	const scope =
		embedRoot?.closest(
			".markdown-preview-view, .markdown-rendered, .markdown-source-view, .cm-sizer",
		) ?? embedRoot?.ownerDocument?.body;
	if (embedRoot && scope) {
		const embedEls = Array.from(
			scope.querySelectorAll<HTMLElement>(
				".internal-embed.bases-embed, .block-language-base.bases-embed",
			),
		);
		const index = embedEls.indexOf(embedRoot);
		if (index >= 0 && index < embeds.length) {
			const file = resolveBaseFileFromLink(
				app,
				embeds[index].link,
				host.path,
			);
			if (file) return file;
		}
	}

	if (embeds.length === 1) {
		return resolveBaseFileFromLink(app, embeds[0].link, host.path);
	}

	return null;
}

export function findBasesFileForElement(
	app: App,
	el: HTMLElement,
	viewName?: string,
): TFile | null {
	let result: TFile | null = null;

	app.workspace.iterateAllLeaves((leaf) => {
		if (result) return;
		if (!leaf.view.containerEl.contains(el)) return;

		const { view } = leaf;
		if (
			view instanceof FileView &&
			view.file instanceof TFile &&
			view.file.extension === "base"
		) {
			result = view.file;
		}
	});

	if (result) return result;

	const embedRoot = findEmbedRoot(el);
	if (!embedRoot) return null;

	const host = findHostFile(app, el);
	const hostPath = host?.path ?? "";

	const domPath = readEmbedPathFromDom(embedRoot);
	if (domPath) {
		const file = resolveBaseFileFromLink(app, domPath, hostPath);
		if (file) return file;
	}

	if (host) {
		const file = findBaseEmbedFileFromMetadata(app, host, el, viewName);
		if (file) return file;
	}

	return null;
}

function isTitleEditing(titleEl: HTMLElement): boolean {
	return (
		titleEl.dataset.nuiTitleEditing === "true" ||
		document.activeElement === titleEl
	);
}

function syncTitleText(
	titleEl: HTMLElement,
	file: TFile,
	displayText?: string,
): void {
	if (isTitleEditing(titleEl)) return;
	titleEl.textContent = displayText ?? file.basename;
}

function getTitleBoundFile(app: App, titleEl: HTMLElement): TFile | null {
	const path = titleEl.dataset[TITLE_FILE_PATH_ATTR];
	if (!path) return null;
	const file = app.vault.getAbstractFileByPath(path);
	return file instanceof TFile ? file : null;
}

function selectTitleContents(titleEl: HTMLElement): void {
	const range = document.createRange();
	range.selectNodeContents(titleEl);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

async function commitTitleRename(
	app: App,
	titleEl: HTMLElement,
): Promise<void> {
	const file = getTitleBoundFile(app, titleEl);
	if (!file) return;

	const rawName = (titleEl.textContent ?? "").replace(/\s+/g, " ").trim();
	if (!rawName || rawName === file.basename) {
		syncTitleText(titleEl, file);
		return;
	}

	if (/[\\/]/.test(rawName)) {
		new Notice("Name cannot contain slashes.");
		syncTitleText(titleEl, file);
		return;
	}

	const newPath = file.parent
		? `${file.parent.path}/${rawName}.${file.extension}`
		: `${rawName}.${file.extension}`;

	if (app.vault.getAbstractFileByPath(newPath)) {
		new Notice(`"${rawName}" already exists.`);
		syncTitleText(titleEl, file);
		return;
	}

	try {
		await app.fileManager.renameFile(file, newPath);
		titleEl.dataset[TITLE_FILE_PATH_ATTR] = newPath;
		const renamed = app.vault.getAbstractFileByPath(newPath);
		if (renamed instanceof TFile) {
			syncTitleText(titleEl, renamed);
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not rename file";
		new Notice(message);
		syncTitleText(titleEl, file);
	}
}

function bindBasesTitleRename(app: App, titleEl: HTMLElement, file: TFile): void {
	if (titleEl.dataset.nuiTitleRenameBound === "true") {
		titleEl.dataset[TITLE_FILE_PATH_ATTR] = file.path;
		return;
	}

	titleEl.dataset.nuiTitleRenameBound = "true";
	titleEl.dataset[TITLE_FILE_PATH_ATTR] = file.path;
	titleEl.classList.add(TITLE_EDITABLE_CLASS);
	titleEl.contentEditable = "true";
	titleEl.spellcheck = false;
	titleEl.setAttribute("role", "textbox");
	titleEl.setAttribute("aria-label", "Rename base");

	titleEl.addEventListener("focus", () => {
		titleEl.dataset.nuiTitleEditing = "true";
		selectTitleContents(titleEl);
	});

	titleEl.addEventListener("blur", () => {
		delete titleEl.dataset.nuiTitleEditing;
		void commitTitleRename(app, titleEl);
	});

	titleEl.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			titleEl.blur();
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			const boundFile = getTitleBoundFile(app, titleEl);
			if (boundFile) {
				syncTitleText(titleEl, boundFile);
			}
			titleEl.blur();
		}
	});

	titleEl.addEventListener(
		"click",
		(event) => {
			event.stopPropagation();
		},
		{ capture: true },
	);
}

function bindBasesTitleClick(
	app: App,
	titleEl: HTMLElement,
	file: TFile,
): void {
	if (titleEl.dataset.nuiTitleBound === "true") return;

	titleEl.dataset.nuiTitleBound = "true";
	titleEl.classList.add(TITLE_CLICKABLE_CLASS);
	titleEl.setAttribute("role", "button");
	titleEl.setAttribute("tabindex", "0");
	titleEl.title = `Open ${file.basename}`;

	titleEl.addEventListener(
		"click",
		(evt) => {
			if (evt.button !== 0 && evt.button !== 1) return;
			evt.preventDefault();
			evt.stopPropagation();
			void openFileInWorkspace(app, file, {
				anchorEl: titleEl,
				evt,
			});
		},
		{ capture: true },
	);
}

function findTimelineBasesContainer(el: HTMLElement): HTMLElement | null {
	if (el.classList.contains("nui-timeline-bases-container")) return el;
	return el.closest(".nui-timeline-bases-container");
}

export function clearMountedBasesTitle(anchorEl: HTMLElement): void {
	const basesView = findBasesRoot(anchorEl);
	const embed = anchorEl.closest(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
	const scope = basesView ?? embed;
	scope?.querySelector<HTMLElement>(`.${TITLE_CLASS}`)?.remove();
}

export function findAdoptedBasesTitle(container: HTMLElement): HTMLElement | null {
	const basesView = findBasesRoot(container);
	const embed = container.closest(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
	const scope = basesView ?? embed;
	return scope?.querySelector<HTMLElement>(`.${TITLE_CLASS}`) ?? null;
}

export function mountBasesTitle(
	app: App,
	anchorEl: HTMLElement,
	options?: { viewName?: string },
): void {
	const file = findBasesFileForElement(app, anchorEl, options?.viewName);
	if (!file) return;

	const isEmbed = !!findEmbedRoot(anchorEl);
	const timelineContainer = findTimelineBasesContainer(anchorEl);

	const basesView = findBasesRoot(anchorEl);
	const mountRoot =
		basesView ?? timelineContainer?.parentElement ?? findEmbedRoot(anchorEl);
	if (!mountRoot) return;

	let titleEl = mountRoot.querySelector<HTMLElement>(`.${TITLE_CLASS}`);
	if (!titleEl) {
		titleEl = document.createElement(isEmbed ? "h6" : "h1");
		titleEl.className = `inline-title ${TITLE_CLASS}`;
		const header = mountRoot.querySelector(".bases-header");
		if (timelineContainer) {
			mountRoot.insertBefore(titleEl, timelineContainer);
		} else if (header) {
			mountRoot.insertBefore(titleEl, header);
		} else {
			mountRoot.prepend(titleEl);
		}
	}

	const displayTitle =
		isEmbed &&
		options?.viewName &&
		file.path === CONTENTS_BASE_PATH
			? options.viewName
			: file.basename;
	syncTitleText(titleEl, file, displayTitle);
	titleEl.dataset[TITLE_FILE_PATH_ATTR] = file.path;

	if (isEmbed) {
		bindBasesTitleClick(app, titleEl, file);
	} else if (file.extension === "base") {
		bindBasesTitleRename(app, titleEl, file);
	}
}

export function mountStandaloneBasesTitle(
	app: App,
	anchorEl: HTMLElement,
): void {
	if (findEmbedRoot(anchorEl)) return;
	mountBasesTitle(app, anchorEl);
}

export function createNuiBasesContainer(
	app: App,
	parentEl: HTMLElement,
	className: string,
): HTMLElement {
	mountStandaloneBasesTitle(app, parentEl);
	return parentEl.createDiv(className);
}

