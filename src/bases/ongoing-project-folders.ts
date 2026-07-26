
import { App, TFile } from "obsidian";
import { isNoteActiveOnDate } from "../core/parse/dates";

export const DEFAULT_TIMELINE_FOLDERS = ["index"];

export function parseTimelineFolders(value: unknown): string[] {
	if (typeof value !== "string" || !value.trim()) {
		return DEFAULT_TIMELINE_FOLDERS;
	}

	const folders = value
		.split(/[\n,]+/)
		.map((folder) => folder.trim())
		.filter(Boolean);

	return folders.length > 0 ? folders : DEFAULT_TIMELINE_FOLDERS;
}

export function isActiveTaskNote(
	app: App,
	filePath: string,
	today: Date = new Date(),
): boolean {
	const file = app.vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) return false;

	const frontmatter =
		app.metadataCache.getFileCache(file)?.frontmatter ?? {};
	return isNoteActiveOnDate(frontmatter, today);
}
