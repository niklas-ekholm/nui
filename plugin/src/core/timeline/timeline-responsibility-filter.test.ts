import assert from "node:assert/strict";
import test from "node:test";
import { filterTimelineItemsByResponsibility } from "./timeline-responsibility-filter.ts";
import type { TimelineItem } from "../models/timeline-item.ts";

const baseItem = (overrides: Partial<TimelineItem> = {}): TimelineItem => ({
	id: "Projects/Stopping the Apocalypse.md",
	title: "Stopping the Apocalypse",
	start: new Date("2026-03-09"),
	end: new Date("2026-12-18"),
	...overrides,
});

test("filterTimelineItemsByResponsibility keeps exact matches only", () => {
	const items = [
		baseItem({ id: "a", responsibility: "Dean" }),
		baseItem({ id: "b", responsibility: "Sam" }),
		baseItem({ id: "c" }),
	];

	assert.deepEqual(
		filterTimelineItemsByResponsibility(items, "Dean").map((item) => item.id),
		["a"],
	);
});

test("filterTimelineItemsByResponsibility trims the filter value", () => {
	const items = [baseItem({ responsibility: "Dean" })];
	assert.equal(
		filterTimelineItemsByResponsibility(items, " Dean ").length,
		1,
	);
});

test("filterTimelineItemsByResponsibility returns all items for blank filter", () => {
	const items = [baseItem({ responsibility: "Dean" }), baseItem({ id: "b" })];
	assert.equal(filterTimelineItemsByResponsibility(items, "  ").length, 2);
});
