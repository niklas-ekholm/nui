/**
 * The pure folder-index path contract.
 *
 * A folder's hub note is named after the folder itself — `{FolderName}.md`.
 * The vault root has no folder name of its own, so its hub is named after
 * the vault instead — `{VaultName}.md` — set once via `setVaultRootName` when
 * the plugin loads (an intrinsic fact about the environment, not a user
 * setting, the same way a folder's own name isn't configurable). The root
 * therefore behaves like every other folder: its hub is `{VaultName}.md`,
 * and — only if the root is itself marked OKF — its sidecar is the fixed
 * `index.md`, a distinct file from the hub.
 */

const DEFAULT_ROOT_NAME = "index";

let cachedRootName = DEFAULT_ROOT_NAME;

/** Call once on plugin load with `app.vault.getName()`. */
export function setVaultRootName(name: string): void {
	const trimmed = name.trim();
	cachedRootName = trimmed || DEFAULT_ROOT_NAME;
}

function rootHubFilename(): string {
	return `${cachedRootName}.md`;
}

/**
 * OKF's reserved directory-listing filename (spec §3.1). Fixed, not
 * user-configurable: it is generated as a secondary sidecar alongside a
 * folder's `{FolderName}.md` hub, only in folders that belong to a space
 * marked as an OKF bundle (see `navigation/okf-space.ts`).
 */
export const OKF_SIDECAR_FILENAME = "index.md";

export interface FolderPathLike {
	path: string;
	name: string;
}

/**
 * Obsidian's root folder reports `path: "/"`, while every other folder's path
 * has no leading slash and the rest of this module treats `""` as the root.
 * Left unnormalised, the root's hub resolves to `"//{VaultName}.md"`, which
 * `getAbstractFileByPath` never matches — so the hub is never found, and
 * `vault.create` quietly normalises the same string and reports the file as
 * already existing. Mirrors `bases/navigation-entry-path.ts`.
 */
function normalizeFolderPath(folderPath: string): string {
	return folderPath.replace(/^\/+|\/+$/g, "");
}

/** Resolve a vault folder path; empty string or "/" is the vault root (not getAbstractFileByPath). */
export function resolveFolderPath<T extends { path: string }>(
	folderPath: string,
	getRoot: () => T,
	getFolder: (path: string) => T | null,
): T | null {
	const normalized = normalizeFolderPath(folderPath);
	if (normalized === "") {
		return getRoot();
	}
	return getFolder(normalized);
}

function hubFilenameForFolderName(folderName: string): string {
	return folderName ? `${folderName}.md` : rootHubFilename();
}

export function getFolderIndexPath(folder: FolderPathLike): string {
	const path = normalizeFolderPath(folder.path);
	return path
		? `${path}/${hubFilenameForFolderName(folder.name)}`
		: rootHubFilename();
}

export function getFolderIndexPathFromFolderPath(folderPath: string): string {
	const path = normalizeFolderPath(folderPath);
	const name = path.split("/").pop() ?? "";
	return getFolderIndexPath({ path, name });
}

/** True when `filePath` is a folder's own hub note: `{folderName}.md`, or the root `{VaultName}.md`. */
export function isFolderIndexPath(filePath: string): boolean {
	const parts = filePath.split("/");
	const fileName = parts.pop();
	if (!fileName || !fileName.toLowerCase().endsWith(".md")) {
		return false;
	}

	const folderName = parts.at(-1);
	if (!folderName) {
		return fileName === rootHubFilename();
	}

	return fileName === `${folderName}.md`;
}

/** True when `filePath` is an OKF directory-listing sidecar (fixed `index.md`, any folder). */
export function isOkfSidecarPath(filePath: string): boolean {
	return (
		filePath === OKF_SIDECAR_FILENAME ||
		filePath.endsWith(`/${OKF_SIDECAR_FILENAME}`)
	);
}

/** Return the containing folder's name for a non-root folder index. */
export function getFolderIndexFolderName(filePath: string): string | null {
	if (!isFolderIndexPath(filePath)) {
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
export function resolveParentFolderPathFromFilePath(
	filePath: string,
	folderIndexExists: (indexPath: string) => boolean = () => false,
): string | null {
	const slash = filePath.lastIndexOf("/");
	if (slash < 0) {
		return null;
	}

	const containingFolderPath = filePath.slice(0, slash);

	if (isFolderIndexPath(filePath)) {
		const parentSlash = containingFolderPath.lastIndexOf("/");
		return parentSlash >= 0 ? containingFolderPath.slice(0, parentSlash) : "";
	}

	const containingIndexPath =
		getFolderIndexPathFromFolderPath(containingFolderPath);
	if (
		containingIndexPath !== filePath &&
		folderIndexExists(containingIndexPath)
	) {
		return containingFolderPath;
	}

	const parentSlash = containingFolderPath.lastIndexOf("/");
	return parentSlash >= 0 ? containingFolderPath.slice(0, parentSlash) : "";
}
