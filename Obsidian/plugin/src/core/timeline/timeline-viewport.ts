
import { Platform } from "obsidian";
import { addDays, daysBetween, formatDisplayDate } from "../parse/dates";
import {
	applyTimelineRowSizeStyles,
	clampTimelineRowSizePresetIndex,
	formatTimelineRowSize,
	TIMELINE_LABEL_WIDTH,
	rowSizeFromPresetIndex,
	rowSizePresetIndex,
	snapTimelineRowSize,
} from "../../timeline/types";
import { updateTimelineRangePreview } from "./timeline-range-preview";
import { trackPointerDrag } from "./pointer-drag";

export { TIMELINE_LABEL_WIDTH };

const DATE_SCRUB_PX_PER_DAY = 6;
/** Exponential wheel/pinch sensitivity — same family as canvas zoom (Figma-style). */
const WHEEL_ZOOM_INTENSITY = 0.005;
const WHEEL_PAN_COMMIT_MS = 150;
const MIN_RANGE_DAYS = 1;

function zoomRangeAtAnchor(
	start: Date,
	end: Date,
	anchorFraction: number,
	scaleFactor: number,
): { start: Date; end: Date } {
	const span = Math.max(MIN_RANGE_DAYS, daysBetween(start, end));
	const newSpan = Math.max(MIN_RANGE_DAYS, Math.round(span * scaleFactor));
	const anchor = Math.max(0, Math.min(1, anchorFraction));
	const anchorDate = addDays(start, Math.round(span * anchor));
	const newStart = addDays(anchorDate, -Math.round(newSpan * anchor));
	const newEnd = addDays(newStart, newSpan);
	return { start: newStart, end: newEnd };
}

function panRangeByPixels(
	start: Date,
	end: Date,
	pixelDelta: number,
	viewportWidth: number,
): { start: Date; end: Date } {
	const span = Math.max(MIN_RANGE_DAYS, daysBetween(start, end));
	const width = Math.max(viewportWidth, 1);
	const dayDelta = -Math.round((pixelDelta / width) * span);
	return { start: addDays(start, dayDelta), end: addDays(end, dayDelta) };
}

function panRangeByDays(
	start: Date,
	end: Date,
	dayDelta: number,
): { start: Date; end: Date } {
	return { start: addDays(start, dayDelta), end: addDays(end, dayDelta) };
}

function isTimelineKeyboardBlocked(): boolean {
	const active = document.activeElement;
	if (!(active instanceof HTMLElement)) return false;
	if (active.isContentEditable) return true;
	return !!active.closest("input, textarea, select");
}

function shouldHandleTimelineKeyboard(
	root: HTMLElement,
	pointerOver: boolean,
): boolean {
	if (isTimelineKeyboardBlocked()) return false;
	const active = document.activeElement;
	return pointerOver || (active instanceof Node && root.contains(active));
}

function wheelPanDelta(event: WheelEvent): number | null {
	const absX = Math.abs(event.deltaX);
	const absY = Math.abs(event.deltaY);
	if (absX > absY) return -event.deltaX;
	return null;
}

function chartViewportWidth(scrollEl: HTMLElement): number {
	const body = queryChart(scrollEl)?.querySelector<HTMLElement>(
		".nui-timeline-body",
	);
	return body?.getBoundingClientRect().width ?? scrollEl.clientWidth;
}

function isRangePanTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (
		target.closest(
			".nui-timeline-bar, .nui-timeline-handle, .nui-timeline-date",
		)
	) {
		return false;
	}
	if (Platform.isMobile) {
		return !!target.closest(
			".nui-timeline-axis, .nui-timeline-body, .nui-timeline-track, .nui-timeline-grid",
		);
	}
	return !!target.closest(".nui-timeline-axis-row");
}

function pointerAnchorFraction(event: WheelEvent, scrollEl: HTMLElement): number {
	const area =
		queryChart(scrollEl)?.querySelector<HTMLElement>(".nui-timeline-body") ??
		queryChart(scrollEl);
	if (!area) return 0.5;
	const rect = area.getBoundingClientRect();
	if (rect.width <= 0) return 0.5;
	return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
}

function wheelZoomScaleFactor(deltaY: number): number {
	return Math.exp(deltaY * WHEEL_ZOOM_INTENSITY);
}

export interface TimelineViewportOptions {
	rowSize: number;
	rangeStart: Date;
	rangeEnd: Date;
	onRowSizeChange?: (rowSize: number) => void;
	onRangePreview?: (start: Date, end: Date) => void;
	onRangeChange?: (start: Date, end: Date) => void;
}

function queryTimelineRoot(scrollEl: HTMLElement): HTMLElement | null {
	return scrollEl.closest(".nui-timeline");
}

function queryChart(scrollEl: HTMLElement): HTMLElement | null {
	return scrollEl.querySelector(".nui-timeline-chart");
}

function isChartNavigationTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		!!target.closest(".nui-timeline-axis, .nui-timeline-body")
	);
}

interface ValueScrubOptions {
	label: HTMLElement;
	getValue: () => number;
	format: (value: number) => string;
	clamp: (value: number) => number;
	step: number;
	pixelsPerStep: number;
	onPreview: (value: number) => void;
	onCommit: (value: number) => void;
}

function queryScrubLabel(root: HTMLElement | null, scrubId: string): HTMLElement | null {
	return root?.querySelector<HTMLElement>(`[data-scrub="${scrubId}"]`) ?? null;
}

interface DateScrubOptions {
	scrubId: string;
	root: HTMLElement | null;
	getDate: () => Date;
	clamp: (date: Date) => Date;
	onPreview: (date: Date) => void;
	onCommit: (date: Date) => void;
}

function attachDateScrub(options: DateScrubOptions): void {
	const { scrubId, root, getDate, clamp, onPreview, onCommit } = options;
	const label = queryScrubLabel(root, scrubId);
	if (!label) return;

	let startY = 0;
	let startDate = getDate();
	let previewDate = startDate;

	const syncLabel = () => {
		const activeLabel = queryScrubLabel(root, scrubId);
		if (!activeLabel) return;
		activeLabel.textContent = formatDisplayDate(previewDate);
		activeLabel.classList.add("is-scrubbing");
	};

	const onPointerMove = (event: PointerEvent) => {
		const deltaDays = -Math.round(
			(event.clientY - startY) / DATE_SCRUB_PX_PER_DAY,
		);
		previewDate = clamp(addDays(startDate, deltaDays));
		syncLabel();
		onPreview(previewDate);
	};

	const onPointerUp = () => {
		document.body.classList.remove("nui-timeline-date-scrubbing");

		const activeLabel = queryScrubLabel(root, scrubId);
		activeLabel?.classList.remove("is-scrubbing");

		if (previewDate.getTime() !== startDate.getTime()) {
			onCommit(previewDate);
		}
	};

	label.style.touchAction = "none";
	label.addEventListener("pointerdown", (event) => {
		if (event.button !== 0 && event.pointerType !== "touch") return;
		event.preventDefault();
		startY = event.clientY;
		startDate = getDate();
		previewDate = startDate;
		document.body.classList.add("nui-timeline-date-scrubbing");
		label.classList.add("is-scrubbing");
		trackPointerDrag({
			event,
			onMove: onPointerMove,
			onEnd: onPointerUp,
		});
	});
}

function attachValueScrub(options: ValueScrubOptions): void {
	const { label, getValue, format, clamp, step, pixelsPerStep, onPreview, onCommit } =
		options;

	let startX = 0;
	let startY = 0;
	let startValue = 0;
	let previewValue = 0;

	const onPointerMove = (event: PointerEvent) => {
		const deltaSteps =
			Math.round((event.clientX - startX) / pixelsPerStep) +
			Math.round(-(event.clientY - startY) / pixelsPerStep);
		previewValue = clamp(startValue + deltaSteps * step);
		label.textContent = format(previewValue);
		onPreview(previewValue);
	};

	const onPointerUp = () => {
		document.body.classList.remove("nui-timeline-scrubbing");
		label.classList.remove("is-scrubbing");

		if (previewValue !== getValue()) {
			onCommit(previewValue);
		}
	};

	label.style.touchAction = "none";
	label.addEventListener("pointerdown", (event) => {
		if (event.button !== 0 && event.pointerType !== "touch") return;
		event.preventDefault();
		startX = event.clientX;
		startY = event.clientY;
		startValue = getValue();
		previewValue = startValue;
		document.body.classList.add("nui-timeline-scrubbing");
		label.classList.add("is-scrubbing");
		trackPointerDrag({
			event,
			onMove: onPointerMove,
			onEnd: onPointerUp,
		});
	});
}

interface RangePanOptions {
	surface: HTMLElement;
	root: HTMLElement | null;
	getRange: () => { start: Date; end: Date };
	getViewportWidth: () => number;
	onPreview: (start: Date, end: Date) => void;
	onCommit: (start: Date, end: Date) => void;
	onPanStart?: () => void;
}

const MOBILE_TOUCH_GUARD_THRESHOLD = 4;

function attachMobileTimelineTouchGuard(
	surface: HTMLElement,
	isPanTarget: (target: EventTarget | null) => boolean,
): void {
	surface.style.touchAction = "pan-y";

	let touchStartX = 0;
	let touchStartY = 0;
	let touchTracking = false;

	surface.addEventListener(
		"touchstart",
		(event) => {
			if (event.touches.length !== 1) {
				touchTracking = false;
				return;
			}
			if (!isPanTarget(event.target)) {
				touchTracking = false;
				return;
			}
			touchTracking = true;
			touchStartX = event.touches[0].clientX;
			touchStartY = event.touches[0].clientY;
		},
		{ passive: true, capture: true },
	);

	const endTouch = () => {
		touchTracking = false;
	};

	surface.addEventListener("touchend", endTouch, { passive: true, capture: true });
	surface.addEventListener("touchcancel", endTouch, {
		passive: true,
		capture: true,
	});

	surface.addEventListener(
		"touchmove",
		(event) => {
			if (!touchTracking || event.touches.length !== 1) return;

			const dx = event.touches[0].clientX - touchStartX;
			const dy = event.touches[0].clientY - touchStartY;
			if (
				Math.abs(dx) < MOBILE_TOUCH_GUARD_THRESHOLD &&
				Math.abs(dy) < MOBILE_TOUCH_GUARD_THRESHOLD
			) {
				return;
			}

			if (Math.abs(dx) > Math.abs(dy)) {
				event.preventDefault();
				event.stopPropagation();
			} else {
				touchTracking = false;
			}
		},
		{ passive: false, capture: true },
	);
}

function attachRangePan(options: RangePanOptions): void {
	const { surface, root, getRange, getViewportWidth, onPreview, onCommit, onPanStart } =
		options;

	const MOBILE_PAN_THRESHOLD = 8;

	surface.addEventListener("pointerdown", (event) => {
		if (event.button !== 0 && event.pointerType !== "touch") return;
		if (!isRangePanTarget(event.target)) return;

		if (Platform.isMobile) {
			const pointerId = event.pointerId;
			let startX = event.clientX;
			let startY = event.clientY;
			let startRange = getRange();
			let panning = false;

			const cleanup = () => {
				surface.removeEventListener("pointermove", onMove);
				surface.removeEventListener("pointerup", onEnd);
				surface.removeEventListener("pointercancel", onEnd);
				if (surface.hasPointerCapture?.(pointerId)) {
					surface.releasePointerCapture(pointerId);
				}
			};

			const onMove = (moveEvent: PointerEvent) => {
				if (moveEvent.pointerId !== pointerId) return;

				const pixelDelta = moveEvent.clientX - startX;
				const verticalDelta = moveEvent.clientY - startY;

				if (!panning) {
					if (
						Math.abs(pixelDelta) < MOBILE_PAN_THRESHOLD &&
						Math.abs(verticalDelta) < MOBILE_PAN_THRESHOLD
					) {
						return;
					}
					if (Math.abs(verticalDelta) >= Math.abs(pixelDelta)) {
						cleanup();
						return;
					}
					panning = true;
					onPanStart?.();
					startRange = getRange();
					document.body.classList.add("nui-timeline-panning");
					surface.classList.add("is-panning");
					surface.setPointerCapture?.(pointerId);
				}

				moveEvent.preventDefault();
				moveEvent.stopPropagation();
				const next = panRangeByPixels(
					startRange.start,
					startRange.end,
					pixelDelta,
					getViewportWidth(),
				);
				onPreview(next.start, next.end);
			};

			const onEnd = (endEvent: PointerEvent) => {
				if (endEvent.pointerId !== pointerId) return;

				const pixelDelta = endEvent.clientX - startX;
				cleanup();

				if (!panning) return;

				document.body.classList.remove("nui-timeline-panning");
				surface.classList.remove("is-panning");

				if (pixelDelta === 0) return;

				const next = panRangeByPixels(
					startRange.start,
					startRange.end,
					pixelDelta,
					getViewportWidth(),
				);

				if (
					next.start.getTime() !== startRange.start.getTime() ||
					next.end.getTime() !== startRange.end.getTime()
				) {
					onCommit(next.start, next.end);
				}
			};

			surface.addEventListener("pointermove", onMove);
			surface.addEventListener("pointerup", onEnd);
			surface.addEventListener("pointercancel", onEnd);
			return;
		}

		event.preventDefault();
		onPanStart?.();
		let startX = event.clientX;
		let startRange = getRange();

		const onPointerMove = (moveEvent: PointerEvent) => {
			const pixelDelta = moveEvent.clientX - startX;
			const next = panRangeByPixels(
				startRange.start,
				startRange.end,
				pixelDelta,
				getViewportWidth(),
			);
			onPreview(next.start, next.end);
		};

		const onPointerUp = (upEvent: PointerEvent) => {
			document.body.classList.remove("nui-timeline-panning");
			surface.classList.remove("is-panning");

			const pixelDelta = upEvent.clientX - startX;

			if (pixelDelta === 0) return;

			const next = panRangeByPixels(
				startRange.start,
				startRange.end,
				pixelDelta,
				getViewportWidth(),
			);

			if (
				next.start.getTime() !== startRange.start.getTime() ||
				next.end.getTime() !== startRange.end.getTime()
			) {
				onCommit(next.start, next.end);
			}
		};

		document.body.classList.add("nui-timeline-panning");
		surface.classList.add("is-panning");
		trackPointerDrag({
			event,
			onMove: onPointerMove,
			onEnd: onPointerUp,
		});
	});
}

export function attachTimelineViewport(
	scrollEl: HTMLElement,
	options: TimelineViewportOptions,
): void {
	const root = queryTimelineRoot(scrollEl);
	const rowGapLabel = root?.querySelector<HTMLElement>('[data-scrub="row-gap"]');
	const chart = queryChart(scrollEl);

	let liveRangeStart = options.rangeStart;
	let liveRangeEnd = options.rangeEnd;

	let wheelPanPixelTotal = 0;
	let wheelPanStartRange: { start: Date; end: Date } | null = null;
	let wheelPanCommitTimer: ReturnType<typeof setTimeout> | null = null;

	const previewPanRange = (start: Date, end: Date) => {
		liveRangeStart = start;
		liveRangeEnd = end;
		if (root) {
			updateTimelineRangePreview(root, start, end);
		}
	};

	const previewDateRange = (start: Date, end: Date) => {
		cancelWheelPan();
		previewPanRange(start, end);
	};

	const resetWheelPanState = () => {
		wheelPanPixelTotal = 0;
		wheelPanStartRange = null;
	};

	const cancelWheelPan = () => {
		if (wheelPanCommitTimer !== null) {
			clearTimeout(wheelPanCommitTimer);
			wheelPanCommitTimer = null;
		}
		resetWheelPanState();
	};

	const flushWheelPanCommit = () => {
		if (wheelPanCommitTimer !== null) {
			clearTimeout(wheelPanCommitTimer);
			wheelPanCommitTimer = null;
		}

		if (!wheelPanStartRange || wheelPanPixelTotal === 0) {
			resetWheelPanState();
			return;
		}

		const next = panRangeByPixels(
			wheelPanStartRange.start,
			wheelPanStartRange.end,
			wheelPanPixelTotal,
			chartViewportWidth(scrollEl),
		);
		resetWheelPanState();

		liveRangeStart = next.start;
		liveRangeEnd = next.end;
		options.onRangeChange?.(next.start, next.end);
	};

	const scheduleWheelPanCommit = () => {
		if (wheelPanCommitTimer !== null) {
			clearTimeout(wheelPanCommitTimer);
		}
		wheelPanCommitTimer = setTimeout(() => {
			wheelPanCommitTimer = null;
			flushWheelPanCommit();
		}, WHEEL_PAN_COMMIT_MS);
	};

	const previewWheelPan = () => {
		if (!wheelPanStartRange) return;

		const next = panRangeByPixels(
			wheelPanStartRange.start,
			wheelPanStartRange.end,
			wheelPanPixelTotal,
			chartViewportWidth(scrollEl),
		);
		previewPanRange(next.start, next.end);
	};

	const commitRange = (start: Date, end: Date) => {
		cancelWheelPan();
		liveRangeStart = start;
		liveRangeEnd = end;
		options.onRangeChange?.(start, end);
	};

	const applyRowSize = (nextRowSize: number) => {
		const clamped = snapTimelineRowSize(nextRowSize);
		if (clamped === options.rowSize) return;
		options.onRowSizeChange?.(clamped);
	};

	const previewRowSize = (rowSize: number) => {
		const chart = queryChart(scrollEl);
		if (chart) applyTimelineRowSizeStyles(chart, snapTimelineRowSize(rowSize));
	};

	if (rowGapLabel && options.onRowSizeChange) {
		rowGapLabel.textContent = formatTimelineRowSize(options.rowSize);
		attachValueScrub({
			label: rowGapLabel,
			getValue: () => rowSizePresetIndex(options.rowSize),
			format: (index) =>
				formatTimelineRowSize(rowSizeFromPresetIndex(index)),
			clamp: clampTimelineRowSizePresetIndex,
			step: 1,
			pixelsPerStep: 4,
			onPreview: (index) => previewRowSize(rowSizeFromPresetIndex(index)),
			onCommit: (index) => applyRowSize(rowSizeFromPresetIndex(index)),
		});
	}

	let pointerOver = false;
	scrollEl.addEventListener("pointerenter", () => {
		pointerOver = true;
	});
	scrollEl.addEventListener("pointerleave", () => {
		pointerOver = false;
	});

	if (options.onRangeChange) {
		if (root) {
			root.addEventListener("keydown", (event) => {
				if (!shouldHandleTimelineKeyboard(root, pointerOver)) return;

				let dayDelta = 0;
				if (event.code === "ArrowLeft") dayDelta = -1;
				else if (event.code === "ArrowRight") dayDelta = 1;
				else return;

				event.preventDefault();
				const next = panRangeByDays(
					liveRangeStart,
					liveRangeEnd,
					dayDelta,
				);
				commitRange(next.start, next.end);
			});
		}

		attachDateScrub({
			scrubId: "range-start",
			root,
			getDate: () => liveRangeStart,
			clamp: (date) =>
				date.getTime() <= liveRangeEnd.getTime() ? date : liveRangeEnd,
			onPreview: (date) => previewDateRange(date, liveRangeEnd),
			onCommit: (date) => commitRange(date, liveRangeEnd),
		});

		attachDateScrub({
			scrubId: "range-end",
			root,
			getDate: () => liveRangeEnd,
			clamp: (date) =>
				date.getTime() >= liveRangeStart.getTime() ? date : liveRangeStart,
			onPreview: (date) => previewDateRange(liveRangeStart, date),
			onCommit: (date) => commitRange(liveRangeStart, date),
		});

		if (chart) {
			attachRangePan({
				surface: chart,
				root,
				getRange: () => ({ start: liveRangeStart, end: liveRangeEnd }),
				getViewportWidth: () => chartViewportWidth(scrollEl),
				onPreview: previewPanRange,
				onCommit: commitRange,
				onPanStart: cancelWheelPan,
			});
		}

		if (Platform.isMobile) {
			attachMobileTimelineTouchGuard(scrollEl, isRangePanTarget);
		}

		scrollEl.addEventListener(
			"wheel",
			(event) => {
				if (!isChartNavigationTarget(event.target)) return;

				const absX = Math.abs(event.deltaX);
				const absY = Math.abs(event.deltaY);

				if (event.ctrlKey || event.metaKey) {
					if (absY <= absX) return;
					event.preventDefault();
					cancelWheelPan();
					const scale = wheelZoomScaleFactor(event.deltaY);
					if (scale === 1) return;
					const anchor = pointerAnchorFraction(event, scrollEl);
					const next = zoomRangeAtAnchor(
						liveRangeStart,
						liveRangeEnd,
						anchor,
						scale,
					);
					commitRange(next.start, next.end);
					return;
				}

				const panDelta = wheelPanDelta(event);
				if (panDelta === null) return;

				event.preventDefault();
				if (!wheelPanStartRange) {
					wheelPanStartRange = {
						start: liveRangeStart,
						end: liveRangeEnd,
					};
				}
				wheelPanPixelTotal += panDelta;
				previewWheelPan();
				scheduleWheelPanCommit();
			},
			{ passive: false },
		);

		if (Platform.isMobile && chart) {
			attachPinchZoom({
				surface: chart,
				scrollEl,
				getRange: () => ({ start: liveRangeStart, end: liveRangeEnd }),
				onPreview: previewPanRange,
				onCommit: commitRange,
				onPinchStart: cancelWheelPan,
			});
		}
	}
}

function touchSpan(touches: TouchList): number {
	if (touches.length < 2) return 0;
	const dx = touches[0].clientX - touches[1].clientX;
	const dy = touches[0].clientY - touches[1].clientY;
	return Math.hypot(dx, dy);
}

function touchMidpointX(touches: TouchList, area: DOMRect): number {
	if (touches.length < 2) return area.width / 2;
	const midX = (touches[0].clientX + touches[1].clientX) / 2;
	return Math.max(0, Math.min(area.width, midX - area.left));
}

interface PinchZoomOptions {
	surface: HTMLElement;
	scrollEl: HTMLElement;
	getRange: () => { start: Date; end: Date };
	onPreview: (start: Date, end: Date) => void;
	onCommit: (start: Date, end: Date) => void;
	onPinchStart?: () => void;
}

function attachPinchZoom(options: PinchZoomOptions): void {
	const { surface, scrollEl, getRange, onPreview, onCommit, onPinchStart } = options;

	let pinchStartDistance = 0;
	let pinchStartRange: { start: Date; end: Date } | null = null;
	let pinchAnchor = 0.5;

	surface.addEventListener(
		"touchstart",
		(event) => {
			if (event.touches.length !== 2) return;
			event.stopPropagation();
			onPinchStart?.();
			const area =
				queryChart(scrollEl)?.querySelector<HTMLElement>(
					".nui-timeline-body",
				) ?? queryChart(scrollEl);
			const rect = area?.getBoundingClientRect();
			pinchStartDistance = touchSpan(event.touches);
			pinchStartRange = getRange();
			pinchAnchor =
				rect && rect.width > 0
					? touchMidpointX(event.touches, rect) / rect.width
					: 0.5;
		},
		{ passive: true, capture: true },
	);

	surface.addEventListener(
		"touchmove",
		(event) => {
			if (!pinchStartRange || event.touches.length !== 2 || pinchStartDistance <= 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			const distance = touchSpan(event.touches);
			if (distance <= 0) return;
			const scale = pinchStartDistance / distance;
			if (scale === 1) return;
			const next = zoomRangeAtAnchor(
				pinchStartRange.start,
				pinchStartRange.end,
				pinchAnchor,
				scale,
			);
			onPreview(next.start, next.end);
		},
		{ passive: false, capture: true },
	);

	const endPinch = () => {
		if (!pinchStartRange) return;
		const current = getRange();
		if (
			current.start.getTime() !== pinchStartRange.start.getTime() ||
			current.end.getTime() !== pinchStartRange.end.getTime()
		) {
			onCommit(current.start, current.end);
		}
		pinchStartRange = null;
		pinchStartDistance = 0;
	};

	surface.addEventListener("touchend", endPinch, { passive: true });
	surface.addEventListener("touchcancel", endPinch, { passive: true });
}

export interface ScrubControlOptions {
	scrubId: string;
	labelClassName: string;
	labelText: string;
	title: string;
}

export function createScrubControl(options: ScrubControlOptions): HTMLElement {
	const control = document.createElement("div");
	control.className = "nui-timeline-scrub";

	const label = document.createElement("span");
	label.className = options.labelClassName;
	label.dataset.scrub = options.scrubId;
	label.textContent = options.labelText;
	label.title = options.title;

	control.appendChild(label);
	return control;
}

