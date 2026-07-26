/**
 * The pure folder-index path contract.
 *
 * The index filename is configurable, but the helpers below are called from
 * deep inside rendering code with no handle on the plugin. The plugin sets the
 * active name once on load and on every settings change; every helper still
 * takes an explicit name, so they stay directly testable.
 */

export const DEFAULT_FOLDER_INDEX_FILENAME = "index.md";

let configuredFilename = DEFAULT_FOLDER_INDEX_FILENAME;

/** Reject anything that is not a bare markdown filename. */
export function normalizeFolderIndexFilename(value: string): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed.includes("/")) {
		return DEFAULT_FOLDER_INDEX_FILENAME;
	}
	return trimmed.toLowerCase().endsWith(".md") ? trimmed : `${trimmed}.md`;
}

export function setFolderIndexFilename(value: string): void {
	configuredFilename = normalizeFolderIndexFilename(value);
}

export function folderIndexFilename(): string {
	return configuredFilename;
}

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

export function getFolderIndexPath(
	folder: FolderPathLike,
	filename: string = folderIndexFilename(),
): string {
	return folder.path ? `${folder.path}/${filename}` : filename;
}

export function getFolderIndexPathFromFolderPath(
	folderPath: string,
	filename: string = folderIndexFilename(),
): string {
	return getFolderIndexPath({ path: folderPath }, filename);
}

export function isFolderIndexPath(
	filePath: string,
	filename: string = folderIndexFilename(),
): boolean {
	return filePath === filename || filePath.endsWith(`/${filename}`);
}

/** Return the containing folder's name for a non-root folder index. */
export function getFolderIndexFolderName(
	filePath: string,
	filename: string = folderIndexFilename(),
): string | null {
	if (!isFolderIndexPath(filePath, filename) || filePath === filename) {
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

/** Root-level agent stub files, hidden from the file explorer but kept on disk. */
export const HIDDEN_NAV_FILE_PATHS = new Set(["AGENTS.md", "CLAUDE.md"]);

export function isHiddenNavFilePath(filePath: string): boolean {
	return HIDDEN_NAV_FILE_PATHS.has(filePath);
}

export interface NavHidingOptions {
	hideIndexInExplorer: boolean;
	hideAgentStubs: boolean;
}

export function shouldHideNavFilePath(
	filePath: string,
	options: NavHidingOptions,
): boolean {
	return (
		(options.hideAgentStubs && isHiddenNavFilePath(filePath)) ||
		(options.hideIndexInExplorer && isFolderIndexPath(filePath))
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
