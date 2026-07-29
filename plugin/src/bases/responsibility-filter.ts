import { BasesEntry, BasesPropertyId, NullValue } from "obsidian";

export function readEntryResponsibility(entry: BasesEntry): string | null {
	const value = entry.getValue("note.responsibility" as BasesPropertyId);
	if (!value || value instanceof NullValue) return null;

	const text = value.toString().trim();
	return text || null;
}

export function filterEntriesByResponsibility(
	entries: BasesEntry[],
	responsibility: string,
): BasesEntry[] {
	const needle = responsibility.trim();
	if (!needle) return entries;

	return entries.filter(
		(entry) => readEntryResponsibility(entry) === needle,
	);
}
