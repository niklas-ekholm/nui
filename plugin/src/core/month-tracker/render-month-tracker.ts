
import { MonthDayEvent } from "../../bases/tracker-from-entries";
import { HabitDayEntry } from "../models/habit-day";
import {
	formatDayNumber,
	formatTooltipDate,
	isSameDay,
	todayStart,
} from "../year-tracker/year-grid";
import { MonthTrackerWeekRow, weekdayLabels } from "./month-grid";

export type MonthTrackerLayout = "events" | "compact";

export interface MonthTrackerCompactDayHost {
	createEmptyDay(daysEl: HTMLElement): void;
	createCompactDay(
		daysEl: HTMLElement,
		cell: { date: Date; dateKey: string },
		state: {
			isDone: boolean;
			isToday: boolean;
			filePath?: string;
			rating?: number;
		},
	): void;
}

export interface MonthTrackerEventsDayHost {
	createEmptyDay(daysEl: HTMLElement): void;
	createEventsDay(
		daysEl: HTMLElement,
		cell: { date: Date; dateKey: string },
		state: { isToday: boolean; events: MonthDayEvent[] },
	): void;
}

export interface MonthTrackerRenderOptions {
	year: number;
	layout: MonthTrackerLayout;
	weekRows: MonthTrackerWeekRow[];
	entriesByDate: Map<string, HabitDayEntry>;
	eventsByDate: Map<string, MonthDayEvent[]>;
	compactHost: MonthTrackerCompactDayHost;
	eventsHost: MonthTrackerEventsDayHost;
}

function renderWeekdayLabels(parent: HTMLElement): void {
	for (const label of weekdayLabels()) {
		parent.createDiv({
			cls: "nui-month-tracker-weekday-label",
			text: label,
		});
	}
}

function renderStickyHeader(
	parent: HTMLElement,
	year: number,
	layout: MonthTrackerLayout,
): void {
	const header = parent.createDiv("nui-month-tracker-header");

	if (layout === "compact") {
		header.classList.add("nui-month-tracker-header--compact");
	}

	header.createDiv({
		cls: "nui-month-tracker-header-year",
		text: String(year),
	});

	const weekdaysEl = header.createDiv("nui-month-tracker-weekdays");
	renderWeekdayLabels(weekdaysEl);
}

export function renderMonthTracker(
	container: HTMLElement,
	options: MonthTrackerRenderOptions,
): void {
	const root = container.querySelector(".nui-month-tracker-root");
	if (root) {
		root.remove();
	} else {
		container.empty();
		container.classList.add("nui-tracker");
	}

	const layoutClass =
		options.layout === "compact"
			? "nui-month-tracker--compact"
			: "nui-month-tracker--events";
	const shell = container.createDiv(`nui-month-tracker-root ${layoutClass}`);
	renderStickyHeader(shell, options.year, options.layout);

	const today = todayStart();
	const body = shell.createDiv("nui-month-tracker-body");
	const host =
		options.layout === "compact" ? options.compactHost : options.eventsHost;

	for (const row of options.weekRows) {
		const rowEl = body.createDiv("nui-month-tracker-week-row");
		const monthLabelText =
			options.layout === "compact"
				? row.monthIndex !== null
					? String(row.monthIndex + 1)
					: ""
				: row.monthLabel ?? "";
		rowEl.createDiv({
			cls: "nui-month-tracker-month-label",
			text: monthLabelText,
		});

		const daysEl = rowEl.createDiv("nui-month-tracker-days");

		for (const cell of row.cells) {
			if (cell.empty) {
				host.createEmptyDay(daysEl);
				continue;
			}

			if (options.layout === "compact") {
				const entry = options.entriesByDate.get(cell.dateKey);
				options.compactHost.createCompactDay(daysEl, cell, {
					isDone: !!entry,
					isToday: isSameDay(cell.date, today),
					filePath: entry?.filePath,
					rating: entry?.rating,
				});
				continue;
			}

			const events = options.eventsByDate.get(cell.dateKey) ?? [];
			options.eventsHost.createEventsDay(daysEl, cell, {
				isToday: isSameDay(cell.date, today),
				events,
			});
		}
	}
}

export { formatDayNumber, formatTooltipDate };

export function isCompactMonthTrackerView(viewName: string): boolean {
	return viewName.trim().toLowerCase() === "compact";
}
