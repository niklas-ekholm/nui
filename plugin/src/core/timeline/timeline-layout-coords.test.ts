import assert from "node:assert/strict";
import test from "node:test";
import {
	TIMELINE_DATE_EDGE_INSET_PX,
	timelineDayOffsetToPercent,
	timelineEdgeInsetDays,
	timelineTrackFractionToDayOffset,
} from "./timeline-layout-coords.ts";

test("timelineDayOffsetToPercent insets day 0 away from the track edge", () => {
	const totalDays = 21;
	const trackWidthPx = 900;
	const edgeInsetDays = timelineEdgeInsetDays(totalDays, trackWidthPx);

	const day0 = timelineDayOffsetToPercent(0, totalDays, edgeInsetDays);
	assert.ok(day0 > 0);

	const insetPx = (day0 / 100) * trackWidthPx;
	assert.ok(Math.abs(insetPx - TIMELINE_DATE_EDGE_INSET_PX) < 0.5);
});

test("timelineTrackFractionToDayOffset inverts layout mapping at day 0", () => {
	const totalDays = 21;
	const trackWidthPx = 900;
	const edgeInsetDays = timelineEdgeInsetDays(totalDays, trackWidthPx);
	const day0Percent = timelineDayOffsetToPercent(0, totalDays, edgeInsetDays);
	const fraction = day0Percent / 100;
	const dayOffset = timelineTrackFractionToDayOffset(
		fraction,
		totalDays,
		edgeInsetDays,
	);
	assert.ok(Math.abs(dayOffset) < 0.01);
});
