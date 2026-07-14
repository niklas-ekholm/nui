
import {
	formatDisplayDate,
	formatIsoDate,
	parseIsoDate,
} from "../parse/dates";
import { applyBarGeometry } from "./bar-geometry";

export interface TimelineRowElements {
	row: HTMLElement;
	bar: HTMLElement;
	track: HTMLElement;
	titleEl: HTMLElement | null;
	startDateEl: HTMLElement;
	endDateEl: HTMLElement;
}

export function getTimelineRowElements(
	row: HTMLElement,
): TimelineRowElements | null {
	const bar = row.querySelector<HTMLElement>(".nui-timeline-bar");
	const track = row.querySelector<HTMLElement>(".nui-timeline-track");
	const startDateEl = row.querySelector<HTMLElement>(
		".nui-timeline-date-start",
	);
	const endDateEl = row.querySelector<HTMLElement>(".nui-timeline-date-end");
	if (!bar || !track || !startDateEl || !endDateEl) return null;

	return {
		row,
		bar,
		track,
		titleEl: row.querySelector<HTMLElement>(".nui-timeline-bar-title"),
		startDateEl,
		endDateEl,
	};
}

export function readTimelineRowDates(
	row: HTMLElement,
): { start: Date; end: Date } | null {
	const start = parseIsoDate(row.dataset.start ?? "");
	const end = parseIsoDate(row.dataset.end ?? "");
	if (!start || !end) return null;
	return { start, end };
}

export function writeTimelineRowDates(
	elements: TimelineRowElements,
	rangeStart: Date,
	totalDays: number,
	start: Date,
	end: Date,
): void {
	elements.row.dataset.start = formatIsoDate(start);
	elements.row.dataset.end = formatIsoDate(end);
	applyBarGeometry(
		{
			bar: elements.bar,
			startDateEl: elements.startDateEl,
			endDateEl: elements.endDateEl,
			titleEl: elements.titleEl ?? undefined,
		},
		rangeStart,
		totalDays,
		start,
		end,
	);
	elements.startDateEl.textContent = formatDisplayDate(start);
	elements.endDateEl.textContent = formatDisplayDate(end);
	elements.bar.title = `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`;
}

