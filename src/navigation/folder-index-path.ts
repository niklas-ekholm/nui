export interface FolderPathLike {
	path: string;
}

/** Resolve a vault folder path; empty string is the vault root (not getAbstractFileByPath). */
export function resolveFolderPath(
	folderPath: string,
	getRoot: () => FolderPathLike,
	getFolder: (path: string) => FolderPathLike | null,
): FolderPathLike | null {
	if (folderPath === "") {
		return getRoot();
	}
	return getFolder(folderPath);
}

export function getFolderIndexPath(folder: FolderPathLike): string {
	return folder.path ? `${folder.path}/index.md` : "index.md";
}

export function getFolderIndexPathFromFolderPath(folderPath: string): string {
	return getFolderIndexPath({ path: folderPath });
}

export function isFolderIndexPath(filePath: string): boolean {
	return filePath === "index.md" || filePath.endsWith("/index.md");
}

/** Return the containing folder's name for a non-root folder index. */
export function getFolderIndexFolderName(filePath: string): string | null {
	if (!isFolderIndexPath(filePath) || filePath === "index.md") {
		return null;
	}

	const parts = filePath.split("/");
	return parts.at(-2) ?? null;
}

/** Basename for UI labels; folder indexes use their parent folder name. */
export function displayBasenameForNotePath(filePath: string): string {
	const folderName = getFolderIndexFolderName(filePath);
	if (folderName) return folderName;

	const base = filePath.split("/").pop() ?? filePath;
	return base.replace(/\.md$/i, "");
}

/** Root-level agent stub files — hidden from the file explorer but kept on disk. */
export const HIDDEN_NAV_FILE_PATHS = new Set(["AGENTS.md", "CLAUDE.md"]);

export function isHiddenNavFilePath(filePath: string): boolean {
	return HIDDEN_NAV_FILE_PATHS.has(filePath);
}

export function shouldHideNavFilePath(
	filePath: string,
	hideIndexInExplorer: boolean,
): boolean {
	return (
		isHiddenNavFilePath(filePath) ||
		(hideIndexInExplorer && isFolderIndexPath(filePath))
	);
}

/** Parent folder path for go-to-parent; null when the file lives at vault root. */
export function resolveParentFolderPathFromFilePath(filePath: string): string | null {
	const slash = filePath.lastIndexOf("/");
	if (slash < 0) {
		return null;
	}

	const containingFolderPath = filePath.slice(0, slash);
	const parentSlash = containingFolderPath.lastIndexOf("/");
	return parentSlash >= 0 ? containingFolderPath.slice(0, parentSlash) : "";
}
