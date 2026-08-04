
import {
	parseIsoDate,
	centerRangeOnDate,
	rangeMidpoint,
	addDays,
	startOfWeekMonday,
} from "../core/parse/dates";

export type TimelineTimespan = "1w" | "3w" | "1m" | "3m" | "6m" | "1y";

export type TimelineLayoutMode = "full" | "full-tasks" | "compact";

export const TIMELINE_COMPACT_HEIGHT_PX = 600;

export const DEFAULT_TIMELINE_TIMESPAN: TimelineTimespan = "3w";

export const TIMELINE_TIMESPAN_OPTIONS: ReadonlyArray<{
	value: TimelineTimespan;
	label: string;
}> = [
	{ value: "1w", label: "1 week" },
	{ value: "3w", label: "3 weeks" },
	{ value: "1m", label: "1 month" },
	{ value: "3m", label: "3 months" },
	{ value: "6m", label: "6 months" },
	{ value: "1y", label: "1 year" },
];

export const TIMELINE_TRACK_HEIGHT = 18;
export const TIMELINE_LABEL_WIDTH = 0;

export const MIN_TIMELINE_ROW_SIZE = 1;
export const MAX_TIMELINE_ROW_SIZE = 10;
export const DEFAULT_TIMELINE_ROW_SIZE = 1;
export const TIMELINE_ROW_SIZE_LABELS = ["XL", "L", "M", "S", "XS"] as const;
export type TimelineRowSizeLabel = (typeof TIMELINE_ROW_SIZE_LABELS)[number];

/** Discrete row sizes — endpoints match min/max; three steps between. */
export const TIMELINE_ROW_SIZE_PRESETS: readonly number[] = [
	MAX_TIMELINE_ROW_SIZE,
	Math.round(MIN_TIMELINE_ROW_SIZE + (MAX_TIMELINE_ROW_SIZE - MIN_TIMELINE_ROW_SIZE) * 0.75),
	Math.round(MIN_TIMELINE_ROW_SIZE + (MAX_TIMELINE_ROW_SIZE - MIN_TIMELINE_ROW_SIZE) * 0.5),
	Math.round(MIN_TIMELINE_ROW_SIZE + (MAX_TIMELINE_ROW_SIZE - MIN_TIMELINE_ROW_SIZE) * 0.25),
	MIN_TIMELINE_ROW_SIZE,
];

export const TIMELINE_ROW_GAP_UNIT_PX = 16;

/** Space between rows at Size 1. */
export const TIMELINE_ROW_GAP_MIN_PX = 4;
/** Space between rows at Size 10 — lower = tighter rows at max size. */
export const TIMELINE_ROW_GAP_MAX_PX = 24;

/** Bar title at Size 1 — compact UI scale. */
export const TIMELINE_TITLE_SIZE_MIN_EM = 0.75;
export const TIMELINE_TITLE_WEIGHT_MIN = 500;

/** Bar title at Size 10 (XL) — matches theme h1 (`--nui-h1`, 2rem). */
export const TIMELINE_TITLE_SIZE_MAX_EM = 2;
export const TIMELINE_TITLE_WEIGHT_MAX = 200;

/** Matches `--nui-leading-timeline-bar-title` / `--nui-leading-h6`. */
export const TIMELINE_TITLE_LINE_HEIGHT = 1.2;

const TIMELINE_ROOT_EM_PX = 16;

function rowSizeProgress(size: number): number {
	const s = clampTimelineRowSize(size);
	return (s - MIN_TIMELINE_ROW_SIZE) / (MAX_TIMELINE_ROW_SIZE - MIN_TIMELINE_ROW_SIZE);
}

export function timelineTitleFontSizeRem(size: number): number {
	const t = rowSizeProgress(size);
	return (
		TIMELINE_TITLE_SIZE_MIN_EM +
		t * (TIMELINE_TITLE_SIZE_MAX_EM - TIMELINE_TITLE_SIZE_MIN_EM)
	);
}

/** @deprecated Use timelineTitleFontSizeRem — kept as alias for call sites. */
export function timelineTitleFontSizeEm(size: number): number {
	return timelineTitleFontSizeRem(size);
}

export function timelineTitleFontWeight(size: number): number {
	const t = rowSizeProgress(size);
	return Math.round(
		TIMELINE_TITLE_WEIGHT_MIN +
			t * (TIMELINE_TITLE_WEIGHT_MAX - TIMELINE_TITLE_WEIGHT_MIN),
	);
}

export function timelineTitleLineHeightPx(size: number): number {
	if (clampTimelineRowSize(size) === MAX_TIMELINE_ROW_SIZE) {
		return Math.ceil(
			TIMELINE_TITLE_SIZE_MAX_EM * TIMELINE_ROOT_EM_PX * 1.1,
		);
	}
	const fontSizePx = timelineTitleFontSizeRem(size) * TIMELINE_ROOT_EM_PX;
	return Math.ceil(fontSizePx * TIMELINE_TITLE_LINE_HEIGHT);
}

/** Row box height — fits the title line and matches tracker row sizing at minimum. */
export function timelineRowHeightPx(size: number): number {
	return Math.max(TIMELINE_TRACK_HEIGHT, timelineTitleLineHeightPx(size));
}

export function applyTimelineRowSizeStyles(element: HTMLElement, size: number): void {
	const rowSize = clampTimelineRowSize(size);
	element.style.setProperty("--nui-row-gap", `${rowGapPxFromSize(rowSize)}px`);
	element.style.setProperty(
		"--nui-row-height",
		`${timelineRowHeightPx(rowSize)}px`,
	);
	if (rowSize === MAX_TIMELINE_ROW_SIZE) {
		element.style.setProperty("--nui-bar-title-size", "var(--nui-h1, 2rem)");
		element.style.setProperty(
			"--nui-bar-title-weight",
			"var(--nui-weight-h1, 200)",
		);
		element.style.setProperty(
			"--nui-bar-title-line-height",
			"var(--nui-leading-h1, 1.1)",
		);
	} else {
		element.style.setProperty(
			"--nui-bar-title-size",
			`${timelineTitleFontSizeRem(rowSize)}rem`,
		);
		element.style.setProperty(
			"--nui-bar-title-weight",
			String(timelineTitleFontWeight(rowSize)),
		);
		element.style.removeProperty("--nui-bar-title-line-height");
	}
	element.style.setProperty("--nui-title-band-height", "0px");
	element.style.setProperty(
		"--nui-event-seam-anchor",
		`${TIMELINE_TRACK_HEIGHT / 2}px`,
	);
}

export function formatTimelineTimespanShort(timespan: TimelineTimespan): string {
	return timespan.toUpperCase();
}

export function mergeTimelineTimespan(value: unknown): TimelineTimespan {
	if (
		typeof value === "string" &&
		TIMELINE_TIMESPAN_OPTIONS.some((option) => option.value === value)
	) {
		return value as TimelineTimespan;
	}
	return DEFAULT_TIMELINE_TIMESPAN;
}

export function timespanDays(timespan: TimelineTimespan): number {
	switch (timespan) {
		case "1w":
			return 7;
		case "3w":
			return 21;
		case "1m":
			return 30;
		case "3m":
			return 90;
		case "6m":
			return 182;
		case "1y":
			return 365;
	}
}

export function rangeForTimespan(
	center: Date,
	timespan: TimelineTimespan,
): TimelineRange {
	return centerRangeOnDate(center, timespanDays(timespan));
}

/** Default visible range: current week first, spanning the given timespan. */
export function defaultTimelineRange(
	timespan: TimelineTimespan = DEFAULT_TIMELINE_TIMESPAN,
	today: Date = new Date(),
): TimelineRange {
	const start = startOfWeekMonday(today);
	return {
		start,
		end: addDays(start, timespanDays(timespan)),
	};
}

export function applyTimespanToRange(
	start: Date,
	end: Date,
	timespan: TimelineTimespan,
): TimelineRange {
	return rangeForTimespan(rangeMidpoint(start, end), timespan);
}

export function clampTimelineRowSize(size: number): number {
	const n = Math.round(size);
	return Math.min(MAX_TIMELINE_ROW_SIZE, Math.max(MIN_TIMELINE_ROW_SIZE, n));
}

export function clampTimelineRowSizePresetIndex(index: number): number {
	const n = Math.round(index);
	return Math.min(
		TIMELINE_ROW_SIZE_PRESETS.length - 1,
		Math.max(0, n),
	);
}

export function snapTimelineRowSize(size: number): number {
	const clamped = clampTimelineRowSize(size);
	let nearest = TIMELINE_ROW_SIZE_PRESETS[0];
	let nearestDistance = Math.abs(clamped - nearest);

	for (const preset of TIMELINE_ROW_SIZE_PRESETS) {
		const distance = Math.abs(clamped - preset);
		if (distance < nearestDistance) {
			nearest = preset;
			nearestDistance = distance;
		}
	}

	return nearest;
}

export function rowSizePresetIndex(size: number): number {
	const snapped = snapTimelineRowSize(size);
	const index = TIMELINE_ROW_SIZE_PRESETS.indexOf(snapped);
	return index >= 0 ? index : 0;
}

export function rowSizeFromPresetIndex(index: number): number {
	return TIMELINE_ROW_SIZE_PRESETS[clampTimelineRowSizePresetIndex(index)];
}

export function rowGapPxFromSize(size: number): number {
	const t = rowSizeProgress(size);
	return Math.round(
		TIMELINE_ROW_GAP_MIN_PX +
			t * (TIMELINE_ROW_GAP_MAX_PX - TIMELINE_ROW_GAP_MIN_PX),
	);
}

export function sizeFromRowGapPx(gapPx: number): number {
	const minGap = rowGapPxFromSize(MIN_TIMELINE_ROW_SIZE);
	const maxGap = rowGapPxFromSize(MAX_TIMELINE_ROW_SIZE);
	if (gapPx <= minGap) return MIN_TIMELINE_ROW_SIZE;
	if (gapPx >= maxGap) return MAX_TIMELINE_ROW_SIZE;

	const t = (gapPx - minGap) / (maxGap - minGap);
	return clampTimelineRowSize(
		Math.round(
			MIN_TIMELINE_ROW_SIZE +
				t * (MAX_TIMELINE_ROW_SIZE - MIN_TIMELINE_ROW_SIZE),
		),
	);
}

export function formatTimelineRowSize(size: number): string {
	return TIMELINE_ROW_SIZE_LABELS[rowSizePresetIndex(size)] ?? "XS";
}

export function mergeTimelineRowSize(
	value: unknown,
	legacyRowGap?: unknown,
	legacyRowHeight?: unknown,
): number {
	if (typeof value === "number") {
		return snapTimelineRowSize(value);
	}

	if (typeof legacyRowGap === "number") {
		return snapTimelineRowSize(sizeFromRowGapPx(legacyRowGap));
	}

	if (typeof legacyRowHeight === "number") {
		return snapTimelineRowSize(sizeFromRowGapPx(legacyRowHeight - TIMELINE_TRACK_HEIGHT));
	}

	return DEFAULT_TIMELINE_ROW_SIZE;
}

export interface TimelineRange {
	start: Date;
	end: Date;
}

export function parseTimelineRange(
	start: unknown,
	end: unknown,
): TimelineRange | undefined {
	if (typeof start !== "string" || typeof end !== "string") return undefined;

	const parsedStart = parseIsoDate(start);
	const parsedEnd = parseIsoDate(end);
	if (!parsedStart || !parsedEnd || parsedStart.getTime() > parsedEnd.getTime()) {
		return undefined;
	}

	return { start: parsedStart, end: parsedEnd };
}

export function parseTimelineLayoutMode(value: unknown): TimelineLayoutMode {
	if (value === "compact") return "compact";
	if (value === "full-tasks") return "full-tasks";
	return "full";
}

export function timelineLayoutClass(layoutMode: TimelineLayoutMode): string {
	switch (layoutMode) {
		case "compact":
			return "nui-timeline--compact";
		case "full-tasks":
			return "nui-timeline--full-tasks";
		default:
			return "nui-timeline--full";
	}
}

export function isTimelineFullHeightLayout(
	layoutMode: TimelineLayoutMode,
): boolean {
	return layoutMode === "full" || layoutMode === "full-tasks";
}

