
import { App, BasesEntry } from "obsidian";
import { filterNavVisibleFolderEntries } from "../navigation/hub-nav";

export function isDirectChildFolderIndex(
	entry: BasesEntry,
	hostFolderPath: string,
): boolean {
	const entryFolder = entry.file.parent?.path ?? "";
	if (entryFolder === hostFolderPath) return false;
	const prefix = `${hostFolderPath}/`;
	if (!entryFolder.startsWith(prefix)) return false;
	const relative = entryFolder.slice(prefix.length);
	if (relative.includes("/")) return false;
	return entry.file.basename === relative;
}

export function isSiblingFile(
	entry: BasesEntry,
	hostFolderPath: string,
): boolean {
	return entry.file.parent?.path === hostFolderPath;
}

export function partitionNavigationEntries(
	app: App,
	entries: BasesEntry[],
	hostFolderPath: string | null,
): { folders: BasesEntry[]; files: BasesEntry[] } {
	if (!hostFolderPath) {
		return { folders: [], files: [] };
	}

	const folders: BasesEntry[] = [];
	const files: BasesEntry[] = [];

	for (const entry of entries) {
		if (isDirectChildFolderIndex(entry, hostFolderPath)) {
			folders.push(entry);
		} else if (isSiblingFile(entry, hostFolderPath)) {
			files.push(entry);
		}
	}

	return {
		folders: filterNavVisibleFolderEntries(app, folders),
		files,
	};
}

