
import { Platform } from "obsidian";
import { addDays } from "../parse/dates";
import { TimelineItem } from "../models/timeline-item";
import {
	dateFromTrackX,
	dayDeltaFromPixelDelta,
	normalizeRect,
	rectsIntersect,
	trackElementForTimelinePoint,
	trackWidthPx,
} from "./track-geometry";
import { showTimelineEmptyMenu } from "./timeline-empty-menu";
import {
	getTimelineRowElements,
	readTimelineRowDates,
	writeTimelineRowDates,
} from "./timeline-row-dom";
import { trackPointerDrag } from "./pointer-drag";
import { showTimelineItemMenu } from "./timeline-item-menu";
import {
	collapseSelectionWithoutSubprojects,
	expandSelectionWithSubprojects,
	isSuperprojectItem,
} from "./superproject";
import {
	clearDropTargets,
	filterMovableIntoProjectFolder,
	resolveTitleDropIds,
	resolveValidDropTarget,
	setDropTarget,
	superprojectDropTargetFromPoint,
} from "./timeline-title-drop";

const DRAG_THRESHOLD_PX = 4;
const MIN_MARQUEE_PX = 4;

export interface TimelineSelectionOptions {
	scrollEl: HTMLElement;
	rangeStart: Date;
	totalDays: number;
	selectedIds: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onItemClick?: (item: TimelineItem) => void;
	onDatesChange?: (item: TimelineItem, start: Date, end: Date) => void;
	onDeleteItems?: (ids: string[]) => void;
	onDuplicateItems?: (ids: string[]) => void;
	onTurnIntoProjectFolder?: (ids: string[]) => void;
	onMoveItemsToProjectFolder?: (
		itemIds: string[],
		targetSuperprojectId: string,
	) => void;
	onMoveOutOfProjectFolder?: (ids: string[]) => void;
	canMoveOutOfProjectFolder?: (ids: string[]) => boolean;
	onRenameItem?: (itemId: string) => void;
	onCreateNoteAtDate?: (date: Date) => void;
	editable?: boolean;
	itemsById: Map<string, TimelineItem>;
}

function queryBody(scrollEl: HTMLElement): HTMLElement | null {
	return scrollEl.querySelector(".nui-timeline-body");
}

function queryChart(scrollEl: HTMLElement): HTMLElement | null {
	return scrollEl.querySelector(".nui-timeline-chart");
}

export function applySelectionVisuals(
	root: HTMLElement,
	selectedIds: Set<string>,
): void {
	for (const row of Array.from(
		root.querySelectorAll<HTMLElement>(".nui-timeline-row[data-item-id]"),
	)) {
		const id = row.dataset.itemId ?? "";
		const selected = selectedIds.has(id);
		row.classList.toggle("is-selected", selected);
		row.querySelector(".nui-timeline-bar")?.classList.toggle(
			"is-selected",
			selected,
		);
	}
}

function cloneSelection(ids: Set<string>): Set<string> {
	return new Set(ids);
}

function commitSelection(
	root: HTMLElement,
	selectedIds: Set<string>,
	next: Set<string>,
	onSelectionChange: (ids: Set<string>) => void,
): void {
	selectedIds.clear();
	for (const id of next) selectedIds.add(id);
	applySelectionVisuals(root, selectedIds);
	onSelectionChange(cloneSelection(selectedIds));
}

function rowsIntersectingMarquee(
	body: HTMLElement,
	marquee: ReturnType<typeof normalizeRect>,
): string[] {
	const hits: string[] = [];

	for (const row of Array.from(
		body.querySelectorAll<HTMLElement>(".nui-timeline-row[data-item-id]"),
	)) {
		const elements = getTimelineRowElements(row);
		if (!elements) continue;

		const rowRect = row.getBoundingClientRect();
		const barRect = elements.bar.getBoundingClientRect();
		const hitRect = normalizeRect(
			barRect.left,
			rowRect.top,
			barRect.right,
			rowRect.bottom,
		);

		if (rectsIntersect(marquee, hitRect)) {
			const id = row.dataset.itemId;
			if (id) hits.push(id);
		}
	}

	return hits;
}

function barFromTarget(target: EventTarget | null): HTMLElement | null {
	if (!(target instanceof HTMLElement)) return null;
	return target.closest<HTMLElement>(".nui-timeline-bar");
}

function isTitleTarget(target: EventTarget | null): boolean {
	if (
		target instanceof HTMLElement &&
		target.closest(".nui-timeline-bar-title-text-editing")
	) {
		return false;
	}
	return (
		target instanceof HTMLElement &&
		!!target.closest(".nui-timeline-bar-title") &&
		!target.closest(".nui-timeline-superproject-toggle")
	);
}

function rowIdFromTarget(target: EventTarget | null): string | null {
	if (!(target instanceof HTMLElement)) return null;
	const row = target.closest<HTMLElement>(".nui-timeline-row[data-item-id]");
	return row?.dataset.itemId ?? null;
}

function isHandleTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		!!target.closest(".nui-timeline-handle")
	);
}

function isEmptyTimelineContextTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (
		target.closest(
			".nui-timeline-topbar, .nui-timeline-header, .nui-timeline-search",
		)
	) {
		return false;
	}
	if (barFromTarget(target)) return false;
	if (isTitleTarget(target)) return false;
	if (target.closest(".nui-timeline-handle")) return false;
	return !!target.closest(
		".nui-timeline-chart, .nui-timeline-body, .nui-timeline-grid, .nui-timeline-axis, .nui-timeline-track, .nui-timeline-row, .nui-timeline-empty",
	);
}

export function attachTimelineSelection(options: TimelineSelectionOptions): void {
	const {
		scrollEl,
		rangeStart,
		totalDays,
		selectedIds,
		onSelectionChange,
		onItemClick,
		onDatesChange,
		onDeleteItems,
		onDuplicateItems,
		onTurnIntoProjectFolder,
		onMoveItemsToProjectFolder,
		onMoveOutOfProjectFolder,
		canMoveOutOfProjectFolder,
		onRenameItem,
		onCreateNoteAtDate,
		editable,
		itemsById,
	} = options;

	const root = scrollEl.closest(".nui-timeline");
	const body = queryBody(scrollEl);
	if (!(root instanceof HTMLElement) || !body) return;

	applySelectionVisuals(root, selectedIds);

	let pointerOver = false;

	const onPointerEnter = () => {
		pointerOver = true;
		root.focus({ preventScroll: true });
	};

	const onPointerLeave = () => {
		pointerOver = false;
	};

	scrollEl.addEventListener("pointerenter", onPointerEnter);
	scrollEl.addEventListener("pointerleave", onPointerLeave);

	const onKeyDown = (event: KeyboardEvent) => {
		if (!pointerOver) return;

		if (event.code === "Escape" && selectedIds.size > 0) {
			commitSelection(root, selectedIds, new Set(), onSelectionChange);
			event.preventDefault();
		}
	};

	root.tabIndex = -1;
	root.addEventListener("keydown", onKeyDown);

	const onBodyPointerDown = (event: PointerEvent) => {
		if (event.button !== 0 && event.pointerType !== "touch") return;
		if (isHandleTarget(event.target)) return;

		const startX = event.clientX;
		const startY = event.clientY;
		const shift = event.shiftKey;
		const titleClick = isTitleTarget(event.target);
		const titleId = titleClick ? rowIdFromTarget(event.target) : null;
		const bar = barFromTarget(event.target);
		const barRow = bar?.closest<HTMLElement>(".nui-timeline-row[data-item-id]");
		const barId = barRow?.dataset.itemId;

		let mode: "marquee" | "move" | "bar" | "title" | "title-drop" = "marquee";
		let titleDropIds: Set<string> | null = null;
		if (titleClick && titleId) {
			if (onMoveItemsToProjectFolder && !isSuperprojectItem(titleId)) {
				mode = "title-drop";
				titleDropIds = resolveTitleDropIds(titleId, selectedIds);
			} else {
				mode = "title";
			}
		} else if (editable && onDatesChange && bar && barId) {
			mode = selectedIds.has(barId) ? "move" : "bar";
		} else if (bar && barId) {
			mode = "bar";
		}

		if (Platform.isMobile && mode === "marquee") {
			if (!shift) {
				commitSelection(root, selectedIds, new Set(), onSelectionChange);
			}
			return;
		}

		let marqueeEl: HTMLElement | null = null;
		let moved = false;
		let dropTargetId: string | null = null;
		const moveStarts = new Map<string, { start: Date; end: Date }>();
		let referenceTrack: HTMLElement | null = null;

		const populateMoveStarts = () => {
			moveStarts.clear();
			for (const id of selectedIds) {
				const row = body.querySelector<HTMLElement>(
					`.nui-timeline-row[data-item-id="${CSS.escape(id)}"]`,
				);
				if (!row) continue;
				const dates = readTimelineRowDates(row);
				if (!dates) continue;
				moveStarts.set(id, dates);
			}
			referenceTrack =
				barRow?.querySelector<HTMLElement>(".nui-timeline-track") ?? null;
		};

		if (mode === "move") {
			populateMoveStarts();
		}

		const promoteBarToMove = () => {
			if (mode !== "bar" || !barId || !editable || !onDatesChange) return;

			const next = shift ? cloneSelection(selectedIds) : new Set<string>();
			if (!shift) {
				next.clear();
				next.add(barId);
			} else if (!next.has(barId)) {
				next.add(barId);
			}
			commitSelection(root, selectedIds, next, onSelectionChange);
			populateMoveStarts();
			mode = "move";
		};

		if (mode === "move" || mode === "bar" || mode === "title-drop") {
			event.preventDefault();
			event.stopPropagation();
		}

		trackPointerDrag({
			event,
			onMove: (moveEvent) => {
				const deltaX = moveEvent.clientX - startX;
				const deltaY = moveEvent.clientY - startY;

				if (
					!moved &&
					Math.abs(deltaX) < DRAG_THRESHOLD_PX &&
					Math.abs(deltaY) < DRAG_THRESHOLD_PX
				) {
					return;
				}

				if (!moved) {
					moved = true;
					if (mode === "title-drop") {
						document.body.classList.add("nui-timeline-title-dragging");
					} else {
						promoteBarToMove();
					}
				}

				if (mode === "title-drop" && titleDropIds) {
					const candidate = superprojectDropTargetFromPoint(
						moveEvent.clientX,
						moveEvent.clientY,
					);
					dropTargetId = resolveValidDropTarget(titleDropIds, candidate);
					setDropTarget(body, dropTargetId);
					return;
				}

				if (mode === "title" || mode === "bar") return;

				if (mode === "move" && referenceTrack && moveStarts.size > 0) {
					const dayDelta = dayDeltaFromPixelDelta(
						deltaX,
						trackWidthPx(referenceTrack),
						totalDays,
					);

					for (const [id, dates] of moveStarts) {
						const row = body.querySelector<HTMLElement>(
							`.nui-timeline-row[data-item-id="${CSS.escape(id)}"]`,
						);
						if (!row) continue;
						const elements = getTimelineRowElements(row);
						if (!elements) continue;

						const nextStart = addDays(dates.start, dayDelta);
						const nextEnd = addDays(dates.end, dayDelta);
						writeTimelineRowDates(
							elements,
							rangeStart,
							totalDays,
							nextStart,
							nextEnd,
						);
					}
					return;
				}

				if (!marqueeEl) {
					marqueeEl = document.createElement("div");
					marqueeEl.className = "nui-timeline-marquee";
					body.appendChild(marqueeEl);
				}

				const bodyRect = body.getBoundingClientRect();
				const marquee = normalizeRect(
					startX,
					startY,
					moveEvent.clientX,
					moveEvent.clientY,
				);
				marqueeEl.style.left = `${marquee.left - bodyRect.left}px`;
				marqueeEl.style.top = `${marquee.top - bodyRect.top}px`;
				marqueeEl.style.width = `${marquee.right - marquee.left}px`;
				marqueeEl.style.height = `${marquee.bottom - marquee.top}px`;
			},
			onEnd: (upEvent) => {
				marqueeEl?.remove();
				clearDropTargets(body);
				document.body.classList.remove("nui-timeline-title-dragging");

				if (
					mode === "title-drop" &&
					moved &&
					dropTargetId &&
					titleDropIds &&
					onMoveItemsToProjectFolder
				) {
					const itemIds = filterMovableIntoProjectFolder(
						Array.from(titleDropIds),
						dropTargetId,
					);
					if (itemIds.length > 0) {
						onMoveItemsToProjectFolder(itemIds, dropTargetId);
					}
					return;
				}

				if (mode === "move" && moved && onDatesChange) {
					document.body.classList.add("nui-timeline-dragging");
					for (const [id, original] of moveStarts) {
						const row = body.querySelector<HTMLElement>(
							`.nui-timeline-row[data-item-id="${CSS.escape(id)}"]`,
						);
						if (!row) continue;
						const next = readTimelineRowDates(row);
						const item = itemsById.get(id);
						if (!next || !item) continue;

						if (
							next.start.getTime() !== original.start.getTime() ||
							next.end.getTime() !== original.end.getTime()
						) {
							const barEl = row.querySelector<HTMLElement>(".nui-timeline-bar");
							if (barEl) barEl.dataset.suppressClick = "true";
							onDatesChange(item, next.start, next.end);
						}
					}
					window.setTimeout(() => {
						document.body.classList.remove("nui-timeline-dragging");
					}, 0);
					return;
				}

				if (
					(mode === "title" || mode === "title-drop") &&
					!moved &&
					titleId &&
					onItemClick
				) {
					const item = itemsById.get(titleId);
					if (item) onItemClick(item);
					return;
				}

				if (mode === "bar" && !moved && barId) {
					const next = cloneSelection(selectedIds);
					if (shift) {
						if (next.has(barId)) {
							next.delete(barId);
							if (isSuperprojectItem(barId)) {
								collapseSelectionWithoutSubprojects(
									next,
									itemsById,
									barId,
								);
							}
						} else {
							next.add(barId);
						}
					} else {
						next.clear();
						next.add(barId);
					}
					commitSelection(
						root,
						selectedIds,
						expandSelectionWithSubprojects(next, itemsById),
						onSelectionChange,
					);
					return;
				}

				if (mode === "marquee" && moved) {
					const width = Math.abs(upEvent.clientX - startX);
					const height = Math.abs(upEvent.clientY - startY);
					if (width < MIN_MARQUEE_PX && height < MIN_MARQUEE_PX) {
						if (!shift) {
							commitSelection(root, selectedIds, new Set(), onSelectionChange);
						}
						return;
					}

					const marquee = normalizeRect(
						startX,
						startY,
						upEvent.clientX,
						upEvent.clientY,
					);
					const hits = rowsIntersectingMarquee(body, marquee);
					const next = shift ? cloneSelection(selectedIds) : new Set<string>();
					for (const id of hits) next.add(id);
					commitSelection(root, selectedIds, next, onSelectionChange);
					return;
				}

				if (mode === "marquee" && !moved && !shift) {
					commitSelection(root, selectedIds, new Set(), onSelectionChange);
				}
			},
		});
	};

	body.addEventListener("pointerdown", onBodyPointerDown);

	const onBodyContextMenu = (event: MouseEvent) => {
		const isBar = !!barFromTarget(event.target);
		const isTitle = isTitleTarget(event.target);

		if (isBar || isTitle) {
			if (
				!onDeleteItems &&
				!onDuplicateItems &&
				!onTurnIntoProjectFolder &&
				!onMoveOutOfProjectFolder &&
				!onRenameItem
			) {
				return;
			}

			const rowId = rowIdFromTarget(event.target);
			if (!rowId) return;

			const targetIds = selectedIds.has(rowId)
				? cloneSelection(selectedIds)
				: new Set([rowId]);

			if (!selectedIds.has(rowId)) {
				commitSelection(root, selectedIds, targetIds, onSelectionChange);
			}

			const ids = Array.from(targetIds);
			const canTurnIntoProjectFolder =
				ids.length === 1 && !isSuperprojectItem(ids[0]);
			const showMoveOutOfProjectFolder =
				onMoveOutOfProjectFolder &&
				canMoveOutOfProjectFolder?.(ids) === true;
			showTimelineItemMenu(event, {
				onDelete: () => onDeleteItems?.(ids),
				onDuplicate: () => onDuplicateItems?.(ids),
				onRename:
					ids.length === 1 && onRenameItem
						? () => onRenameItem(ids[0])
						: undefined,
				onTurnIntoProjectFolder:
					canTurnIntoProjectFolder && onTurnIntoProjectFolder
						? () => onTurnIntoProjectFolder(ids)
						: undefined,
				onMoveOutOfProjectFolder:
					showMoveOutOfProjectFolder && onMoveOutOfProjectFolder
						? () => onMoveOutOfProjectFolder(ids)
						: undefined,
			});
			return;
		}

		if (!onCreateNoteAtDate || !isEmptyTimelineContextTarget(event.target)) {
			return;
		}

		const track = trackElementForTimelinePoint(
			scrollEl,
			event.clientX,
			event.clientY,
		);
		if (!track) return;

		const date = dateFromTrackX(
			track,
			event.clientX,
			rangeStart,
			totalDays,
		);
		showTimelineEmptyMenu(event, {
			onNew: () => onCreateNoteAtDate(date),
		});
	};

	body.addEventListener("contextmenu", onBodyContextMenu);
}

