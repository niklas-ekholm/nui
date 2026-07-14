
import { addDays, daysBetween } from "../parse/dates";
import { TimelineItem } from "../models/timeline-item";
import { dateFromTrackX } from "./track-geometry";
import {
	getTimelineRowElements,
	readTimelineRowDates,
	writeTimelineRowDates,
	TimelineRowElements,
} from "./timeline-row-dom";
import { trackPointerDrag } from "./pointer-drag";
import { isSuperprojectItem } from "./superproject";

export type DragEdge = "start" | "end";

export interface BarDragOptions {
	rangeStart: Date;
	totalDays: number;
	track: HTMLElement;
	bar: HTMLElement;
	body: HTMLElement;
	selectedIds: Set<string>;
	itemsById: Map<string, TimelineItem>;
	titleEl?: HTMLElement;
	startDateEl: HTMLElement;
	endDateEl: HTMLElement;
	item: TimelineItem;
	handle: HTMLElement;
	edge: DragEdge;
	onChange: (item: TimelineItem, start: Date, end: Date) => void;
}

interface DragTarget {
	item: TimelineItem;
	elements: TimelineRowElements;
	originalStart: Date;
	originalEnd: Date;
}

function collectDragTargets(
	body: HTMLElement,
	itemsById: Map<string, TimelineItem>,
	selectedIds: Set<string>,
	primaryId: string,
): DragTarget[] {
	const ids =
		isSuperprojectItem(primaryId) ||
		!(selectedIds.has(primaryId) && selectedIds.size > 1)
			? [primaryId]
			: Array.from(selectedIds);

	const targets: DragTarget[] = [];

	for (const id of ids) {
		const row = body.querySelector<HTMLElement>(
			`.nui-timeline-row[data-item-id="${CSS.escape(id)}"]`,
		);
		if (!row) continue;

		const elements = getTimelineRowElements(row);
		const item = itemsById.get(id);
		const dates = readTimelineRowDates(row);
		if (!elements || !item || !dates) continue;

		targets.push({
			item,
			elements,
			originalStart: dates.start,
			originalEnd: dates.end,
		});
	}

	return targets;
}

function applyEdgeDrag(
	targets: DragTarget[],
	primaryId: string,
	edge: DragEdge,
	pointerDate: Date,
	rangeStart: Date,
	totalDays: number,
): void {
	const primary = targets.find((target) => target.item.id === primaryId);
	if (!primary) return;

	const dayDelta =
		edge === "start"
			? daysBetween(
					primary.originalStart,
					pointerDate.getTime() <= primary.originalEnd.getTime()
						? pointerDate
						: primary.originalEnd,
				)
			: daysBetween(
					primary.originalEnd,
					pointerDate.getTime() >= primary.originalStart.getTime()
						? pointerDate
						: primary.originalStart,
				);

	for (const target of targets) {
		if (edge === "start") {
			let nextStart = addDays(target.originalStart, dayDelta);
			if (nextStart.getTime() > target.originalEnd.getTime()) {
				nextStart = target.originalEnd;
			}
			writeTimelineRowDates(
				target.elements,
				rangeStart,
				totalDays,
				nextStart,
				target.originalEnd,
			);
			continue;
		}

		let nextEnd = addDays(target.originalEnd, dayDelta);
		if (nextEnd.getTime() < target.originalStart.getTime()) {
			nextEnd = target.originalStart;
		}
		writeTimelineRowDates(
			target.elements,
			rangeStart,
			totalDays,
			target.originalStart,
			nextEnd,
		);
	}
}

export function attachBarDrag(options: BarDragOptions): void {
	const {
		rangeStart,
		totalDays,
		track,
		body,
		selectedIds,
		itemsById,
		item,
		handle,
		edge,
		onChange,
	} = options;

	handle.style.touchAction = "none";

	handle.addEventListener("pointerdown", (event) => {
		if (event.button !== 0 && event.pointerType !== "touch") return;
		event.preventDefault();
		event.stopPropagation();

		const targets = collectDragTargets(body, itemsById, selectedIds, item.id);
		let moved = false;

		document.body.classList.add("nui-timeline-dragging");

		trackPointerDrag({
			event,
			onMove: (moveEvent) => {
				const pointerDate = dateFromTrackX(
					track,
					moveEvent.clientX,
					rangeStart,
					totalDays,
					edge,
				);
				const primary = targets.find((target) => target.item.id === item.id);
				if (!primary) return;

				const before = readTimelineRowDates(primary.elements.row);
				applyEdgeDrag(targets, item.id, edge, pointerDate, rangeStart, totalDays);
				const after = readTimelineRowDates(primary.elements.row);

				if (
					before &&
					after &&
					(before.start.getTime() !== after.start.getTime() ||
						before.end.getTime() !== after.end.getTime())
				) {
					moved = true;
				}
			},
			onEnd: () => {
				document.body.classList.remove("nui-timeline-dragging");

				if (!moved) return;

				for (const target of targets) {
					const next = readTimelineRowDates(target.elements.row);
					if (!next) continue;

					const changed =
						next.start.getTime() !== target.originalStart.getTime() ||
						next.end.getTime() !== target.originalEnd.getTime();

					if (changed) {
						target.elements.bar.dataset.suppressClick = "true";
						onChange(target.item, next.start, next.end);
					}
				}
			},
		});
	});
}

