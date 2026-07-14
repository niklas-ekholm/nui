
import { App, BasesEntry, TFile } from "obsidian";

export function isHubNavVisible(app: App, file: TFile): boolean {
	const raw = app.metadataCache.getFileCache(file)?.frontmatter?.nav;
	if (raw === false) return false;
	if (typeof raw === "string") {
		const normalized = raw.trim().toLowerCase();
		if (normalized === "false" || normalized === "no") return false;
	}
	return true;
}

export function filterNavVisibleFolderEntries(
	app: App,
	entries: BasesEntry[],
): BasesEntry[] {
	return entries.filter((entry) => isHubNavVisible(app, entry.file));
}
