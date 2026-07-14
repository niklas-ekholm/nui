
import { App, Notice, TFile, TFolder } from "obsidian";
import { isFolderIndexPath } from "../navigation/folder-index";
import {
	DEFAULT_CALENDAR_FOLDER,
	DEFAULT_WEEKLY_HABITS_BASE_PATH,
	habitFolderPath,
	habitIndexPath,
	habitTagFromName,
	listFilesInHabitFolder,
	replaceHabitNameInBasename,
} from "./habit-bundle";
import { renameTagInWeeklyHabitsBase } from "./weekly-habits-base";

export type HabitRenameTrigger = "folder" | "index";

export interface SyncHabitRenameOptions {
	oldName: string;
	newName: string;
	folder: TFolder;
	trigger: HabitRenameTrigger;
	calendarFolder?: string;
	weeklyHabitsBasePath?: string;
}

export async function syncHabitRename(
	app: App,
	options: SyncHabitRenameOptions,
): Promise<void> {
	const calendarFolder = options.calendarFolder ?? DEFAULT_CALENDAR_FOLDER;
	const weeklyHabitsBasePath =
		options.weeklyHabitsBasePath ?? DEFAULT_WEEKLY_HABITS_BASE_PATH;

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
		const targetFolderPath = habitFolderPath(calendarFolder, newName);
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

	await renameTagInWeeklyHabitsBase(
		app,
		oldName,
		newName,
		weeklyHabitsBasePath,
	);
}

async function renameSiblingFilesAndPatchContents(
	app: App,
	folder: TFolder,
	oldName: string,
	newName: string,
): Promise<void> {
	const files = listFilesInHabitFolder(app.vault, folder);
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

		const newPath = `${folder.path}/${newBasename}.${file.extension}`;
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
		habitIndexPath(folder.path, oldName),
		habitIndexPath(folder.path, newName),
		habitIndexPath(folder.path, folder.name),
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
	if (isFolderIndexPath(file.path)) {
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
	const stalePath = habitIndexPath(folder.path, oldName);
	const targetPath = habitIndexPath(folder.path, newName);
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
	if (!isFolderIndexPath(oldPath)) {
		return false;
	}
	const parent = file.parent;
	if (!(parent instanceof TFolder)) {
		return false;
	}
	const habitsRoot = calendarFolder.trim().replace(/\/$/, "");
	return parent.parent?.path === habitsRoot;
}

export function showHabitRenameError(error: unknown): void {
	const message =
		error instanceof Error ? error.message : "Could not rename habit";
	new Notice(`Habit rename: ${message}`);
}
