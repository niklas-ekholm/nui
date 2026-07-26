
import {
	addDays,
	formatIsoDate,
	startOfDay,
	startOfWeekMonday,
} from "../parse/dates";
import { parseYear, parseYearFromFolderBasename } from "../year-tracker/year-grid";

export function parseMonthFromViewName(name: string): number | null {
	const trimmed = name.trim();
	if (/^\d{4}$/.test(trimmed)) {
		return null;
	}

	const match = trimmed.match(/^(\d{1,2})$/);
	if (!match) {
		return null;
	}

	const month = Number(match[1]);
	if (month < 1 || month > 12) {
		return null;
	}

	return month - 1;
}

export interface MonthTrackerScope {
	year: number;
	monthIndices: number[];
}

export function resolveMonthTrackerScope(
	viewName: string,
	configuredYear: unknown,
	hostFolderYear: number | null,
): MonthTrackerScope {
	const fromViewYear = parseYearFromFolderBasename(viewName);
	if (fromViewYear !== null) {
		return {
			year: fromViewYear,
			monthIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
		};
	}

	const monthIndex = parseMonthFromViewName(viewName);
	if (monthIndex !== null) {
		return {
			year: new Date().getFullYear(),
			monthIndices: [monthIndex],
		};
	}

	if (
		(typeof configuredYear === "number" && Number.isInteger(configuredYear)) ||
		(typeof configuredYear === "string" && /^\d{4}$/.test(configuredYear.trim()))
	) {
		return {
			year: parseYear(configuredYear),
			monthIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
		};
	}

	if (hostFolderYear !== null) {
		return {
			year: hostFolderYear,
			monthIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
		};
	}

	return {
		year: new Date().getFullYear(),
		monthIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
	};
}

export interface MonthTrackerCell {
	date: Date;
	dateKey: string;
	empty: boolean;
	monthIndex: number;
}

export interface MonthTrackerWeekRow {
	monthLabel: string | null;
	monthIndex: number | null;
	cells: MonthTrackerCell[];
}

function isDateInScope(
	date: Date,
	year: number,
	monthSet: Set<number>,
	scopeStart: Date,
	scopeEnd: Date,
): boolean {
	const day = startOfDay(date);
	if (day < scopeStart || day > scopeEnd) {
		return false;
	}
	if (day.getFullYear() !== year) {
		return false;
	}
	return monthSet.has(day.getMonth());
}

export function buildContinuousWeekRows(
	year: number,
	monthIndices: number[],
): MonthTrackerWeekRow[] {
	const sorted = [...monthIndices].sort((a, b) => a - b);
	if (sorted.length === 0) {
		return [];
	}

	const firstMonth = sorted[0];
	const lastMonth = sorted[sorted.length - 1];
	const scopeStart = startOfDay(new Date(year, firstMonth, 1));
	const scopeEnd = startOfDay(new Date(year, lastMonth + 1, 0));
	const monthSet = new Set(sorted);

	const gridStart = startOfWeekMonday(scopeStart);
	const gridEnd = addDays(startOfWeekMonday(scopeEnd), 6);

	const allDays: MonthTrackerCell[] = [];
	for (
		let cursor = gridStart;
		cursor.getTime() <= gridEnd.getTime();
		cursor = addDays(cursor, 1)
	) {
		if (
			isDateInScope(cursor, year, monthSet, scopeStart, scopeEnd)
		) {
			allDays.push({
				date: startOfDay(cursor),
				dateKey: formatIsoDate(cursor),
				empty: false,
				monthIndex: cursor.getMonth(),
			});
		} else {
			allDays.push({
				date: startOfDay(cursor),
				dateKey: "",
				empty: true,
				monthIndex: -1,
			});
		}
	}

	const rows: MonthTrackerWeekRow[] = [];
	for (let i = 0; i < allDays.length; i += 7) {
		const cells = allDays.slice(i, i + 7);
		let monthLabel: string | null = null;
		let monthIndex: number | null = null;
		for (const cell of cells) {
			if (!cell.empty && cell.date.getDate() === 1) {
				monthLabel = formatFullMonthName(cell.monthIndex, year);
				monthIndex = cell.monthIndex;
				break;
			}
		}
		rows.push({ monthLabel, monthIndex, cells });
	}

	return rows;
}

export function formatFullMonthName(monthIndex: number, year: number): string {
	const date = new Date(year, monthIndex, 1);
	return date.toLocaleDateString(undefined, { month: "long" });
}

const WEEKDAY_REFERENCE_MONDAY = startOfDay(new Date(2024, 0, 1));

export function weekdayLabels(): string[] {
	const labels: string[] = [];
	for (let i = 0; i < 7; i++) {
		const date = addDays(WEEKDAY_REFERENCE_MONDAY, i);
		labels.push(
			date.toLocaleDateString(undefined, { weekday: "narrow" }),
		);
	}
	return labels;
}
