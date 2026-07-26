
import { App, Notice, TFile, TFolder } from "obsidian";
import {
	habitIndexPath,
	habitTagFromName,
	isHabitHubIndexPath,
	listOwnFilesInHabitFolder,
	replaceHabitNameInBasename,
} from "./habit-bundle";

export interface SyncHabitRenameOptions {
	oldName: string;
	newName: string;
	folder: TFolder;
}

/**
 * A habit is renamed by renaming its folder; this brings the day notes along.
 * The hub note is always `index.md`, so it carries no name to update.
 */
export async function syncHabitRename(
	app: App,
	options: SyncHabitRenameOptions,
): Promise<void> {
	const oldName = habitTagFromName(options.oldName);
	const newName = habitTagFromName(options.newName);

	if (!oldName || !newName || oldName === newName) {
		return;
	}

	await renameSiblingFilesAndPatchContents(app, options.folder, oldName, newName);

	// No tag registry to update: the Week x3 and Year trackers resolve habits from
	// the folder tree (listHabitRowsInHostFolder + file.inFolder(this.file.folder)),
	// so a rename needs no base mutation.
}

async function renameSiblingFilesAndPatchContents(
	app: App,
	folder: TFolder,
	oldName: string,
	newName: string,
): Promise<void> {
	// Own files only — a nested habit's day notes belong to that habit.
	const files = listOwnFilesInHabitFolder(app.vault, folder);
	const indexPath = findHubIndexPath(files, folder);

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

function findHubIndexPath(files: TFile[], folder: TFolder): string | null {
	const indexPath = habitIndexPath(folder.path);
	return files.some((file) => file.path === indexPath) ? indexPath : null;
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

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function showHabitRenameError(error: unknown): void {
	const message =
		error instanceof Error ? error.message : "Could not rename habit";
	new Notice(`Habit rename: ${message}`);
}
