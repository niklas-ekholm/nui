import { App, Notice, TFolder } from "obsidian";

export const BREADCRUMB_FOLDER_EDITING_CLASS = "nui-breadcrumb-folder-editing";
const FOLDER_PATH_ATTR = "nuiFolderPath";

function selectContents(el: HTMLElement): void {
	const range = document.createRange();
	range.selectNodeContents(el);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}

function syncBreadcrumbText(breadcrumbEl: HTMLElement, folder: TFolder): void {
	if (breadcrumbEl.classList.contains(BREADCRUMB_FOLDER_EDITING_CLASS)) {
		return;
	}
	breadcrumbEl.textContent = folder.name;
}

function endEditing(breadcrumbEl: HTMLElement): void {
	breadcrumbEl.contentEditable = "false";
	breadcrumbEl.classList.remove(BREADCRUMB_FOLDER_EDITING_CLASS);
	delete breadcrumbEl.dataset.nuiBreadcrumbEditing;
}

async function commitFolderRename(
	app: App,
	breadcrumbEl: HTMLElement,
	folder: TFolder,
): Promise<void> {
	const folderPath = breadcrumbEl.dataset[FOLDER_PATH_ATTR];
	const currentFolder = folderPath
		? app.vault.getAbstractFileByPath(folderPath)
		: folder;
	const targetFolder = currentFolder instanceof TFolder ? currentFolder : folder;

	const rawName = (breadcrumbEl.textContent ?? "").replace(/\s+/g, " ").trim();
	if (!rawName || rawName === targetFolder.name) {
		syncBreadcrumbText(breadcrumbEl, targetFolder);
		return;
	}

	if (/[\\/]/.test(rawName)) {
		new Notice("Folder name cannot contain slashes.");
		syncBreadcrumbText(breadcrumbEl, targetFolder);
		return;
	}

	const parentPath = targetFolder.parent?.path ?? "";
	const newPath = parentPath ? `${parentPath}/${rawName}` : rawName;

	if (app.vault.getAbstractFileByPath(newPath)) {
		new Notice(`Folder "${rawName}" already exists.`);
		syncBreadcrumbText(breadcrumbEl, targetFolder);
		return;
	}

	try {
		await app.fileManager.renameFile(targetFolder, newPath);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not rename folder";
		new Notice(message);
		if (breadcrumbEl.isConnected) {
			syncBreadcrumbText(breadcrumbEl, targetFolder);
		}
	}
}

export function isBreadcrumbFolderEditing(): boolean {
	return !!document.querySelector(`.${BREADCRUMB_FOLDER_EDITING_CLASS}`);
}

export function beginBreadcrumbFolderRename(
	app: App,
	breadcrumbEl: HTMLElement,
	folder: TFolder,
): boolean {
	if (!breadcrumbEl.isConnected) {
		return false;
	}
	if (breadcrumbEl.classList.contains(BREADCRUMB_FOLDER_EDITING_CLASS)) {
		return true;
	}

	breadcrumbEl.dataset[FOLDER_PATH_ATTR] = folder.path;
	breadcrumbEl.textContent = folder.name;
	breadcrumbEl.contentEditable = "true";
	breadcrumbEl.classList.add(BREADCRUMB_FOLDER_EDITING_CLASS);
	breadcrumbEl.dataset.nuiBreadcrumbEditing = "true";
	breadcrumbEl.spellcheck = false;

	const onBlur = () => {
		if (!breadcrumbEl.classList.contains(BREADCRUMB_FOLDER_EDITING_CLASS)) {
			return;
		}
		endEditing(breadcrumbEl);
		cleanup();
		void commitFolderRename(app, breadcrumbEl, folder);
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (!breadcrumbEl.classList.contains(BREADCRUMB_FOLDER_EDITING_CLASS)) {
			return;
		}

		if (event.key === "Enter" || event.key === "Tab") {
			event.preventDefault();
			breadcrumbEl.blur();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			syncBreadcrumbText(breadcrumbEl, folder);
			endEditing(breadcrumbEl);
			cleanup();
			breadcrumbEl.blur();
		}
	};

	const stopPointer = (event: Event) => {
		event.stopPropagation();
	};

	const cleanup = () => {
		breadcrumbEl.removeEventListener("blur", onBlur);
		breadcrumbEl.removeEventListener("keydown", onKeydown);
		breadcrumbEl.removeEventListener("click", stopPointer, true);
		breadcrumbEl.removeEventListener("pointerdown", stopPointer, true);
	};

	breadcrumbEl.addEventListener("blur", onBlur);
	breadcrumbEl.addEventListener("keydown", onKeydown);
	breadcrumbEl.addEventListener("click", stopPointer, true);
	breadcrumbEl.addEventListener("pointerdown", stopPointer, true);

	breadcrumbEl.focus();
	selectContents(breadcrumbEl);
	return true;
}
