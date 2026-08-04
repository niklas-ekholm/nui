/** Date marker diameter — keep in sync with `--nui-date-marker-size` in styles.css. */
export const TIMELINE_DATE_MARKER_SIZE_PX = 18;

export const TIMELINE_DATE_EDGE_INSET_PX = TIMELINE_DATE_MARKER_SIZE_PX / 2;

/** Extra timeline span (in days) at each edge so endpoint circles fit inside the track. */
export function timelineEdgeInsetDays(
	totalDays: number,
	trackWidthPx: number,
): number {
	if (trackWidthPx <= 0 || totalDays <= 0) return 0;
	return (TIMELINE_DATE_EDGE_INSET_PX / trackWidthPx) * totalDays;
}

export function timelineLayoutSpanDays(
	totalDays: number,
	edgeInsetDays: number,
): number {
	return totalDays + edgeInsetDays * 2;
}

/** Map a day offset from rangeStart to a horizontal track percent. */
export function timelineDayOffsetToPercent(
	dayOffset: number,
	totalDays: number,
	edgeInsetDays: number,
): number {
	const layoutSpan = timelineLayoutSpanDays(totalDays, edgeInsetDays);
	if (layoutSpan <= 0) return 0;
	return ((edgeInsetDays + dayOffset) / layoutSpan) * 100;
}

/** Map track fraction (0–1) to a day offset from rangeStart. */
export function timelineTrackFractionToDayOffset(
	fraction: number,
	totalDays: number,
	edgeInsetDays: number,
): number {
	const layoutSpan = timelineLayoutSpanDays(totalDays, edgeInsetDays);
	return fraction * layoutSpan - edgeInsetDays;
}

export function timelineSpanDaysToWidthPercent(
	spanDays: number,
	totalDays: number,
	edgeInsetDays: number,
): number {
	const layoutSpan = timelineLayoutSpanDays(totalDays, edgeInsetDays);
	if (layoutSpan <= 0) return 0;
	return (spanDays / layoutSpan) * 100;
}
