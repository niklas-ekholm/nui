
import { TFile, TFolder, Vault } from "obsidian";
import { isFolderIndexPath } from "../navigation/folder-index";

export const DEFAULT_WEEKLY_HABITS_BASE_PATH = "index/Tracker.base";
export const DEFAULT_CALENDAR_BASE_PATH = "index/Calendar.base";
export const DEFAULT_CALENDAR_FOLDER = "index/𓂀/Habits";
export const UNTITLED_HABIT_NAME = "Untitled";

export function habitFolderPath(calendarFolder: string, name: string): string {
	const base = calendarFolder.trim().replace(/\/$/, "");
	return base ? `${base}/${name}` : name;
}

export function habitIndexPath(folderPath: string, name: string): string {
	return `${folderPath}/${name}.md`;
}

export function habitBaseFileName(name: string, year: number): string {
	return `${name.trim()}${year}.base`;
}

export function habitBasePath(
	calendarFolder: string,
	name: string,
	year: number,
): string {
	const folderPath = habitFolderPath(calendarFolder, name);
	return `${folderPath}/${habitBaseFileName(name, year)}`;
}

export function habitTagFromName(name: string): string {
	return name.trim();
}

export function habitNameFromBaseBasename(basename: string, year: number): string | null {
	const suffix = String(year);
	if (!basename.endsWith(suffix)) return null;
	const display = basename.slice(0, -suffix.length);
	if (!display) return null;
	return display;
}

export function isHabitFolderPath(
	folderPath: string,
	calendarFolder: string,
): boolean {
	const base = calendarFolder.trim().replace(/\/$/, "");
	if (!base) return false;
	const prefix = `${base}/`;
	return folderPath.startsWith(prefix) && !folderPath.slice(prefix.length).includes("/");
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
	void name;
	return `\n![[Year.base#${year}]]\n`;
}

export function buildMinimalDayNoteContent(): string {
	return "---\n\n\n";
}

export function buildHabitYearIndexContent(): string {
	return `\n![[Calendar.base#Year]]\n`;
}

export function habitYearFolderPath(habitFolderPath: string, year: number): string {
	return `${habitFolderPath.replace(/\/$/, "")}/${year}`;
}

export function habitDayFolderPath(
	calendarFolder: string,
	tag: string,
	year: number,
): string {
	return habitYearFolderPath(habitFolderPath(calendarFolder, tag), year);
}

export function buildHabitYearBaseContent(
	tag: string,
	year: number,
	calendarFolder: string,
): string {
	const lines = [
		"views:",
		"  - type: nui-year-tracker",
		"    name: Year",
		"    filters:",
		"      and:",
		`        - file.hasTag("${tag}")`,
		"    dateField: note.date",
		`    year: "${year}"`,
		`    tag: ${tag}`,
		`    calendarFolder: ${calendarFolder}`,
		"",
	];
	return lines.join("\n");
}

export function getHabitFolderParent(calendarFolder: string): string {
	return calendarFolder.trim().replace(/\/$/, "");
}

export function isChildOfHabitsRoot(
	folder: TFolder,
	calendarFolder: string,
): boolean {
	const habitsRoot = getHabitFolderParent(calendarFolder);
	return folder.parent?.path === habitsRoot;
}

export function filterExistingHabitTags(
	vault: Vault,
	tags: string[],
	calendarFolder: string,
): string[] {
	return tags.filter((tag) => habitFolderExists(vault, calendarFolder, tag));
}

export function habitFolderExists(
	vault: Vault,
	calendarFolder: string,
	tag: string,
): boolean {
	const folderPath = habitFolderPath(calendarFolder, tag);
	const folder = vault.getAbstractFileByPath(folderPath);
	return folder instanceof TFolder;
}

export function buildHabitDayFileName(dateKey: string, tag: string): string {
	return `${dateKey} ${tag}.md`;
}

export function buildHabitDayNoteContent(
	dateField: string,
	dateKey: string,
	tag: string,
): string {
	const lines = [
		"---",
		`${dateField}: ${dateKey}`,
		"tags:",
		`  - ${tag}`,
		"---",
		"",
	];
	return lines.join("\n");
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

export function resolveYearBasesInFolder(
	files: TFile[],
): Array<{ file: TFile; year: number; habitName: string }> {
	const result: Array<{ file: TFile; year: number; habitName: string }> = [];
	for (const file of files) {
		const match = file.basename.match(/(\d{4})$/);
		if (!match) continue;
		const year = Number.parseInt(match[1], 10);
		const habitName = habitNameFromBaseBasename(file.basename, year);
		if (habitName) {
			result.push({ file, year, habitName });
		}
	}
	return result;
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

export function listHabitFolderNames(
	vault: Vault,
	calendarFolder: string,
): string[] {
	const habitsRoot = vault.getAbstractFileByPath(
		calendarFolder.trim().replace(/\/$/, ""),
	);
	if (!(habitsRoot instanceof TFolder)) {
		return [];
	}

	return habitsRoot.children
		.filter((child): child is TFolder => child instanceof TFolder)
		.map((folder) => folder.name)
		.sort((a, b) => a.localeCompare(b));
}

export function resolveHabitNameFromPath(
	filePath: string,
	calendarFolder: string,
): string | null {
	const habitsRoot = calendarFolder.trim().replace(/\/$/, "");
	if (!habitsRoot || !filePath.startsWith(`${habitsRoot}/`)) {
		return null;
	}

	const relative = filePath.slice(habitsRoot.length + 1);
	const habitName = relative.split("/")[0];
	return habitName || null;
}

export function isHabitBundleFolder(vault: Vault, folder: TFolder): boolean {
	const hubPath = habitIndexPath(folder.path, folder.name);
	if (!isFolderIndexPath(hubPath)) {
		return false;
	}
	const hub = vault.getAbstractFileByPath(hubPath);
	return hub instanceof TFile;
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

	return listHabitRowsInFolder(vault, host);
}

export function habitFolderPathInHost(hostFolder: string, habitName: string): string {
	const base = hostFolder.trim().replace(/\/$/, "");
	return base ? `${base}/${habitName.trim()}` : habitName.trim();
}
