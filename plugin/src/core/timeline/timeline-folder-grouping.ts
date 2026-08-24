
import {
	getFolderIndexPathFromFolderPath,
	isFolderIndexPath,
} from "../../navigation/folder-index-path.ts";
import type { TimelineItem } from "../models/timeline-item.ts";

function parentFolderPathFromItemPath(filePath: string): string {
	const slash = filePath.lastIndexOf("/");
	return slash <= 0 ? "" : filePath.slice(0, slash);
}

export function isHubNoteItem(itemId: string): boolean {
	return isFolderIndexPath(itemId);
}

export function hubNotePathForFolder(folderPath: string): string {
	return getFolderIndexPathFromFolderPath(folderPath);
}

function parentFolderPath(folderPath: string): string {
	const slash = folderPath.lastIndexOf("/");
	return slash <= 0 ? "" : folderPath.slice(0, slash);
}

function itemsMap(items: TimelineItem[]): Map<string, TimelineItem> {
	return new Map(items.map((item) => [item.id, item]));
}

export function parentFolderHubOnTimeline(
	hubNoteId: string,
	byId: Map<string, TimelineItem>,
): string | undefined {
	if (!isHubNoteItem(hubNoteId)) return undefined;

	let folderPath = parentFolderPath(parentFolderPathFromItemPath(hubNoteId));
	while (folderPath) {
		const hubPath = hubNotePathForFolder(folderPath);
		if (byId.has(hubPath)) return hubPath;
		folderPath = parentFolderPath(folderPath);
	}

	return undefined;
}

export function ancestorFolderHubsOnTimeline(
	itemId: string,
	byId: Map<string, TimelineItem>,
): string[] {
	if (isHubNoteItem(itemId)) return [];

	const hubs: string[] = [];
	let folderPath = parentFolderPathFromItemPath(itemId);

	while (folderPath) {
		const hubPath = hubNotePathForFolder(folderPath);
		if (byId.has(hubPath)) hubs.push(hubPath);
		folderPath = parentFolderPath(folderPath);
	}

	return hubs;
}

export function getChildTimelineItemIds(
	hubNoteId: string,
	itemsById: Map<string, TimelineItem>,
): string[] {
	if (!isHubNoteItem(hubNoteId)) return [];

	const folder = parentFolderPathFromItemPath(hubNoteId);
	const ids: string[] = [];

	for (const id of itemsById.keys()) {
		if (id === hubNoteId) continue;

		const itemFolder = parentFolderPathFromItemPath(id);
		if (itemFolder === folder) {
			ids.push(id);
			continue;
		}

		if (isHubNoteItem(id) && parentFolderPath(itemFolder) === folder) {
			ids.push(id);
		}
	}

	return ids;
}

export function getDescendantIds(
	hubNoteId: string,
	itemsById: Map<string, TimelineItem>,
): string[] {
	if (!isHubNoteItem(hubNoteId)) return [];

	const folder = parentFolderPathFromItemPath(hubNoteId);
	if (!folder) return [];

	const prefix = `${folder}/`;
	const ids: string[] = [];

	for (const id of itemsById.keys()) {
		if (id === hubNoteId) continue;
		if (id.startsWith(prefix)) {
			ids.push(id);
		}
	}

	return ids;
}

export function expandMoveIdsWithSubtree(
	ids: Set<string>,
	itemsById: Map<string, TimelineItem>,
): Set<string> {
	const next = new Set(ids);

	for (const id of ids) {
		if (!isHubNoteItem(id)) continue;
		for (const descendantId of getDescendantIds(id, itemsById)) {
			next.add(descendantId);
		}
	}

	return next;
}

function addFolderChildrenRecursive(
	hubNoteId: string,
	next: Set<string>,
	itemsById: Map<string, TimelineItem>,
): void {
	for (const childId of getChildTimelineItemIds(hubNoteId, itemsById)) {
		if (next.has(childId)) continue;
		next.add(childId);
		if (isHubNoteItem(childId)) {
			addFolderChildrenRecursive(childId, next, itemsById);
		}
	}
}

function removeFolderChildrenRecursive(
	hubNoteId: string,
	next: Set<string>,
	itemsById: Map<string, TimelineItem>,
): void {
	for (const childId of getChildTimelineItemIds(hubNoteId, itemsById)) {
		next.delete(childId);
		if (isHubNoteItem(childId)) {
			removeFolderChildrenRecursive(childId, next, itemsById);
		}
	}
}

export function expandSelectionWithFolderChildren(
	ids: Set<string>,
	itemsById: Map<string, TimelineItem>,
): Set<string> {
	const next = new Set(ids);

	for (const id of ids) {
		if (!isHubNoteItem(id)) continue;
		addFolderChildrenRecursive(id, next, itemsById);
	}

	return next;
}

export function collapseSelectionWithoutFolderChildren(
	ids: Set<string>,
	itemsById: Map<string, TimelineItem>,
	removedFolderHubId: string,
): Set<string> {
	if (!isHubNoteItem(removedFolderHubId)) return ids;

	const next = new Set(ids);
	removeFolderChildrenRecursive(removedFolderHubId, next, itemsById);
	return next;
}

export interface ExpandedHubNoteDates {
	start: Date;
	end: Date;
}

export function datesExceedHubNote(
	childStart: Date,
	childEnd: Date,
	hubStart: Date,
	hubEnd: Date,
): ExpandedHubNoteDates | null {
	let nextStart = hubStart;
	let nextEnd = hubEnd;
	let changed = false;

	if (childStart.getTime() < hubStart.getTime()) {
		nextStart = childStart;
		changed = true;
	}
	if (childEnd.getTime() > hubEnd.getTime()) {
		nextEnd = childEnd;
		changed = true;
	}

	return changed ? { start: nextStart, end: nextEnd } : null;
}

export function hubNotePathForItem(itemId: string): string | undefined {
	if (isHubNoteItem(itemId)) return undefined;

	const folder = parentFolderPathFromItemPath(itemId);
	if (!folder) return undefined;

	return hubNotePathForFolder(folder);
}

export function folderHubIdForGroupedItem(
	itemId: string,
	items: TimelineItem[],
): string | undefined {
	const byId = itemsMap(items);
	const parentHub = parentFolderHubOnTimeline(itemId, byId);
	if (parentHub) return parentHub;

	const hubPath = hubNotePathForItem(itemId);
	if (!hubPath) return undefined;

	return byId.has(hubPath) ? hubPath : undefined;
}

function appendFolderSubtree(
	hubNoteId: string,
	byId: Map<string, TimelineItem>,
	result: TimelineItem[],
	groupedIds: Set<string>,
): void {
	const hubItem = byId.get(hubNoteId);
	if (!hubItem) return;

	result.push(hubItem);
	groupedIds.add(hubNoteId);

	const children = getChildTimelineItemIds(hubNoteId, byId)
		.map((id) => byId.get(id))
		.filter((entry): entry is TimelineItem => entry !== undefined)
		.sort((a, b) => a.start.getTime() - b.start.getTime());

	for (const child of children) {
		groupedIds.add(child.id);
		if (isHubNoteItem(child.id)) {
			result.push(child);
			appendFolderSubtreeChildren(child.id, byId, result, groupedIds);
		} else {
			result.push(child);
		}
	}
}

function appendFolderSubtreeChildren(
	hubNoteId: string,
	byId: Map<string, TimelineItem>,
	result: TimelineItem[],
	groupedIds: Set<string>,
): void {
	const children = getChildTimelineItemIds(hubNoteId, byId)
		.map((id) => byId.get(id))
		.filter((entry): entry is TimelineItem => entry !== undefined)
		.sort((a, b) => a.start.getTime() - b.start.getTime());

	for (const child of children) {
		groupedIds.add(child.id);
		if (isHubNoteItem(child.id)) {
			result.push(child);
			appendFolderSubtreeChildren(child.id, byId, result, groupedIds);
		} else {
			result.push(child);
		}
	}
}

function collectFolderSubtreeIds(
	hubNoteId: string,
	byId: Map<string, TimelineItem>,
	groupedIds: Set<string>,
): void {
	groupedIds.add(hubNoteId);

	for (const childId of getChildTimelineItemIds(hubNoteId, byId)) {
		groupedIds.add(childId);
		if (isHubNoteItem(childId)) {
			collectFolderSubtreeIds(childId, byId, groupedIds);
		}
	}
}

export function groupTimelineItemsByFolder(items: TimelineItem[]): TimelineItem[] {
	const byId = itemsMap(items);
	const groupedIds = new Set<string>();
	const rootHubs: TimelineItem[] = [];

	for (const item of items) {
		if (!isHubNoteItem(item.id)) continue;
		if (parentFolderHubOnTimeline(item.id, byId)) continue;
		rootHubs.push(item);
		collectFolderSubtreeIds(item.id, byId, groupedIds);
	}

	const entries: Array<
		| { kind: "single"; item: TimelineItem; start: number }
		| { kind: "folder"; hubId: string; start: number }
	> = [];

	for (const item of items) {
		if (groupedIds.has(item.id)) continue;
		entries.push({
			kind: "single",
			item,
			start: item.start.getTime(),
		});
	}

	for (const hub of rootHubs) {
		entries.push({
			kind: "folder",
			hubId: hub.id,
			start: hub.start.getTime(),
		});
	}

	entries.sort((a, b) => a.start - b.start);

	const result: TimelineItem[] = [];
	for (const entry of entries) {
		if (entry.kind === "single") {
			result.push(entry.item);
			continue;
		}

		appendFolderSubtree(entry.hubId, byId, result, new Set());
	}

	return result;
}

function isHiddenByCollapsedFolderHub(
	itemId: string,
	collapsedFolderHubIds: Set<string>,
	byId: Map<string, TimelineItem>,
): boolean {
	if (isHubNoteItem(itemId)) {
		const parentHub = parentFolderHubOnTimeline(itemId, byId);
		return parentHub !== undefined && collapsedFolderHubIds.has(parentHub);
	}

	return ancestorFolderHubsOnTimeline(itemId, byId).some((hubPath) =>
		collapsedFolderHubIds.has(hubPath),
	);
}

export function filterCollapsedFolderGroups(
	items: TimelineItem[],
	collapsedFolderHubIds: Set<string>,
): TimelineItem[] {
	if (collapsedFolderHubIds.size === 0) return items;

	const byId = itemsMap(items);

	return items.filter(
		(item) =>
			!isHiddenByCollapsedFolderHub(item.id, collapsedFolderHubIds, byId),
	);
}

export function folderHubHasChildren(
	hubNoteId: string,
	items: TimelineItem[],
): boolean {
	return getChildTimelineItemIds(hubNoteId, itemsMap(items)).length > 0;
}

/** Top-level project folder hubs on this timeline (no parent hub also present). */
export function rootFolderHubIds(items: TimelineItem[]): string[] {
	const byId = itemsMap(items);
	const roots: string[] = [];

	for (const item of items) {
		if (!isHubNoteItem(item.id)) continue;
		if (parentFolderHubOnTimeline(item.id, byId)) continue;
		roots.push(item.id);
	}

	return roots;
}

export function rootFolderHubIdsWithChildren(items: TimelineItem[]): string[] {
	return rootFolderHubIds(items).filter((id) =>
		folderHubHasChildren(id, items),
	);
}

/**
 * When folder contents are hidden, every top-level project folder is treated
 * as collapsed so nested notes and subfolders stay off the chart.
 */
export function effectiveCollapsedFolderHubIds(
	items: TimelineItem[],
	showFolderContents: boolean,
	collapsedFolderHubIds: Set<string>,
): Set<string> {
	if (showFolderContents) return collapsedFolderHubIds;

	const next = new Set(collapsedFolderHubIds);
	for (const id of rootFolderHubIdsWithChildren(items)) {
		next.add(id);
	}
	return next;
}
