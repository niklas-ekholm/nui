
import { daysBetween } from "../parse/dates";
import {
	timelineDayOffsetToPercent,
	timelineEdgeInsetDays,
	timelineSpanDaysToWidthPercent,
} from "./timeline-layout-coords";

export interface BarGeometryElements {
	bar: HTMLElement;
	startDateEl: HTMLElement;
	endDateEl: HTMLElement;
	titleEl?: HTMLElement;
}

function applyTitleGeometry(
	titleEl: HTMLElement,
	leftPercent: number,
): void {
	titleEl.style.setProperty("--title-bar-left", `${leftPercent}%`);
}

export function applyBarGeometry(
	elements: BarGeometryElements,
	rangeStart: Date,
	totalDays: number,
	start: Date,
	end: Date,
): void {
	const track = elements.bar.closest<HTMLElement>(".nui-timeline-track");
	const trackWidthPx = track?.getBoundingClientRect().width ?? 0;
	const edgeInsetDays = timelineEdgeInsetDays(totalDays, trackWidthPx);

	const startOffset = daysBetween(rangeStart, start);
	const span = Math.max(1, daysBetween(start, end) + 1);
	const leftPercent = timelineDayOffsetToPercent(
		startOffset,
		totalDays,
		edgeInsetDays,
	);
	const widthPercent = timelineSpanDaysToWidthPercent(
		span,
		totalDays,
		edgeInsetDays,
	);

	elements.bar.style.left = `${leftPercent}%`;
	elements.bar.style.width = `${widthPercent}%`;
	elements.startDateEl.style.left = `${leftPercent}%`;
	elements.endDateEl.style.left = `${leftPercent + widthPercent}%`;

	if (elements.titleEl) {
		applyTitleGeometry(elements.titleEl, leftPercent);
	}
}
