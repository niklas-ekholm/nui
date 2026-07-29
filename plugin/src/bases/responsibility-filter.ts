import { BasesEntry, BasesPropertyId, NullValue, App } from "obsidian";

export function readEntryResponsibility(
	entry: BasesEntry,
	app?: App,
): string | null {
	const value = entry.getValue("note.responsibility" as BasesPropertyId);
	if (value && !(value instanceof NullValue)) {
		const text = value.toString().trim();
		if (text) return text;
	}

	if (app) {
		const fromFrontmatter = app.metadataCache.getFileCache(entry.file)
			?.frontmatter?.responsibility;
		if (typeof fromFrontmatter === "string") {
			const text = fromFrontmatter.trim();
			if (text) return text;
		}
	}

	return null;
}

export function filterEntriesByResponsibility(
	entries: BasesEntry[],
	responsibility: string,
	app?: App,
): BasesEntry[] {
	const needle = responsibility.trim();
	if (!needle) return entries;

	return entries.filter(
		(entry) => readEntryResponsibility(entry, app) === needle,
	);
}
