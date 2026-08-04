import { daysBetween, startOfDay } from "../parse/dates";
import {
	timelineDayOffsetToPercent,
	timelineEdgeInsetDays,
	timelineLayoutSpanDays,
} from "./timeline-layout-coords";

/** Left position (0–100) for the today accent line, or null if today is out of range. */
export function computeTodayLineOffsetPercent(
	rangeStart: Date,
	totalDays: number,
	now: Date = new Date(),
	trackWidthPx = 0,
): number | null {
	const todayStart = startOfDay(now);
	const todayOffsetDays = daysBetween(rangeStart, todayStart);
	if (todayOffsetDays < 0 || todayOffsetDays > totalDays) return null;

	const edgeInsetDays = timelineEdgeInsetDays(totalDays, trackWidthPx);
	const layoutSpan = timelineLayoutSpanDays(totalDays, edgeInsetDays);
	const dayStartPercent = timelineDayOffsetToPercent(
		todayOffsetDays,
		totalDays,
		edgeInsetDays,
	);
	const dayWidthPercent = (1 / layoutSpan) * 100;
	const hourSlot = now.getHours();
	return dayStartPercent + (hourSlot / 24) * dayWidthPercent;
}

/** Remap axis/grid tick positions after computing edge inset in the time domain. */
export function remapTimelineTickPercentsForLayoutInset(
	offsetPercent: number,
	totalDays: number,
	edgeInsetDays: number,
): number {
	const dayOffset = (offsetPercent / 100) * totalDays;
	return timelineDayOffsetToPercent(dayOffset, totalDays, edgeInsetDays);
}
