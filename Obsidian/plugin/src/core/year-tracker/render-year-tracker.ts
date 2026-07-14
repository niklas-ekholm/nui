
import { HabitDayEntry } from "../models/habit-day";
import {
	formatDayNumber,
	formatMonthName,
	formatTooltipDate,
	isSameDay,
	monthRows,
	todayStart,
	YearTrackerMonth,
} from "./year-grid";

export interface YearTrackerDayHost {
	createEmptyDay(daysEl: HTMLElement): void;
	createDay(
		daysEl: HTMLElement,
		cell: { date: Date; dateKey: string },
		state: { isDone: boolean; isToday: boolean; filePath?: string },
	): void;
}

export interface YearTrackerRenderOptions {
	year: number;
	months: YearTrackerMonth[];
	entriesByDate: Map<string, HabitDayEntry>;
	host: YearTrackerDayHost;
}

export function renderYearTracker(
	container: HTMLElement,
	options: YearTrackerRenderOptions,
): void {
	const root = container.querySelector(".nui-year-tracker-root");
	if (root) {
		root.remove();
	} else {
		container.empty();
		container.classList.add("nui-tracker");
	}

	const shell = container.createDiv("nui-year-tracker-root");
	const topbar = shell.createDiv("nui-year-tracker-topbar");
	topbar.createDiv("nui-year-tracker-topbar-title").createEl("h6", {
		cls: "inline-title nui-bases-view-title",
		text: String(options.year),
	});

	const today = todayStart();
	const grid = shell.createDiv("nui-year-tracker");

	for (const row of monthRows(options.months)) {
		for (const month of row) {
			const monthEl = grid.createDiv("nui-year-tracker-month");
			monthEl.createDiv({
				cls: "nui-year-tracker-month-name",
				text: formatMonthName(month.index),
			});

			const daysEl = monthEl.createDiv("nui-year-tracker-days");

			for (const cell of month.cells) {
				if (cell.empty) {
					options.host.createEmptyDay(daysEl);
					continue;
				}

				const entry = options.entriesByDate.get(cell.dateKey);
				options.host.createDay(daysEl, cell, {
					isDone: !!entry,
					isToday: isSameDay(cell.date, today),
					filePath: entry?.filePath,
				});
			}
		}
	}
}

export { formatDayNumber, formatTooltipDate };

