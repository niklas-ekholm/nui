
import { App, Notice, TFile, TFolder } from "obsidian";
import { isFolderIndexPath, isSameNamedFolderNote } from "../navigation/folder-index-path";
import {
	DEFAULT_CALENDAR_FOLDER,
	habitIndexPath,
	habitTagFromName,
	isHabitHubIndexPath,
	legacyHabitIndexPath,
	listOwnFilesInHabitFolder,
	replaceHabitNameInBasename,
} from "./habit-bundle";
import { isPathInsideHabitsRoot, siblingHabitFolderPath } from "./habit-path";

export type HabitRenameTrigger = "folder" | "index";

export interface SyncHabitRenameOptions {
	oldName: string;
	newName: string;
	folder: TFolder;
	trigger: HabitRenameTrigger;
	calendarFolder?: string;
}

export async function syncHabitRename(
	app: App,
	options: SyncHabitRenameOptions,
): Promise<void> {
	const oldName = habitTagFromName(options.oldName);
	const newName = habitTagFromName(options.newName);
	let folder = options.folder;

	if (!oldName || !newName) {
		return;
	}

	if (oldName === newName) {
		if (options.trigger === "folder") {
			await syncHubIndexRename(app, folder, oldName, newName);
		}
		return;
	}

	if (options.trigger === "index") {
		// Beside itself, not at the habits root — a nested habit must not be hoisted.
		const targetFolderPath = siblingHabitFolderPath(folder.path, newName);
		const existingFolder = app.vault.getAbstractFileByPath(targetFolderPath);
		if (existingFolder && existingFolder.path !== folder.path) {
			throw new Error(`Habit "${newName}" already exists.`);
		}
	}

	await renameSiblingFilesAndPatchContents(app, folder, oldName, newName);

	if (options.trigger === "index") {
		if (folder.name !== newName) {
			folder = await renameHabitFolder(app, folder, newName);
		}
	} else {
		await syncHubIndexRename(app, folder, oldName, newName);
	}

	// No tag registry to update: the Week x3 and Year trackers resolve habits from
	// the folder tree (listHabitRowsInHostFolder + file.inFolder(this.file.folder)),
	// so a rename needs no base mutation. See dev/doc-drift-audit.
}

async function renameSiblingFilesAndPatchContents(
	app: App,
	folder: TFolder,
	oldName: string,
	newName: string,
): Promise<void> {
	// Own files only — a nested habit's day notes belong to that habit.
	const files = listOwnFilesInHabitFolder(app.vault, folder);
	const indexPath = findHubIndexPath(files, folder, oldName, newName);

	const renames: Array<{ file: TFile; newPath: string }> = [];

	for (const file of files) {
		if (indexPath && file.path === indexPath) {
			continue;
		}

		const newBasename = replaceHabitNameInBasename(file.basename, oldName, newName);
		if (newBasename === file.basename) {
			continue;
		}

		// Rename in place: the walk can reach plain subfolders, and a file there
		// must not be hoisted into the habit folder root.
		const parentPath = file.parent?.path ?? folder.path;
		const newPath = `${parentPath}/${newBasename}.${file.extension}`;
		if (newPath === file.path) {
			continue;
		}

		const targetExists = app.vault.getAbstractFileByPath(newPath);
		if (targetExists instanceof TFile && targetExists.path !== file.path) {
			throw new Error(`Cannot rename "${file.name}" — "${newBasename}.${file.extension}" already exists.`);
		}

		renames.push({ file, newPath });
	}

	for (const { file, newPath } of renames) {
		const wasDayNote = isHabitDayNote(file, oldName);
		await app.fileManager.renameFile(file, newPath);
		if (wasDayNote) {
			const renamed = app.vault.getAbstractFileByPath(newPath);
			if (renamed instanceof TFile) {
				await patchDayNoteContent(app, renamed, oldName, newName);
			}
		}
	}
}

function findHubIndexPath(
	files: TFile[],
	folder: TFolder,
	oldName: string,
	newName: string,
): string | null {
	const candidates = [
		habitIndexPath(folder.path),
		legacyHabitIndexPath(folder.path, oldName),
		legacyHabitIndexPath(folder.path, newName),
		legacyHabitIndexPath(folder.path, folder.name),
	];
	for (const path of candidates) {
		if (files.some((file) => file.path === path)) {
			return path;
		}
	}
	return null;
}

function isHabitDayNote(file: TFile, habitName: string): boolean {
	if (file.extension !== "md") {
		return false;
	}
	const parentPath = file.parent?.path ?? "";
	if (isHabitHubIndexPath(file.path, parentPath)) {
		return false;
	}
	return file.basename.endsWith(` ${habitName}`);
}

async function patchDayNoteContent(
	app: App,
	file: TFile,
	oldName: string,
	newName: string,
): Promise<void> {
	const content = await app.vault.read(file);
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) {
		return;
	}

	const frontmatter = match[1];
	const rest = content.slice(match[0].length);
	const updatedFrontmatter = frontmatter.replace(
		new RegExp(`^(\\s*-\\s*)${escapeRegExp(oldName)}\\s*$`, "m"),
		`$1${newName}`,
	);

	if (updatedFrontmatter === frontmatter) {
		return;
	}

	await app.vault.modify(file, `---\n${updatedFrontmatter}\n---${rest}`);
}

async function syncHubIndexRename(
	app: App,
	folder: TFolder,
	oldName: string,
	newName: string,
): Promise<void> {
	if (app.vault.getAbstractFileByPath(habitIndexPath(folder.path)) instanceof TFile) {
		return;
	}

	const stalePath = legacyHabitIndexPath(folder.path, oldName);
	const targetPath = legacyHabitIndexPath(folder.path, newName);
	if (stalePath === targetPath) {
		return;
	}

	const staleFile = app.vault.getAbstractFileByPath(stalePath);
	if (!(staleFile instanceof TFile)) {
		return;
	}

	const targetExists = app.vault.getAbstractFileByPath(targetPath);
	if (targetExists instanceof TFile) {
		return;
	}

	await app.fileManager.renameFile(staleFile, targetPath);
}

async function renameHabitFolder(
	app: App,
	folder: TFolder,
	newName: string,
): Promise<TFolder> {
	if (folder.name === newName) {
		return folder;
	}

	const newFolderPath = folder.parent
		? `${folder.parent.path}/${newName}`
		: newName;

	const existing = app.vault.getAbstractFileByPath(newFolderPath);
	if (existing && existing.path !== folder.path) {
		throw new Error(`Habit "${newName}" already exists.`);
	}

	await app.fileManager.renameFile(folder, newFolderPath);
	const updated = app.vault.getAbstractFileByPath(newFolderPath);
	if (!(updated instanceof TFolder)) {
		throw new Error(`Could not rename habit folder to "${newName}".`);
	}
	return updated;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isHabitHubIndexRename(
	file: TFile,
	oldPath: string,
	calendarFolder: string = DEFAULT_CALENDAR_FOLDER,
): boolean {
	const parent = file.parent;
	if (!(parent instanceof TFolder)) {
		return false;
	}

	if (!isPathInsideHabitsRoot(parent.path, calendarFolder)) {
		return false;
	}

	if (isFolderIndexPath(oldPath)) {
		return false;
	}

	return isSameNamedFolderNote(oldPath);
}

export function showHabitRenameError(error: unknown): void {
	const message =
		error instanceof Error ? error.message : "Could not rename habit";
	new Notice(`Habit rename: ${message}`);
}
