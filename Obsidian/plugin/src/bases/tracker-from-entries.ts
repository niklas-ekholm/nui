
import {
	App,
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	DateValue,
	ListValue,
	NullValue,
	parsePropertyId,
	TFile,
	Value,
} from "obsidian";
import { formatIsoDate, parseIsoDate } from "../core/parse/dates";
import { HabitDayEntry } from "../core/models/habit-day";

const ISO_BASENAME = /^(\d{4}-\d{2}-\d{2})(?:\s|$)/i;

const DATE_FALLBACKS: BasesPropertyId[] = [
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

function readDate(
	entry: BasesEntry,
	config: BasesViewConfig,
): { date: Date; dateKey: string } | null {
	const configured = config.getAsPropertyId("dateField");
	if (configured) {
		const date = valueToDate(entry.getValue(configured));
		if (date) {
			return { date, dateKey: formatIsoDate(date) };
		}
	}

	for (const propertyId of DATE_FALLBACKS) {
		const date = valueToDate(entry.getValue(propertyId));
		if (date) {
			return { date, dateKey: formatIsoDate(date) };
		}
	}

	const fromName = dateFromBasename(entry.file.path);
	if (fromName) {
		return { date: fromName, dateKey: formatIsoDate(fromName) };
	}

	return null;
}

export function entriesToHabitDays(
	entries: BasesEntry[],
	config: BasesViewConfig,
	year: number,
): Map<string, HabitDayEntry> {
	const byDate = new Map<string, HabitDayEntry>();

	for (const entry of entries) {
		const resolved = readDate(entry, config);
		if (!resolved) continue;
		if (resolved.date.getFullYear() !== year) continue;
		if (byDate.has(resolved.dateKey)) continue;

		byDate.set(resolved.dateKey, {
			date: resolved.date,
			dateKey: resolved.dateKey,
			filePath: entry.file.path,
		});
	}

	return byDate;
}

export function resolveDateFieldKey(config: BasesViewConfig): string {
	const configured = config.getAsPropertyId("dateField");
	if (configured) return parsePropertyId(configured).name;
	return "date";
}

function normalizeTag(tag: string): string {
	return tag.trim().replace(/^#/, "");
}

export function parseTagsList(value: unknown): string[] {
	if (typeof value !== "string" || !value.trim()) return [];
	return value
		.split(/[,\n]/)
		.map((tag) => tag.trim().replace(/^#/, ""))
		.filter(Boolean);
}

export function parseCalendarFolder(value: unknown): string {
	if (typeof value === "string" && value.trim()) {
		return value.trim().replace(/\/$/, "");
	}
	return "index/𓂀/Habits";
}

export function resolveTagFolderPath(calendarFolder: string, tag: string): string {
	const base = calendarFolder.trim().replace(/\/$/, "");
	const normalizedTag = tag.trim().replace(/^#/, "");
	return base ? `${base}/${normalizedTag}` : normalizedTag;
}

export function entryHasTag(entry: BasesEntry, tag: string): boolean {
	const normalized = normalizeTag(tag);
	if (!normalized) return false;

	const tagsValue = entry.getValue("note.tags");
	if (tagsValue instanceof ListValue) {
		for (let i = 0; i < tagsValue.length(); i++) {
			if (normalizeTag(tagsValue.get(i).toString()) === normalized) {
				return true;
			}
		}
	}

	const base = entry.file.basename;
	return base.includes(normalized);
}

export function entriesToHabitDaysForTag(
	entries: BasesEntry[],
	config: BasesViewConfig,
	tag: string,
	allowedDateKeys: Set<string>,
): Map<string, HabitDayEntry> {
	const byDate = new Map<string, HabitDayEntry>();

	for (const entry of entries) {
		if (!entryHasTag(entry, tag)) continue;

		const resolved = readDate(entry, config);
		if (!resolved) continue;
		if (!allowedDateKeys.has(resolved.dateKey)) continue;
		if (byDate.has(resolved.dateKey)) continue;

		byDate.set(resolved.dateKey, {
			date: resolved.date,
			dateKey: resolved.dateKey,
			filePath: entry.file.path,
		});
	}

	return byDate;
}

export function entryInHabitFolder(
	entry: BasesEntry,
	habitsRoot: string,
	habitName: string,
): boolean {
	const root = habitsRoot.trim().replace(/\/$/, "");
	if (!root || !habitName.trim()) {
		return false;
	}
	const prefix = `${root}/${habitName.trim()}/`;
	return entry.file.path.startsWith(prefix);
}

export function entriesToHabitDaysForHabitFolder(
	entries: BasesEntry[],
	config: BasesViewConfig,
	habitsRoot: string,
	habitName: string,
	allowedDateKeys: Set<string>,
): Map<string, HabitDayEntry> {
	const byDate = new Map<string, HabitDayEntry>();

	for (const entry of entries) {
		if (!entryInHabitFolder(entry, habitsRoot, habitName)) continue;

		const resolved = readDate(entry, config);
		if (!resolved) continue;
		if (!allowedDateKeys.has(resolved.dateKey)) continue;
		if (byDate.has(resolved.dateKey)) continue;

		byDate.set(resolved.dateKey, {
			date: resolved.date,
			dateKey: resolved.dateKey,
			filePath: entry.file.path,
		});
	}

	return byDate;
}

function readDateFromFile(
	app: App,
	file: TFile,
	dateFieldKey: string,
): { date: Date; dateKey: string } | null {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	if (frontmatter && dateFieldKey in frontmatter) {
		const raw = frontmatter[dateFieldKey];
		const text = typeof raw === "string" ? raw : String(raw ?? "");
		const date = parseIsoDate(text.slice(0, 10)) ?? parseIsoDate(text);
		if (date) {
			return { date, dateKey: formatIsoDate(date) };
		}
	}

	const fromName = dateFromBasename(file.path);
	if (fromName) {
		return { date: fromName, dateKey: formatIsoDate(fromName) };
	}

	return null;
}

export function filesToHabitDaysForHabitFolder(
	app: App,
	files: TFile[],
	dateFieldKey: string,
	allowedDateKeys: Set<string>,
): Map<string, HabitDayEntry> {
	const byDate = new Map<string, HabitDayEntry>();

	for (const file of files) {
		const resolved = readDateFromFile(app, file, dateFieldKey);
		if (!resolved) continue;
		if (!allowedDateKeys.has(resolved.dateKey)) continue;
		if (byDate.has(resolved.dateKey)) continue;

		byDate.set(resolved.dateKey, {
			date: resolved.date,
			dateKey: resolved.dateKey,
			filePath: file.path,
		});
	}

	return byDate;
}

