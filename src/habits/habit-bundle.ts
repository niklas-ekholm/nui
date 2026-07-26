
import { TFile, TFolder, Vault } from "obsidian";
import { getFolderIndexPath } from "../navigation/folder-index-path";
import { isPathInsideHabitsRoot } from "./habit-path";

/**
 * Habits are resolved from the folder tree, not from a tag registry: the Week x3
 * tracker lists sibling folders and both trackers query
 * `file.inFolder(this.file.folder)`. Nothing may write habit names into a `.base`.
 */
export const DEFAULT_CALENDAR_FOLDER = "Habits";
export const UNTITLED_HABIT_NAME = "Untitled";

const ISO_DAY_BASENAME = /^(\d{4}-\d{2}-\d{2})(?:\s|$)/i;

export function habitFolderPath(calendarFolder: string, name: string): string {
	const base = calendarFolder.trim().replace(/\/$/, "");
	return base ? `${base}/${name}` : name;
}

/** A habit's hub note — always `index.md` in the habit folder. */
export function habitIndexPath(folderPath: string): string {
	return getFolderIndexPath({ path: folderPath });
}

export function habitTagFromName(name: string): string {
	return name.trim();
}

export function resolveUniqueHabitName(
	vault: Vault,
	calendarFolder: string,
): string {
	let candidate = UNTITLED_HABIT_NAME;
	let counter = 2;
	while (vault.getAbstractFileByPath(habitFolderPath(calendarFolder, candidate))) {
		candidate = `${UNTITLED_HABIT_NAME} ${counter}`;
		counter++;
	}
	return candidate;
}

export function buildHabitIndexContent(name: string, year: number): string {
	return `# ${name}\n\n![[Year.base#${year}]]\n`;
}

export function buildMinimalDayNoteContent(): string {
	return "---\n\n\n";
}

/** True when `folder` sits anywhere inside the habits root, at any depth. */
export function isInsideHabitsRoot(
	folder: TFolder,
	calendarFolder: string,
): boolean {
	return isPathInsideHabitsRoot(folder.path, calendarFolder);
}

/**
 * True when renaming `folder` should sync a habit bundle.
 *
 * The gate is deliberately the same one the trackers use to build rows
 * (`isHabitBundleFolder`), so anything that appears as a habit row renames like
 * one — including a habit nested under a group folder, e.g.
 * `Habits/Liikunta/Aamujumppa`. Plain subfolders inside a habit (attachments and
 * the like) have no hub note and are skipped.
 */
export function isHabitBundleRename(
	vault: Vault,
	folder: TFolder,
	calendarFolder: string,
): boolean {
	return (
		isInsideHabitsRoot(folder, calendarFolder) &&
		isHabitBundleFolder(vault, folder)
	);
}

export function buildHabitDayFileName(dateKey: string, tag: string): string {
	return `${dateKey} ${tag}.md`;
}

export function replaceHabitNameInBasename(
	basename: string,
	oldName: string,
	newName: string,
): string {
	if (!basename.includes(oldName)) {
		return basename;
	}
	return basename.split(oldName).join(newName);
}

export function listFilesInHabitFolder(vault: Vault, folder: TFolder): TFile[] {
	const result: TFile[] = [];
	const walk = (current: TFolder): void => {
		for (const child of current.children) {
			if (child instanceof TFile) {
				result.push(child);
			} else if (child instanceof TFolder) {
				walk(child);
			}
		}
	};
	walk(folder);
	return result;
}

/**
 * Files belonging to this habit and no other: the walk stops at any nested habit
 * bundle, because those files are named after *that* habit.
 *
 * Renaming a group such as `Habits/Liikunta` must not rewrite the day notes of
 * `Habits/Liikunta/Aamujumppa`. Plain subfolders (attachments and the like) have
 * no hub note, so they are still descended into.
 */
export function listOwnFilesInHabitFolder(vault: Vault, folder: TFolder): TFile[] {
	const result: TFile[] = [];
	const walk = (current: TFolder): void => {
		for (const child of current.children) {
			if (child instanceof TFile) {
				result.push(child);
			} else if (child instanceof TFolder && !isHabitBundleFolder(vault, child)) {
				walk(child);
			}
		}
	};
	walk(folder);
	return result;
}

export function isHabitHubIndexPath(filePath: string, folderPath: string): boolean {
	return filePath === getFolderIndexPath({ path: folderPath });
}

/** A folder is a habit when it has a hub note; that is the whole contract. */
export function isHabitBundleFolder(vault: Vault, folder: TFolder): boolean {
	return (
		vault.getAbstractFileByPath(habitIndexPath(folder.path)) instanceof TFile
	);
}

function isDirectDayNoteFile(file: TFile, folder: TFolder): boolean {
	if (file.extension !== "md") {
		return false;
	}
	if (isHabitHubIndexPath(file.path, folder.path)) {
		return false;
	}
	return ISO_DAY_BASENAME.test(file.basename);
}

function hasDirectDayNotes(vault: Vault, folder: TFolder): boolean {
	for (const child of folder.children) {
		if (child instanceof TFile && isDirectDayNoteFile(child, folder)) {
			return true;
		}
	}
	return false;
}

function shouldIncludeHostAsHabitRow(vault: Vault, host: TFolder): boolean {
	if (!isHabitBundleFolder(vault, host)) {
		return false;
	}
	if (listHabitRowsInFolder(vault, host).length === 0) {
		return true;
	}
	return hasDirectDayNotes(vault, host);
}

function listHabitRowsInFolder(vault: Vault, parent: TFolder): string[] {
	return parent.children
		.filter((child): child is TFolder => child instanceof TFolder)
		.filter((folder) => isHabitBundleFolder(vault, folder))
		.map((folder) => folder.name)
		.sort((a, b) => a.localeCompare(b));
}

export function listHabitRowsInHostFolder(vault: Vault, hostFolder: string): string[] {
	const host = vault.getAbstractFileByPath(hostFolder);
	if (!(host instanceof TFolder)) {
		return [];
	}

	const rows = listHabitRowsInFolder(vault, host);
	if (shouldIncludeHostAsHabitRow(vault, host)) {
		const name = host.name;
		if (!rows.includes(name)) {
			rows.push(name);
			rows.sort((a, b) => a.localeCompare(b));
		}
	}

	return rows;
}

export function habitFolderPathInHost(hostFolder: string, habitName: string): string {
	const base = hostFolder.trim().replace(/\/$/, "");
	return base ? `${base}/${habitName.trim()}` : habitName.trim();
}
