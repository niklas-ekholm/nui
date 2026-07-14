
import {
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	DateValue,
	NullValue,
	Value,
} from "obsidian";
import { parseIsoDate } from "../core/parse/dates";

const ISO_BASENAME = /^(\d{4}-\d{2}-\d{2})(?:\s|$)/i;

export const ENTRY_DATE_FALLBACKS: BasesPropertyId[] = [
	"note.date",
	"note.Start Date",
	"note.startDate",
	"note.start",
];

function valueToDate(value: Value | null): Date | null {
	if (!value || value instanceof NullValue) return null;

	if (value instanceof DateValue) {
		const iso = value.toString().trim().match(/^(\d{4}-\d{2}-\d{2})/);
		if (iso) return parseIsoDate(iso[1]);
		const text = value.toString().trim();
		return parseIsoDate(text.slice(0, 10)) ?? parseIsoDate(text);
	}

	const text = value.toString().trim();
	if (!text) return null;
	const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
	if (iso) return parseIsoDate(iso[1]);
	return parseIsoDate(text.slice(0, 10)) ?? parseIsoDate(text);
}

function dateFromBasename(path: string): Date | null {
	const base = path.split("/").pop()?.replace(/\.md$/i, "") ?? "";
	const match = base.match(ISO_BASENAME);
	if (!match) return null;
	return parseIsoDate(match[1]);
}

export function readEntryDate(
	entry: BasesEntry,
	config: BasesViewConfig,
	optionKey = "dateField",
	fallbacks: BasesPropertyId[] = ENTRY_DATE_FALLBACKS,
): Date | null {
	const configured = config.getAsPropertyId(optionKey);
	if (configured) {
		const date = valueToDate(entry.getValue(configured));
		if (date) return date;
	}

	for (const propertyId of fallbacks) {
		const date = valueToDate(entry.getValue(propertyId));
		if (date) return date;
	}

	return dateFromBasename(entry.file.path);
}

export function sortEntriesByDate(
	entries: BasesEntry[],
	config: BasesViewConfig,
): BasesEntry[] {
	const sortConfig = config.getSort();
	const direction = sortConfig[0]?.direction ?? "DESC";

	const dated: { entry: BasesEntry; date: Date }[] = [];
	const undated: BasesEntry[] = [];

	for (const entry of entries) {
		const date = readEntryDate(entry, config);
		if (date) {
			dated.push({ entry, date });
		} else {
			undated.push(entry);
		}
	}

	dated.sort((a, b) => {
		const diff = a.date.getTime() - b.date.getTime();
		if (diff !== 0) {
			return direction === "ASC" ? diff : -diff;
		}
		return a.entry.file.path.localeCompare(b.entry.file.path);
	});

	undated.sort((a, b) => a.file.path.localeCompare(b.file.path));

	return [...dated.map((row) => row.entry), ...undated];
}

