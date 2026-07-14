
import { App, TFile } from "obsidian";

export interface ResolvedFolderIndex {
	path: string;
	basename: string;
}

export function folderBasename(folderPath: string): string {
	const normalized = folderPath.trim().replace(/\/+$/, "");
	return normalized.split("/").pop() ?? normalized;
}

export function resolveFolderIndexPath(
	app: App,
	folderPath: string,
): ResolvedFolderIndex {
	const normalized = folderPath.trim().replace(/\/+$/, "");
	const folderName = folderBasename(normalized);
	const path = `${normalized}/${folderName}.md`;
	const existing = app.vault.getFileByPath(path);

	if (existing instanceof TFile) {
		return { path: existing.path, basename: existing.basename };
	}

	return { path, basename: folderName };
}
