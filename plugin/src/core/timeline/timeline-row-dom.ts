
import {
	formatDayOfMonth,
	formatDisplayDate,
	formatIsoDate,
	parseIsoDate,
} from "../parse/dates";
import { applyBarGeometry } from "./bar-geometry";
import { syncTimelineEventFrame } from "./event-frame";

export interface TimelineRowElements {
	row: HTMLElement;
	bar: HTMLElement;
	track: HTMLElement;
	eventEl: HTMLElement | null;
	titleEl: HTMLElement | null;
	startDateEl: HTMLElement;
	endDateEl: HTMLElement;
}

export function createTimelineDateMarker(
	classes: string,
	dayText: string,
): HTMLSpanElement {
	const dateEl = document.createElement("span");
	dateEl.className = classes;
	const numEl = document.createElement("span");
	numEl.className = "nui-timeline-date-num";
	numEl.textContent = dayText;
	dateEl.appendChild(numEl);
	return dateEl;
}

function setTimelineDateMarkerText(
	dateEl: HTMLElement,
	dayText: string,
): void {
	const numEl = dateEl.querySelector<HTMLElement>(".nui-timeline-date-num");
	if (numEl) {
		numEl.textContent = dayText;
	}
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
		eventEl: track.querySelector<HTMLElement>(".nui-timeline-event"),
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
	setTimelineDateMarkerText(elements.startDateEl, formatDayOfMonth(start));
	setTimelineDateMarkerText(elements.endDateEl, formatDayOfMonth(end));
	elements.bar.title = `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`;
	syncTimelineEventFrame(elements);
}

