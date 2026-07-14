
import {
	addDays,
	daysBetween,
	formatDisplayDate,
	formatMonthName,
	startOfWeekMonday,
} from "../parse/dates";

export type TickGranularity = "day" | "week" | "month";

export const MIN_PX_PER_DAY_FOR_WEEKDAY_LABELS = 22;
export const MIN_PX_PER_DAY_FOR_WEEKDAY_FULL_DATE = 38;
export const MIN_PX_PER_DAY_FOR_MONDAY_DATE_LABELS = 10;
export const TIMELINE_MAIN_AXIS_HEIGHT = 24;
export const TIMELINE_MONDAY_DATE_SUBLABEL_HEIGHT = 14;
export const TIMELINE_MONTH_AXIS_HEIGHT = 14;
export const TIMELINE_WEEKDAY_AXIS_HEIGHT = 28;

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export interface TimelineTick {
	label: string;
	subLabel?: string;
	offsetPercent: number;
}

export function chooseGranularity(totalDays: number): TickGranularity {
	if (totalDays <= 90) return "week";
	return "month";
}

function pushGridTick(
	ticks: TimelineTick[],
	totalDays: number,
	offset: number,
): void {
	if (offset < 0 || offset > totalDays) return;
	ticks.push({
		label: "",
		offsetPercent: (offset / totalDays) * 100,
	});
}

export function buildWeekGridTicks(
	rangeStart: Date,
	totalDays: number,
): TimelineTick[] {
	const ticks: TimelineTick[] = [];
	let tickDate = startOfWeekMonday(rangeStart);
	if (daysBetween(rangeStart, tickDate) < 0) {
		tickDate = addDays(tickDate, 7);
	}

	while (daysBetween(rangeStart, tickDate) <= totalDays) {
		pushGridTick(ticks, totalDays, daysBetween(rangeStart, tickDate));
		tickDate = addDays(tickDate, 7);
	}

	return ticks;
}

export function buildGridTicks(rangeStart: Date, totalDays: number): TimelineTick[] {
	return buildWeekGridTicks(rangeStart, totalDays);
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
	const next = new Date(date);
	next.setMonth(next.getMonth() + months);
	return next;
}

function isoWeekNumber(date: Date): number {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = d.getDay() || 7;
	d.setDate(d.getDate() + 4 - day);
	const yearStart = new Date(d.getFullYear(), 0, 1);
	return Math.ceil((daysBetween(yearStart, d) + 1) / 7);
}

function formatWeekNumberLabel(date: Date): string {
	return `W${isoWeekNumber(date)}`;
}

function formatMonthLabel(date: Date): string {
	return formatDisplayDate(date);
}

export function formatWeekdayLetter(date: Date): string {
	const day = date.getDay();
	const index = day === 0 ? 6 : day - 1;
	return WEEKDAY_LETTERS[index];
}

export function formatDayNumber(date: Date): string {
	return String(date.getDate()).padStart(2, "0");
}

function pxPerDay(chartWidthPx: number, totalDays: number): number {
	if (totalDays <= 0) return 0;
	return chartWidthPx / totalDays;
}

function formatWeekdayDayLabel(
	date: Date,
	chartWidthPx: number,
	totalDays: number,
): string {
	if (pxPerDay(chartWidthPx, totalDays) > MIN_PX_PER_DAY_FOR_WEEKDAY_FULL_DATE) {
		return formatDisplayDate(date);
	}
	return formatDayNumber(date);
}

export function shouldShowWeekdayLabels(
	totalDays: number,
	chartWidthPx: number,
	minPxPerDay: number = MIN_PX_PER_DAY_FOR_WEEKDAY_LABELS,
): boolean {
	if (chartWidthPx <= 0 || totalDays <= 0) return false;
	return chartWidthPx / totalDays >= minPxPerDay;
}

export function shouldShowMondayDateLabels(
	totalDays: number,
	chartWidthPx: number,
): boolean {
	if (shouldShowWeekdayLabels(totalDays, chartWidthPx)) return false;
	return pxPerDay(chartWidthPx, totalDays) >= MIN_PX_PER_DAY_FOR_MONDAY_DATE_LABELS;
}

export function shouldShowMonthLabels(
	totalDays: number,
	chartWidthPx: number,
): boolean {
	if (totalDays <= 10) return true;
	return shouldShowWeekdayLabels(totalDays, chartWidthPx);
}

export function buildMonthTicks(
	rangeStart: Date,
	totalDays: number,
): TimelineTick[] {
	const ticks: TimelineTick[] = [];
	const dayCount = Math.max(0, Math.floor(totalDays));

	for (let offset = 0; offset < dayCount; offset += 1) {
		const date = addDays(rangeStart, offset);
		if (date.getDate() !== 1) continue;

		ticks.push({
			label: formatMonthName(date),
			offsetPercent: (offset / totalDays) * 100,
		});
	}

	return ticks;
}

export function buildWeekdayTicks(
	rangeStart: Date,
	totalDays: number,
	chartWidthPx: number,
): TimelineTick[] {
	const ticks: TimelineTick[] = [];
	const dayCount = Math.max(0, Math.floor(totalDays));

	for (let offset = 0; offset < dayCount; offset += 1) {
		const date = addDays(rangeStart, offset);
		ticks.push({
			label: formatWeekdayLetter(date),
			subLabel: formatWeekdayDayLabel(date, chartWidthPx, totalDays),
			offsetPercent: ((offset + 0.5) / totalDays) * 100,
		});
	}

	return ticks;
}

function pushTick(
	ticks: TimelineTick[],
	rangeStart: Date,
	totalDays: number,
	date: Date,
	label: string,
): void {
	const offset = daysBetween(rangeStart, date);
	if (offset < 0 || offset > totalDays) return;
	ticks.push({
		label,
		offsetPercent: (offset / totalDays) * 100,
	});
}

export interface TimelineTickBuildOptions {
	showMondayDates?: boolean;
}

export function buildTimelineTicks(
	rangeStart: Date,
	rangeEnd: Date,
	totalDays: number,
	options: TimelineTickBuildOptions = {},
): TimelineTick[] {
	const granularity = chooseGranularity(totalDays);
	const ticks: TimelineTick[] = [];
	const showMondayDates = options.showMondayDates ?? false;

	if (granularity === "week") {
		let tickDate = startOfWeekMonday(rangeStart);
		if (daysBetween(rangeStart, tickDate) < 0) {
			tickDate = addDays(tickDate, 7);
		}

		while (daysBetween(rangeStart, tickDate) <= totalDays) {
			const offset = daysBetween(rangeStart, tickDate);
			if (offset < 0 || offset > totalDays) {
				tickDate = addDays(tickDate, 7);
				continue;
			}

			ticks.push({
				label: formatWeekNumberLabel(tickDate),
				subLabel: showMondayDates
					? formatDisplayDate(tickDate)
					: undefined,
				offsetPercent: (offset / totalDays) * 100,
			});
			tickDate = addDays(tickDate, 7);
		}
		return ticks;
	}

	let tickDate = startOfMonth(rangeStart);
	if (daysBetween(rangeStart, tickDate) < 0) {
		tickDate = addMonths(tickDate, 1);
	}

	while (daysBetween(rangeStart, tickDate) <= totalDays) {
		pushTick(ticks, rangeStart, totalDays, tickDate, formatMonthLabel(tickDate));
		tickDate = addMonths(tickDate, 1);
	}

	return ticks;
}

export function granularityLabel(granularity: TickGranularity): string {
	switch (granularity) {
		case "day":
			return "daily";
		case "week":
			return "weekly";
		case "month":
			return "monthly";
	}
}

