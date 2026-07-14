
import { App, parseYaml, stringifyYaml, TFile } from "obsidian";
import { parseTagsList } from "../bases/tracker-from-entries";
import { DEFAULT_WEEKLY_HABITS_BASE_PATH } from "./habit-bundle";
import { WEEK_TRACKER_3_BASES_VIEW_TYPE } from "../layouts/types";

const WEEK_VIEW_NAME = "Week";

interface WeeklyHabitsBaseDoc {
	filters?: {
		or?: string[];
	};
	views?: Array<Record<string, unknown>>;
}

export async function addTagToWeeklyHabitsBase(
	app: App,
	tag: string,
	weeklyHabitsBasePath: string = DEFAULT_WEEKLY_HABITS_BASE_PATH,
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(weeklyHabitsBasePath);
	if (!(file instanceof TFile)) {
		throw new Error(`Weekly habits base not found: ${weeklyHabitsBasePath}`);
	}

	const doc = parseWeeklyHabitsBase(await app.vault.read(file));
	const trimmedTag = tag.trim();
	if (!trimmedTag) return;

	ensureTagFilter(doc, trimmedTag);
	ensureWeekViewTag(doc, trimmedTag);

	await app.vault.modify(file, stringifyWeeklyHabitsBase(doc));
}

export async function renameTagInWeeklyHabitsBase(
	app: App,
	oldTag: string,
	newTag: string,
	weeklyHabitsBasePath: string = DEFAULT_WEEKLY_HABITS_BASE_PATH,
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(weeklyHabitsBasePath);
	if (!(file instanceof TFile)) {
		return;
	}

	const doc = parseWeeklyHabitsBase(await app.vault.read(file));
	const oldTrimmed = oldTag.trim();
	const newTrimmed = newTag.trim();
	if (!oldTrimmed || !newTrimmed || oldTrimmed === newTrimmed) {
		return;
	}

	renameTagFilter(doc, oldTrimmed, newTrimmed);
	renameWeekViewTag(doc, oldTrimmed, newTrimmed);

	const hasNewFilter = doc.filters?.or?.includes(tagFilterExpression(newTrimmed));
	if (!hasNewFilter) {
		ensureTagFilter(doc, newTrimmed);
	}

	const weekView = findWeekTrackerView(doc);
	const weekTags = parseTagsList(String(weekView?.tags ?? ""));
	if (!weekTags.includes(newTrimmed)) {
		ensureWeekViewTag(doc, newTrimmed);
	}

	await app.vault.modify(file, stringifyWeeklyHabitsBase(doc));
}

export async function removeTagFromWeeklyHabitsBase(
	app: App,
	tag: string,
	weeklyHabitsBasePath: string = DEFAULT_WEEKLY_HABITS_BASE_PATH,
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(weeklyHabitsBasePath);
	if (!(file instanceof TFile)) {
		return;
	}

	const doc = parseWeeklyHabitsBase(await app.vault.read(file));
	const trimmedTag = tag.trim();
	if (!trimmedTag) return;

	removeTagFilter(doc, trimmedTag);
	removeWeekViewTag(doc, trimmedTag);

	await app.vault.modify(file, stringifyWeeklyHabitsBase(doc));
}

export async function pruneOrphanedHabitTagsFromWeeklyBase(
	app: App,
	configuredTags: string[],
	activeTags: string[],
	weeklyHabitsBasePath: string = DEFAULT_WEEKLY_HABITS_BASE_PATH,
): Promise<void> {
	const activeSet = new Set(activeTags);
	for (const tag of configuredTags) {
		if (!activeSet.has(tag)) {
			await removeTagFromWeeklyHabitsBase(app, tag, weeklyHabitsBasePath);
		}
	}
}

function parseWeeklyHabitsBase(content: string): WeeklyHabitsBaseDoc {
	const parsed = parseYaml(content);
	if (!parsed || typeof parsed !== "object") {
		return {};
	}
	return parsed as WeeklyHabitsBaseDoc;
}

function stringifyWeeklyHabitsBase(doc: WeeklyHabitsBaseDoc): string {
	return stringifyYaml(doc);
}

function tagFilterExpression(tag: string): string {
	return `file.tags.contains("${tag}")`;
}

function ensureTagFilter(doc: WeeklyHabitsBaseDoc, tag: string): void {
	if (!doc.filters) {
		doc.filters = { or: [] };
	}
	if (!doc.filters.or) {
		doc.filters.or = [];
	}

	const expression = tagFilterExpression(tag);
	if (!doc.filters.or.includes(expression)) {
		doc.filters.or.push(expression);
	}
}

function renameTagFilter(
	doc: WeeklyHabitsBaseDoc,
	oldTag: string,
	newTag: string,
): void {
	const or = doc.filters?.or;
	if (!or) return;

	doc.filters!.or = or.map((entry) =>
		entry === tagFilterExpression(oldTag) ? tagFilterExpression(newTag) : entry,
	);
}

function removeTagFilter(doc: WeeklyHabitsBaseDoc, tag: string): void {
	const or = doc.filters?.or;
	if (!or) return;

	doc.filters!.or = or.filter((entry) => entry !== tagFilterExpression(tag));
}

function findWeekTrackerView(
	doc: WeeklyHabitsBaseDoc,
): Record<string, unknown> | null {
	for (const view of doc.views ?? []) {
		if (view.type === WEEK_TRACKER_3_BASES_VIEW_TYPE && view.name === WEEK_VIEW_NAME) {
			return view;
		}
	}
	return null;
}

function ensureWeekViewTag(doc: WeeklyHabitsBaseDoc, tag: string): void {
	const view = findWeekTrackerView(doc);
	if (!view) return;

	const tags = parseTagsList(String(view.tags ?? ""));
	if (tags.includes(tag)) return;
	tags.push(tag);
	view.tags = tags.join(", ");
}

function renameWeekViewTag(
	doc: WeeklyHabitsBaseDoc,
	oldTag: string,
	newTag: string,
): void {
	const view = findWeekTrackerView(doc);
	if (!view) return;

	const tags = parseTagsList(String(view.tags ?? "")).map((entry) =>
		entry === oldTag ? newTag : entry,
	);
	view.tags = tags.join(", ");
}

function removeWeekViewTag(doc: WeeklyHabitsBaseDoc, tag: string): void {
	const view = findWeekTrackerView(doc);
	if (!view) return;

	const tags = parseTagsList(String(view.tags ?? "")).filter(
		(entry) => entry !== tag,
	);
	view.tags = tags.length ? tags.join(", ") : "";
}

