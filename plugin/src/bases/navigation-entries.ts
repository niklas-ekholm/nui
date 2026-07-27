
import type { App, BasesEntry } from "obsidian";
import { filterNavVisibleFolderEntries } from "../navigation/hub-nav";
import { isFolderIndexPath } from "../navigation/folder-index-path";
import {
	folderNameForEntry,
	isDirectChildFolderIndexPath,
	isSiblingEntry,
	partitionNavigationEntryPathsForHost,
} from "./navigation-entry-path";

export function isDirectChildFolderIndex(
	entry: BasesEntry,
	hostFolderPath: string,
): boolean {
	return isDirectChildFolderIndexPath(
		entry,
		hostFolderPath,
		isFolderIndexPath,
	);
}

export function folderEntryTitle(entry: BasesEntry): string {
	return folderNameForEntry(entry);
}

export function isSiblingFile(
	entry: BasesEntry,
	hostFolderPath: string,
): boolean {
	return isSiblingEntry(entry, hostFolderPath);
}

export function partitionNavigationEntries(
	app: App,
	entries: BasesEntry[],
	hostFolderPath: string | null,
): { folders: BasesEntry[]; files: BasesEntry[] } {
	const { folders, files } = partitionNavigationEntryPathsForHost(
		entries,
		hostFolderPath,
		isFolderIndexPath,
	);

	return {
		folders: filterNavVisibleFolderEntries(app, folders),
		files,
	};
}

