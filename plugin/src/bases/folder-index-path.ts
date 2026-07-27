
import { App, TFile } from "obsidian";
import { getFolderIndexPathFromFolderPath } from "../navigation/folder-index-path";

export interface ResolvedFolderIndex {
	path: string;
	basename: string;
}

export function folderBasename(folderPath: string): string {
	const normalized = folderPath.trim().replace(/\/+$/, "");
	return normalized.split("/").pop() ?? normalized;
}

/** A linked folder's hub note — the same `{FolderName}.md` the click-to-open feature uses. */
export function resolveFolderIndexPath(
	app: App,
	folderPath: string,
): ResolvedFolderIndex {
	const normalized = folderPath.trim().replace(/\/+$/, "");
	const path = getFolderIndexPathFromFolderPath(normalized);
	const existing = app.vault.getFileByPath(path);

	if (existing instanceof TFile) {
		return { path: existing.path, basename: existing.basename };
	}

	return { path, basename: folderBasename(normalized) };
}
