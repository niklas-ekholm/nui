/**
 * Pure path contract for habit bundles — no Obsidian imports, so it is unit
 * testable. Mirrors `navigation/folder-index-path.ts`.
 *
 * Habits nest: `Habits/Liikunta` can be a habit that also groups
 * `Habits/Liikunta/Aamujumppa`. Depth is never assumed here.
 */

/** The habits root with any trailing slash removed. */
export function habitsRootPath(calendarFolder: string): string {
	return calendarFolder.trim().replace(/\/$/, "");
}

function normalizeFolderPath(folderPath: string): string {
	return folderPath.trim().replace(/\/+$/, "");
}

/**
 * True when `folderPath` sits anywhere inside the habits root, at any depth.
 * The root is not inside itself, and a sibling like `Habits2` does not match.
 */
export function isPathInsideHabitsRoot(
	folderPath: string,
	calendarFolder: string,
): boolean {
	const root = habitsRootPath(calendarFolder);
	if (!root) return false;

	const path = normalizeFolderPath(folderPath);
	const prefix = `${root}/`;
	return path.startsWith(prefix) && path.length > prefix.length;
}

/** Containing folder path; empty string when the folder sits at the vault root. */
export function parentFolderPathOf(folderPath: string): string {
	const path = normalizeFolderPath(folderPath);
	const slash = path.lastIndexOf("/");
	return slash < 0 ? "" : path.slice(0, slash);
}
