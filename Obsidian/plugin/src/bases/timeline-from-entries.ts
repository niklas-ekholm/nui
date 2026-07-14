
import {
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	DateValue,
	NullValue,
	parsePropertyId,
	Value,
} from "obsidian";
import { parseIsoDate } from "../core/parse/dates";
import { TimelineItem } from "../core/models/timeline-item";

const START_FALLBACKS: BasesPropertyId[] = [
	"note.Start Date",
	"note.date",
	"note.startDate",
	"note.start",
];

const END_FALLBACKS: BasesPropertyId[] = [
	"note.End Date",
	"note.dueDate",
	"note.endDate",
	"note.end",
];

const TITLE_FALLBACKS: BasesPropertyId[] = ["note.title", "note.Title"];

function titleFromPath(path: string): string {
	const name = path.split("/").pop() ?? path;
	return name.replace(/\.md$/i, "");
}

function valueToDate(value: Value | null): Date | null {
	if (!value || value instanceof NullValue) return null;

	if (value instanceof DateValue) {
		const text = value.toString().trim();
		return parseIsoDate(text.slice(0, 10)) ?? parseIsoDate(text);
	}

	const text = value.toString().trim();
	if (!text) return null;
	return parseIsoDate(text.slice(0, 10)) ?? parseIsoDate(text);
}

function valueToString(value: Value | null): string | null {
	if (!value || value instanceof NullValue) return null;
	const text = value.toString().trim();
	return text || null;
}

function resolveDateFieldKey(
	entry: BasesEntry,
	config: BasesViewConfig,
	optionKey: string,
	fallbacks: BasesPropertyId[],
): string | null {
	const configured = config.getAsPropertyId(optionKey);
	if (configured) {
		const date = valueToDate(entry.getValue(configured));
		if (date) {
			return parsePropertyId(configured).name;
		}
	}

	for (const propertyId of fallbacks) {
		const date = valueToDate(entry.getValue(propertyId));
		if (date) {
			return parsePropertyId(propertyId).name;
		}
	}

	return null;
}

function resolveEndFieldKey(
	entry: BasesEntry,
	config: BasesViewConfig,
): string {
	const existing = resolveDateFieldKey(
		entry,
		config,
		"endField",
		END_FALLBACKS,
	);
	if (existing) return existing;

	const configured = config.getAsPropertyId("endField");
	if (configured && parsePropertyId(configured).type === "note") {
		return parsePropertyId(configured).name;
	}

	return "End Date";
}

function readDate(
	entry: BasesEntry,
	config: BasesViewConfig,
	optionKey: string,
	fallbacks: BasesPropertyId[],
): Date | null {
	const configured = config.getAsPropertyId(optionKey);
	if (configured) {
		return valueToDate(entry.getValue(configured));
	}

	for (const propertyId of fallbacks) {
		const date = valueToDate(entry.getValue(propertyId));
		if (date) return date;
	}

	return null;
}

function readTitle(entry: BasesEntry, config: BasesViewConfig): string {
	const configured = config.getAsPropertyId("titleField");
	if (configured) {
		const title = valueToString(entry.getValue(configured));
		if (title) return title;
	}

	for (const propertyId of TITLE_FALLBACKS) {
		const title = valueToString(entry.getValue(propertyId));
		if (title) return title;
	}

	return titleFromPath(entry.file.path);
}

function readProject(
	entry: BasesEntry,
	config: BasesViewConfig,
): string | null {
	const configured = config.getAsPropertyId("projectField");
	if (configured) {
		const project = valueToString(entry.getValue(configured));
		if (project) return project;
	}

	return valueToString(entry.getValue("note.project" as BasesPropertyId));
}

export function entriesToTimelineItems(
	entries: BasesEntry[],
	config: BasesViewConfig,
): TimelineItem[] {
	const items: TimelineItem[] = [];

	for (const entry of entries) {
		const start = readDate(entry, config, "startField", START_FALLBACKS);
		if (!start) continue;

		const end = readDate(entry, config, "endField", END_FALLBACKS);
		if (!end) continue;

		const safeEnd = end.getTime() < start.getTime() ? start : end;

		const type = valueToString(entry.getValue("note.type" as BasesPropertyId));
		const project = readProject(entry, config);

		items.push({
			id: entry.file.path,
			title: readTitle(entry, config),
			start,
			end: safeEnd,
			startField:
				resolveDateFieldKey(entry, config, "startField", START_FALLBACKS) ??
				undefined,
			endField: resolveEndFieldKey(entry, config),
			type: type ?? undefined,
			project: project ?? undefined,
		});
	}

	return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}

