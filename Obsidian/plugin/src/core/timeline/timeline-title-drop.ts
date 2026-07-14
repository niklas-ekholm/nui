
import { canMoveIntoProjectFolder } from "../mutate/move-notes-project-folder";
import { isSuperprojectItem } from "./superproject";

const DROP_TARGET_CLASS = "nui-timeline-drop-target";

export function superprojectDropTargetFromPoint(
	x: number,
	y: number,
): string | null {
	const element = document.elementFromPoint(x, y);
	if (!(element instanceof HTMLElement)) return null;

	const row = element.closest<HTMLElement>(".nui-timeline-row[data-item-id]");
	if (!row) return null;

	const id = row.dataset.itemId;
	if (!id || !isSuperprojectItem(id)) return null;

	return id;
}

export function resolveValidDropTarget(
	selectedIds: Set<string>,
	candidateId: string | null,
): string | null {
	if (!candidateId) return null;

	for (const id of selectedIds) {
		if (canMoveIntoProjectFolder(id, candidateId)) {
			return candidateId;
		}
	}

	return null;
}

export function filterMovableIntoProjectFolder(
	itemIds: string[],
	targetSuperprojectId: string,
): string[] {
	return itemIds.filter((id) =>
		canMoveIntoProjectFolder(id, targetSuperprojectId),
	);
}

export function clearDropTargets(body: HTMLElement): void {
	for (const row of Array.from(
		body.querySelectorAll<HTMLElement>(`.${DROP_TARGET_CLASS}`),
	)) {
		row.classList.remove(DROP_TARGET_CLASS);
	}
}

export function setDropTarget(
	body: HTMLElement,
	targetId: string | null,
): void {
	clearDropTargets(body);
	if (!targetId) return;

	const row = body.querySelector<HTMLElement>(
		`.nui-timeline-row[data-item-id="${CSS.escape(targetId)}"]`,
	);
	row?.classList.add(DROP_TARGET_CLASS);
}

export function resolveTitleDropIds(
	titleId: string,
	selectedIds: Set<string>,
): Set<string> {
	if (selectedIds.has(titleId) && selectedIds.size > 0) {
		return new Set(selectedIds);
	}
	return new Set([titleId]);
}
