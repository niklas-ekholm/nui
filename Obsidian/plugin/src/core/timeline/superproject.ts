
import { isFolderIndexPath } from "../../navigation/folder-index";
import { TimelineItem } from "../models/timeline-item";
import { parentFolderPathFromItemPath } from "./project-label";

export function isSuperprojectItem(itemId: string): boolean {
	return isFolderIndexPath(itemId);
}

export function superprojectPathForFolder(folderPath: string): string {
	const folderName = folderPath.slice(folderPath.lastIndexOf("/") + 1);
	return `${folderPath}/${folderName}.md`;
}

export function getSubprojectIds(
	superprojectId: string,
	itemsById: Map<string, TimelineItem>,
): string[] {
	if (!isSuperprojectItem(superprojectId)) return [];

	const folder = parentFolderPathFromItemPath(superprojectId);
	const ids: string[] = [];

	for (const id of itemsById.keys()) {
		if (id === superprojectId) continue;
		if (parentFolderPathFromItemPath(id) === folder) {
			ids.push(id);
		}
	}

	return ids;
}

export function expandSelectionWithSubprojects(
	ids: Set<string>,
	itemsById: Map<string, TimelineItem>,
): Set<string> {
	const next = new Set(ids);

	for (const id of ids) {
		if (!isSuperprojectItem(id)) continue;
		for (const subId of getSubprojectIds(id, itemsById)) {
			next.add(subId);
		}
	}

	return next;
}

export function collapseSelectionWithoutSubprojects(
	ids: Set<string>,
	itemsById: Map<string, TimelineItem>,
	removedSuperprojectId: string,
): Set<string> {
	if (!isSuperprojectItem(removedSuperprojectId)) return ids;

	const next = new Set(ids);
	for (const subId of getSubprojectIds(removedSuperprojectId, itemsById)) {
		next.delete(subId);
	}
	return next;
}

export interface ExpandedSuperprojectDates {
	start: Date;
	end: Date;
}

export function datesExceedSuperproject(
	subStart: Date,
	subEnd: Date,
	superStart: Date,
	superEnd: Date,
): ExpandedSuperprojectDates | null {
	let nextStart = superStart;
	let nextEnd = superEnd;
	let changed = false;

	if (subStart.getTime() < superStart.getTime()) {
		nextStart = subStart;
		changed = true;
	}
	if (subEnd.getTime() > superEnd.getTime()) {
		nextEnd = subEnd;
		changed = true;
	}

	return changed ? { start: nextStart, end: nextEnd } : null;
}

export function superprojectPathForItem(itemId: string): string | undefined {
	if (isSuperprojectItem(itemId)) return undefined;

	const folder = parentFolderPathFromItemPath(itemId);
	if (!folder) return undefined;

	return superprojectPathForFolder(folder);
}

function itemsMap(items: TimelineItem[]): Map<string, TimelineItem> {
	return new Map(items.map((item) => [item.id, item]));
}

export function superprojectIdForGroupedItem(
	itemId: string,
	items: TimelineItem[],
): string | undefined {
	const superPath = superprojectPathForItem(itemId);
	if (!superPath) return undefined;

	return itemsMap(items).has(superPath) ? superPath : undefined;
}

export function groupTimelineItemsBySuperproject(
	items: TimelineItem[],
): TimelineItem[] {
	const byId = itemsMap(items);
	const groupedSubprojectIds = new Set<string>();
	const groups: Array<{
		superproject: TimelineItem;
		subprojects: TimelineItem[];
	}> = [];

	for (const item of items) {
		if (!isSuperprojectItem(item.id)) continue;

		const subprojects = getSubprojectIds(item.id, byId)
			.map((id) => byId.get(id))
			.filter((entry): entry is TimelineItem => entry !== undefined)
			.sort((a, b) => a.start.getTime() - b.start.getTime());

		for (const subproject of subprojects) {
			groupedSubprojectIds.add(subproject.id);
		}

		groups.push({ superproject: item, subprojects });
	}

	const entries: Array<
		| { kind: "single"; item: TimelineItem; start: number }
		| {
				kind: "group";
				group: (typeof groups)[number];
				start: number;
		  }
	> = [];

	for (const item of items) {
		if (isSuperprojectItem(item.id)) continue;
		if (groupedSubprojectIds.has(item.id)) continue;
		entries.push({
			kind: "single",
			item,
			start: item.start.getTime(),
		});
	}

	for (const group of groups) {
		entries.push({
			kind: "group",
			group,
			start: group.superproject.start.getTime(),
		});
	}

	entries.sort((a, b) => a.start - b.start);

	const result: TimelineItem[] = [];
	for (const entry of entries) {
		if (entry.kind === "single") {
			result.push(entry.item);
			continue;
		}

		result.push(entry.group.superproject);
		result.push(...entry.group.subprojects);
	}

	return result;
}

export function filterCollapsedSubprojects(
	items: TimelineItem[],
	collapsedSuperprojectIds: Set<string>,
): TimelineItem[] {
	if (collapsedSuperprojectIds.size === 0) return items;

	const byId = itemsMap(items);

	return items.filter((item) => {
		if (isSuperprojectItem(item.id)) return true;

		const superPath = superprojectPathForItem(item.id);
		if (!superPath || !byId.has(superPath)) return true;

		return !collapsedSuperprojectIds.has(superPath);
	});
}

export function superprojectHasSubprojects(
	superprojectId: string,
	items: TimelineItem[],
): boolean {
	return getSubprojectIds(superprojectId, itemsMap(items)).length > 0;
}
