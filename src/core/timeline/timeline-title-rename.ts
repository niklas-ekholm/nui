
import { App, Notice, TFile } from "obsidian";

const EDITING_CLASS = "nui-timeline-bar-title-text-editing";
const PATH_ATTR = "nuiTitleFilePath";

function selectContents(el: HTMLElement): void {
	const range = document.createRange();
	range.selectNodeContents(el);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function getBoundFile(app: App, titleTextEl: HTMLElement): TFile | null {
	const path = titleTextEl.dataset[PATH_ATTR];
	if (!path) return null;
	const file = app.vault.getAbstractFileByPath(path);
	return file instanceof TFile ? file : null;
}

function syncTitleText(titleTextEl: HTMLElement, file: TFile): void {
	if (titleTextEl.classList.contains(EDITING_CLASS)) return;
	titleTextEl.textContent = file.basename;
}

async function commitTitleRename(
	app: App,
	titleTextEl: HTMLElement,
	onRenamed?: () => void,
): Promise<void> {
	const file = getBoundFile(app, titleTextEl);
	if (!file) return;

	const rawName = (titleTextEl.textContent ?? "").replace(/\s+/g, " ").trim();
	if (!rawName || rawName === file.basename) {
		syncTitleText(titleTextEl, file);
		return;
	}

	if (/[\\/]/.test(rawName)) {
		new Notice("Name cannot contain slashes.");
		syncTitleText(titleTextEl, file);
		return;
	}

	const newPath = file.parent
		? `${file.parent.path}/${rawName}.${file.extension}`
		: `${rawName}.${file.extension}`;

	if (app.vault.getAbstractFileByPath(newPath)) {
		new Notice(`"${rawName}" already exists.`);
		syncTitleText(titleTextEl, file);
		return;
	}

	try {
		await app.fileManager.renameFile(file, newPath);
		titleTextEl.dataset[PATH_ATTR] = newPath;
		const renamed = app.vault.getAbstractFileByPath(newPath);
		if (renamed instanceof TFile) {
			syncTitleText(titleTextEl, renamed);
		}
		onRenamed?.();
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not rename note";
		new Notice(`Timeline: ${message}`);
		syncTitleText(titleTextEl, file);
	}
}

function endEditing(titleTextEl: HTMLElement): void {
	titleTextEl.contentEditable = "false";
	titleTextEl.classList.remove(EDITING_CLASS);
	delete titleTextEl.dataset.nuiTitleEditing;
}

export function isTimelineTitleEditing(container: HTMLElement): boolean {
	return !!container.querySelector(`.${EDITING_CLASS}`);
}

export function bindTimelineTitleRename(
	app: App,
	titleTextEl: HTMLElement,
	file: TFile,
	onRenamed?: () => void,
): void {
	titleTextEl.dataset[PATH_ATTR] = file.path;

	if (titleTextEl.dataset.nuiRenameBound === "true") return;
	titleTextEl.dataset.nuiRenameBound = "true";

	titleTextEl.addEventListener("blur", () => {
		if (!titleTextEl.classList.contains(EDITING_CLASS)) return;
		endEditing(titleTextEl);
		void commitTitleRename(app, titleTextEl, onRenamed);
	});

	titleTextEl.addEventListener("keydown", (event) => {
		if (!titleTextEl.classList.contains(EDITING_CLASS)) return;

		if (event.key === "Enter" || event.key === "Tab") {
			event.preventDefault();
			titleTextEl.blur();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			const boundFile = getBoundFile(app, titleTextEl);
			if (boundFile) {
				syncTitleText(titleTextEl, boundFile);
			}
			endEditing(titleTextEl);
			titleTextEl.blur();
		}
	});

	titleTextEl.addEventListener(
		"click",
		(event) => {
			if (titleTextEl.classList.contains(EDITING_CLASS)) {
				event.stopPropagation();
			}
		},
		{ capture: true },
	);

	titleTextEl.addEventListener(
		"pointerdown",
		(event) => {
			if (titleTextEl.classList.contains(EDITING_CLASS)) {
				event.stopPropagation();
			}
		},
		{ capture: true },
	);
}

export function beginTimelineTitleRename(
	container: HTMLElement,
	itemId: string,
): boolean {
	const row = container.querySelector<HTMLElement>(
		`.nui-timeline-row[data-item-id="${CSS.escape(itemId)}"]`,
	);
	const titleTextEl = row?.querySelector<HTMLElement>(
		".nui-timeline-bar-title-text",
	);
	if (!titleTextEl) return false;

	titleTextEl.contentEditable = "true";
	titleTextEl.classList.add(EDITING_CLASS);
	titleTextEl.dataset.nuiTitleEditing = "true";
	titleTextEl.spellcheck = false;
	titleTextEl.focus();
	selectContents(titleTextEl);
	return true;
}
