export interface NavigationEntryLike {
	file: {
		path: string;
		parent?: {
			path: string;
			name?: string;
		} | null;
	};
}

export function normalizeFolderPath(folderPath: string): string {
	return folderPath.replace(/^\/+|\/+$/g, "");
}

export function isDirectChildFolderIndexPath(
	entry: NavigationEntryLike,
	hostFolderPath: string,
	isIndexPath: (path: string) => boolean,
): boolean {
	const entryFolder = normalizeFolderPath(entry.file.parent?.path ?? "");
	const hostFolder = normalizeFolderPath(hostFolderPath);
	if (entryFolder === hostFolder) return false;
	const prefix = hostFolder ? `${hostFolder}/` : "";
	if (!entryFolder.startsWith(prefix)) return false;
	const relative = entryFolder.slice(prefix.length);
	if (relative.includes("/")) return false;
	return isIndexPath(entry.file.path);
}

export function isSiblingEntry(
	entry: NavigationEntryLike,
	hostFolderPath: string,
): boolean {
	return (
		normalizeFolderPath(entry.file.parent?.path ?? "") ===
		normalizeFolderPath(hostFolderPath)
	);
}

export function folderNameForEntry(entry: NavigationEntryLike): string {
	return entry.file.parent?.name ?? entry.file.parent?.path.split("/").pop() ?? "";
}

export function partitionNavigationEntryPaths<T extends NavigationEntryLike>(
	entries: T[],
	hostFolderPath: string,
	isIndexPath: (path: string) => boolean,
): { folders: T[]; files: T[] } {
	const folders: T[] = [];
	const files: T[] = [];

	for (const entry of entries) {
		if (isDirectChildFolderIndexPath(entry, hostFolderPath, isIndexPath)) {
			folders.push(entry);
		} else if (isSiblingEntry(entry, hostFolderPath)) {
			files.push(entry);
		}
	}

	return { folders, files };
}

export function partitionNavigationEntryPathsForHost<T extends NavigationEntryLike>(
	entries: T[],
	hostFolderPath: string | null,
	isIndexPath: (path: string) => boolean,
): { folders: T[]; files: T[] } {
	if (hostFolderPath === null) {
		return { folders: [], files: [] };
	}
	return partitionNavigationEntryPaths(entries, hostFolderPath, isIndexPath);
}
