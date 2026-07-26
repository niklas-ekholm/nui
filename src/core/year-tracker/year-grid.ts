
import { formatIsoDate, startOfDay } from "../parse/dates";

export const YEAR_TRACKER_WEEKS = 6;
export const YEAR_TRACKER_DAYS = 7;
export const YEAR_TRACKER_CELLS = YEAR_TRACKER_WEEKS * YEAR_TRACKER_DAYS;

export interface YearTrackerCell {
	date: Date;
	dateKey: string;
	empty: boolean;
}

export interface YearTrackerMonth {
	index: number;
	cells: YearTrackerCell[];
}

function weekStartColumn(date: Date): number {
	return (date.getDay() + 6) % 7;
}

export function buildYearGrid(year: number): YearTrackerMonth[] {
	const months: YearTrackerMonth[] = [];

	for (let month = 0; month < 12; month++) {
		const firstDay = new Date(year, month, 1);
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const leadingEmpty = weekStartColumn(firstDay);
		const cells: YearTrackerCell[] = [];

		for (let i = 0; i < leadingEmpty; i++) {
			cells.push({
				date: firstDay,
				dateKey: "",
				empty: true,
			});
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const date = startOfDay(new Date(year, month, day));
			cells.push({
				date,
				dateKey: formatIsoDate(date),
				empty: false,
			});
		}

		while (cells.length < YEAR_TRACKER_CELLS) {
			cells.push({
				date: firstDay,
				dateKey: "",
				empty: true,
			});
		}

		months.push({ index: month, cells });
	}

	return months;
}

export function isSameDay(a: Date, b: Date): boolean {
	return formatIsoDate(a) === formatIsoDate(b);
}

export function parseYear(value: unknown, fallback = new Date().getFullYear()): number {
	if (typeof value === "number" && Number.isInteger(value)) return value;
	if (typeof value === "string" && /^\d{4}$/.test(value.trim())) {
		return Number(value.trim());
	}
	return fallback;
}

export function parseYearFromFolderBasename(name: string): number | null {
	const trimmed = name.trim();
	if (!/^\d{4}$/.test(trimmed)) {
		return null;
	}
	return Number(trimmed);
}

export function parseYearFromFolderPath(folderPath: string): number | null {
	const parts = folderPath.split("/").filter(Boolean);
	const basename = parts[parts.length - 1] ?? "";
	return parseYearFromFolderBasename(basename);
}

export function formatTooltipDate(date: Date): string {
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function monthRows(months: YearTrackerMonth[]): YearTrackerMonth[][] {
	const rows: YearTrackerMonth[][] = [];
	for (let i = 0; i < months.length; i += 4) {
		rows.push(months.slice(i, i + 4));
	}
	return rows;
}

export function formatMonthName(monthIndex: number): string {
	return String(monthIndex + 1);
}

export function formatDayNumber(date: Date): string {
	return String(date.getDate());
}

export function todayStart(): Date {
	return startOfDay(new Date());
}

