import assert from "node:assert/strict";
import test from "node:test";
import type { TimelineItem } from "../models/timeline-item.ts";
import {
	filterCollapsedFolderGroups,
	folderHubIdForGroupedItem,
	getChildTimelineItemIds,
	groupTimelineItemsByFolder,
	parentFolderHubOnTimeline,
	effectiveCollapsedFolderHubIds,
	rootFolderHubIdsWithChildren,
} from "./timeline-folder-grouping.ts";

function item(
	id: string,
	start: string,
	end: string = start,
): TimelineItem {
	return {
		id,
		title: id.split("/").pop()?.replace(/\.md$/, "") ?? id,
		start: new Date(`${start}T00:00:00`),
		end: new Date(`${end}T00:00:00`),
	};
}

function itemsMap(items: TimelineItem[]): Map<string, TimelineItem> {
	return new Map(items.map((entry) => [entry.id, entry]));
}

test("getChildTimelineItemIds includes hub note in a direct subfolder", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Phase 1.md", "2026-01-10"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
	];
	const byId = itemsMap(items);

	assert.deepEqual(
		getChildTimelineItemIds("Projects/Outer/Outer.md", byId).sort(),
		[
			"Projects/Outer/Inner/Inner.md",
			"Projects/Outer/Phase 1.md",
		].sort(),
	);
	assert.deepEqual(
		getChildTimelineItemIds("Projects/Outer/Inner/Inner.md", byId),
		["Projects/Outer/Inner/Phase 2.md"],
	);
});

test("groupTimelineItemsByFolder nests hub notes and normal notes", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Phase 1.md", "2026-01-10"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
	];

	assert.deepEqual(
		groupTimelineItemsByFolder(items).map((entry) => entry.id),
		[
			"Projects/Outer/Outer.md",
			"Projects/Outer/Phase 1.md",
			"Projects/Outer/Inner/Inner.md",
			"Projects/Outer/Inner/Phase 2.md",
		],
	);
});

test("nested hub note is not duplicated as a root group", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
	];
	const grouped = groupTimelineItemsByFolder(items);

	assert.equal(
		grouped.filter((entry) => entry.id === "Projects/Outer/Inner/Inner.md")
			.length,
		1,
	);
	assert.equal(grouped[0]?.id, "Projects/Outer/Outer.md");
});

test("filterCollapsedFolderGroups hides full subtree when outer folder collapsed", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Phase 1.md", "2026-01-10"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
	];
	const collapsed = new Set(["Projects/Outer/Outer.md"]);

	assert.deepEqual(
		filterCollapsedFolderGroups(items, collapsed).map((entry) => entry.id),
		["Projects/Outer/Outer.md"],
	);
});

test("parentFolderHubOnTimeline returns undefined when parent hub note is not on timeline", () => {
	const items = [
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
	];
	const byId = itemsMap(items);

	assert.equal(
		parentFolderHubOnTimeline("Projects/Outer/Inner/Inner.md", byId),
		undefined,
	);
});

test("parentFolderHubOnTimeline finds parent folder hub on timeline", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
	];
	const byId = itemsMap(items);

	assert.equal(
		parentFolderHubOnTimeline("Projects/Outer/Inner/Inner.md", byId),
		"Projects/Outer/Outer.md",
	);
});

test("folderHubIdForGroupedItem marks nested folder hubs as subprojects", () => {
	const items = [
		item("Projects/Test1/Test1.md", "2026-08-04", "2026-08-11"),
		item("Projects/Test1/subtest/subtest.md", "2026-08-08", "2026-08-11"),
		item("Projects/Test1/subtest/test.md", "2026-08-07", "2026-08-09"),
	];

	assert.equal(
		folderHubIdForGroupedItem("Projects/Test1/subtest/subtest.md", items),
		"Projects/Test1/Test1.md",
	);
	assert.equal(
		folderHubIdForGroupedItem("Projects/Test1/subtest/test.md", items),
		"Projects/Test1/subtest/subtest.md",
	);
});

test("rootFolderHubIdsWithChildren lists only top-level hubs that have children", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Phase 1.md", "2026-01-10"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Outer/Inner/Phase 2.md", "2026-02-05"),
		item("Projects/Lonely/Lonely.md", "2026-01-01", "2026-01-15"),
		item("Projects/Loose note.md", "2026-01-05"),
	];

	assert.deepEqual(rootFolderHubIdsWithChildren(items).sort(), [
		"Projects/Outer/Outer.md",
	]);
});

test("effectiveCollapsedFolderHubIds hides root children when contents off", () => {
	const items = [
		item("Projects/Outer/Outer.md", "2026-01-01", "2026-03-01"),
		item("Projects/Outer/Phase 1.md", "2026-01-10"),
		item("Projects/Outer/Inner/Inner.md", "2026-02-01", "2026-02-28"),
		item("Projects/Loose note.md", "2026-01-05"),
	];
	const effective = effectiveCollapsedFolderHubIds(
		items,
		false,
		new Set(),
	);

	assert.deepEqual(
		filterCollapsedFolderGroups(items, effective).map((entry) => entry.id),
		["Projects/Outer/Outer.md", "Projects/Loose note.md"],
	);
});
