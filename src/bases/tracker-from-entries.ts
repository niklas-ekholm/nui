
import {
	App,
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	DateValue,
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

function clampRating(value: number): number | undefined {
	if (!Number.isFinite(value)) return undefined;
	const rounded = Math.round(value);
	return rounded >= 1 && rounded <= 5 ? rounded : undefined;
}

function readRating(entry: BasesEntry): number | undefined {
	const value = entry.getValue("note.rating");
	if (!value || value instanceof NullValue) return undefined;
	return clampRating(Number(value.toString()));
}

function readRatingFromFrontmatter(
	frontmatter: Record<string, unknown> | undefined,
): number | undefined {
	if (!frontmatter || !("rating" in frontmatter)) return undefined;
	return clampRating(Number(frontmatter.rating));
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
			rating: readRating(entry),
		});
	}

	return byDate;
}

export interface MonthDayEvent {
	dateKey: string;
	filePath: string;
	title: string;
	rating?: number;
}

function eventTitleFromPath(filePath: string): string {
	const parts = filePath.split("/").filter(Boolean);
	return parts[parts.length - 2] ?? "";
}

export function entriesToMonthDayEvents(
	entries: BasesEntry[],
	config: BasesViewConfig,
	year: number,
): Map<string, MonthDayEvent[]> {
	const byDate = new Map<string, MonthDayEvent[]>();
	const seen = new Map<string, Set<string>>();

	for (const entry of entries) {
		const resolved = readDate(entry, config);
		if (!resolved) continue;
		if (resolved.date.getFullYear() !== year) continue;

		const title = eventTitleFromPath(entry.file.path);
		if (!title) continue;

		const paths = seen.get(resolved.dateKey) ?? new Set<string>();
		if (paths.has(entry.file.path)) continue;
		paths.add(entry.file.path);
		seen.set(resolved.dateKey, paths);

		const events = byDate.get(resolved.dateKey) ?? [];
		events.push({
			dateKey: resolved.dateKey,
			filePath: entry.file.path,
			title,
			rating: readRating(entry),
		});
		byDate.set(resolved.dateKey, events);
	}

	for (const [dateKey, events] of byDate) {
		events.sort((a, b) => a.title.localeCompare(b.title));
		byDate.set(dateKey, events);
	}

	return byDate;
}

export function resolveDateFieldKey(config: BasesViewConfig): string {
	const configured = config.getAsPropertyId("dateField");
	if (configured) return parsePropertyId(configured).name;
	return "date";
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

		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		byDate.set(resolved.dateKey, {
			date: resolved.date,
			dateKey: resolved.dateKey,
			filePath: file.path,
			rating: readRatingFromFrontmatter(frontmatter),
		});
	}

	return byDate;
}

