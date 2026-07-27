
import { App, Notice } from "obsidian";
import { resolveUniqueNoteName } from "../core/mutate/create-note";
import { createUntitledSubfolder } from "../navigation/create-subfolder";
import {
	findHostFileForElement,
	openFileInWorkspace,
} from "../navigation/folder-index";
import { findAdoptedBasesTitle, findBasesFileForElement } from "./bases-view-title";

export interface BasesViewAddAction {
	title: string;
	ariaLabel: string;
	onClick: (anchorEl: HTMLElement) => void;
}

export function resolveEmbedHostFolderPath(
	app: App,
	el: HTMLElement,
): string | null {
	const host = findHostFileForElement(app, el);
	return host?.parent?.path ?? null;
}

/** Folder for new notes: host note when embedded, else the open base file's folder. */
export function resolveNoteCreateFolder(
	app: App,
	el: HTMLElement,
	viewName?: string,
): string | null {
	const hostFolder = resolveEmbedHostFolderPath(app, el);
	if (hostFolder !== null) return hostFolder;

	const baseFile = findBasesFileForElement(app, el, viewName);
	return baseFile ? (baseFile.parent?.path ?? "") : null;
}

export async function createNoteInEmbedHostFolder(
	app: App,
	containerEl: HTMLElement,
	anchorEl: HTMLElement,
): Promise<boolean> {
	const folderPath = resolveEmbedHostFolderPath(app, containerEl);
	if (folderPath === null) {
		new Notice("No folder context. Embed this base in a note to add a file.");
		return false;
	}

	const fileName = resolveUniqueNoteName(app, folderPath);
	const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

	try {
		const file = await app.vault.create(filePath, "");
		await openFileInWorkspace(app, file, { anchorEl });
		return true;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not create note";
		new Notice(`New note: ${message}`);
		return false;
	}
}

export async function createSubfolderInEmbedHostFolder(
	app: App,
	containerEl: HTMLElement,
	anchorEl: HTMLElement,
): Promise<boolean> {
	const parentFolderPath = resolveEmbedHostFolderPath(app, containerEl);
	if (parentFolderPath === null) {
		new Notice("No folder context. Embed this base in a note to add a folder.");
		return false;
	}

	const indexFile = await createUntitledSubfolder(app, parentFolderPath);
	if (!indexFile) return false;

	await openFileInWorkspace(app, indexFile, { anchorEl });
	return true;
}

export function syncBasesViewTopbar(
	container: HTMLElement,
	options: {
		adoptedTitle?: HTMLElement | null;
		addAction?: BasesViewAddAction | null;
	},
): void {
	const adoptedTitle =
		options.adoptedTitle ?? findAdoptedBasesTitle(container);
	if (!adoptedTitle && !options.addAction) {
		container.querySelector(":scope > .nui-bases-view-topbar")?.remove();
		return;
	}

	let topbar = container.querySelector<HTMLElement>(
		":scope > .nui-bases-view-topbar",
	);
	if (!topbar) {
		topbar = container.createDiv("nui-bases-view-topbar");
	} else {
		topbar.empty();
	}
	container.prepend(topbar);

	const titleSlot = topbar.createDiv("nui-bases-view-topbar-title");
	if (adoptedTitle) {
		titleSlot.appendChild(adoptedTitle);
	}

	if (!options.addAction) return;

	createBasesViewAddButton(topbar, options.addAction);
}

export function createBasesViewAddButton(
	parentEl: HTMLElement,
	action: BasesViewAddAction,
	options?: { className?: string },
): HTMLElement {
	const addBtn = parentEl.createSpan({
		cls: options?.className ?? "nui-week-tracker-3-add",
		text: "+",
	});
	addBtn.setAttr("role", "button");
	addBtn.setAttr("tabindex", "0");
	addBtn.title = action.title;
	addBtn.setAttr("aria-label", action.ariaLabel);
	addBtn.addEventListener("click", (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		action.onClick(addBtn);
	});
	return addBtn;
}

