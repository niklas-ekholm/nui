
import { addDays, formatIsoDate, startOfDay } from "../parse/dates";

export interface WeekTracker3Cell {
	date: Date;
	dateKey: string;
}

export type WeekTracker3BlockId = "older" | "previous" | "current" | "rolling";

export interface WeekTracker3Block {
	id: WeekTracker3BlockId;
	/** Monday offset from the current week: 0 = this week, -1 = last week, etc. */
	weekOffset?: number;
	cells: WeekTracker3Cell[];
}

export const MOBILE_WEEK_TRACKER_DAY_COUNT = 10;

/** Desktop scroll range: weeks before/after the current week (inclusive). */
export const SCROLLABLE_WEEKS_BEFORE = 26;
export const SCROLLABLE_WEEKS_AFTER = 26;

function weekStartMonday(date: Date): Date {
	const day = startOfDay(date);
	const column = (day.getDay() + 6) % 7;
	return addDays(day, -column);
}

function buildWeekCells(monday: Date): WeekTracker3Cell[] {
	const cells: WeekTracker3Cell[] = [];
	for (let i = 0; i < 7; i++) {
		const date = startOfDay(addDays(monday, i));
		cells.push({
			date,
			dateKey: formatIsoDate(date),
		});
	}
	return cells;
}

export function buildThreeWeekGrid(
	referenceDate: Date = new Date(),
): WeekTracker3Block[] {
	const currentMonday = weekStartMonday(referenceDate);
	const blocks: { id: WeekTracker3BlockId; offset: number }[] = [
		{ id: "older", offset: -14 },
		{ id: "previous", offset: -7 },
		{ id: "current", offset: 0 },
	];

	return blocks.map(({ id, offset }) => {
		const monday = addDays(currentMonday, offset);
		return {
			id,
			weekOffset: offset / 7,
			cells: buildWeekCells(monday),
		};
	});
}

export function buildScrollableWeekGrid(
	weeksBefore: number = SCROLLABLE_WEEKS_BEFORE,
	weeksAfter: number = SCROLLABLE_WEEKS_AFTER,
	referenceDate: Date = new Date(),
): WeekTracker3Block[] {
	const currentMonday = weekStartMonday(referenceDate);
	const blocks: WeekTracker3Block[] = [];

	for (let weekOffset = -weeksBefore; weekOffset <= weeksAfter; weekOffset++) {
		const monday = addDays(currentMonday, weekOffset * 7);
		let id: WeekTracker3BlockId;
		if (weekOffset === 0) id = "current";
		else if (weekOffset === -1) id = "previous";
		else if (weekOffset === -2) id = "older";
		else id = "rolling";

		blocks.push({
			id,
			weekOffset,
			cells: buildWeekCells(monday),
		});
	}

	return blocks;
}

export function scrollableWeekDateKeys(
	weeksBefore: number = SCROLLABLE_WEEKS_BEFORE,
	weeksAfter: number = SCROLLABLE_WEEKS_AFTER,
	referenceDate: Date = new Date(),
): Set<string> {
	return dateKeysFromBlocks(
		buildScrollableWeekGrid(weeksBefore, weeksAfter, referenceDate),
	);
}

/** Consecutive days ending on referenceDate (today last). */
export function buildRollingDayGrid(
	dayCount: number,
	referenceDate: Date = new Date(),
): WeekTracker3Block[] {
	const end = startOfDay(referenceDate);
	const cells: WeekTracker3Cell[] = [];
	for (let i = dayCount - 1; i >= 0; i--) {
		const date = addDays(end, -i);
		cells.push({
			date,
			dateKey: formatIsoDate(date),
		});
	}
	return [{ id: "rolling", cells }];
}

export function dateKeysFromBlocks(blocks: WeekTracker3Block[]): Set<string> {
	const keys = new Set<string>();
	for (const block of blocks) {
		for (const cell of block.cells) {
			keys.add(cell.dateKey);
		}
	}
	return keys;
}

export function threeWeekDateKeys(referenceDate: Date = new Date()): Set<string> {
	return dateKeysFromBlocks(buildThreeWeekGrid(referenceDate));
}

export function rollingDayDateKeys(
	dayCount: number,
	referenceDate: Date = new Date(),
): Set<string> {
	return dateKeysFromBlocks(buildRollingDayGrid(dayCount, referenceDate));
}

export function formatWeekdayShort(date: Date): string {
	return date.toLocaleDateString(undefined, { weekday: "narrow" });
}

