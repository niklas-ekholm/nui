
import { daysBetween } from "../parse/dates";
import { timelineEdgeInsetDays } from "./timeline-layout-coords";
import {
	buildDayGridTicks,
	buildGridTicks,
	buildMonthTicks,
	buildTimelineTicks,
	buildWeekdayTicks,
	shouldShowDayGridLines,
	shouldShowMondayDateLabels,
	shouldShowWeekdayLabels,
	TIMELINE_MAIN_AXIS_HEIGHT,
	TIMELINE_MONDAY_DATE_SUBLABEL_HEIGHT,
	TIMELINE_WEEKDAY_AXIS_HEIGHT,
	TimelineTick,
} from "./timeline-scale";
import { remapTimelineTickPercentsForLayoutInset } from "./timeline-today-offset";

export const TIMELINE_DATE_GUTTER_PX = 34;
export {
	TIMELINE_DATE_EDGE_INSET_PX,
	TIMELINE_DATE_MARKER_SIZE_PX,
} from "./timeline-layout-coords";

function remapTicksForLayoutInset(
	ticks: TimelineTick[],
	totalDays: number,
	edgeInsetDays: number,
): TimelineTick[] {
	if (edgeInsetDays <= 0) return ticks;
	return ticks.map((tick) => ({
		...tick,
		offsetPercent: remapTimelineTickPercentsForLayoutInset(
			tick.offsetPercent,
			totalDays,
			edgeInsetDays,
		),
	}));
}

function timelineScrollPadPx(timeline: HTMLElement | null): number {
	if (!timeline) return TIMELINE_DATE_GUTTER_PX;
	const gutter = parseFloat(
		getComputedStyle(timeline).getPropertyValue("--nui-date-gutter"),
	);
	return Number.isFinite(gutter) && gutter > 0 ? gutter : TIMELINE_DATE_GUTTER_PX;
}

export function timelineChartWidthPx(container: HTMLElement): number {
	const body = container.querySelector<HTMLElement>(".nui-timeline-body");
	const width = body?.getBoundingClientRect().width ?? 0;
	if (width > 0) return width;

	const scroll = container.querySelector<HTMLElement>(".nui-timeline-scroll");
	const timeline = container.querySelector<HTMLElement>(".nui-timeline");
	if (!scroll) return 0;
	const pad = timelineScrollPadPx(timeline);
	return Math.max(0, scroll.clientWidth - pad * 2);
}

function createMainAxisTickElement(tick: TimelineTick): HTMLElement {
	const tickEl = document.createElement("div");
	tickEl.className = "nui-timeline-tick";
	tickEl.style.left = `${tick.offsetPercent}%`;

	const label = document.createElement("span");
	label.className = "nui-timeline-tick-label";
	label.textContent = tick.label;
	tickEl.appendChild(label);

	if (tick.subLabel) {
		tickEl.classList.add("has-sublabel");
		const subLabel = document.createElement("span");
		subLabel.className = "nui-timeline-tick-sublabel";
		subLabel.textContent = tick.subLabel;
		tickEl.appendChild(subLabel);
	}

	return tickEl;
}

function rebuildAxisTicks(axis: HTMLElement, ticks: TimelineTick[]): void {
	axis.replaceChildren();
	for (const tick of ticks) {
		axis.appendChild(createMainAxisTickElement(tick));
	}
}

function createOverlayTickElement(
	className: string,
	labelClassName: string,
	tick: TimelineTick,
): HTMLElement {
	const tickEl = document.createElement("div");
	tickEl.className = className;
	tickEl.style.left = `${tick.offsetPercent}%`;

	const label = document.createElement("span");
	label.className = labelClassName;
	label.textContent = tick.label;
	tickEl.appendChild(label);

	return tickEl;
}

function rebuildMonthAxis(monthAxis: HTMLElement, ticks: TimelineTick[]): void {
	monthAxis.replaceChildren();
	for (const tick of ticks) {
		monthAxis.appendChild(
			createOverlayTickElement(
				"nui-timeline-month-tick",
				"nui-timeline-month-tick-label",
				tick,
			),
		);
	}
}

function rebuildWeekdayAxis(weekdayAxis: HTMLElement, ticks: TimelineTick[]): void {
	weekdayAxis.replaceChildren();
	for (const tick of ticks) {
		const tickEl = document.createElement("div");
		tickEl.className = "nui-timeline-weekday-tick";
		tickEl.style.left = `${tick.offsetPercent}%`;

		const letterEl = document.createElement("span");
		letterEl.className = "nui-timeline-weekday-tick-label";
		letterEl.textContent = tick.label;
		tickEl.appendChild(letterEl);

		if (tick.subLabel) {
			const dayEl = document.createElement("span");
			dayEl.className = "nui-timeline-weekday-tick-day";
			dayEl.textContent = tick.subLabel;
			tickEl.appendChild(dayEl);
		}

		weekdayAxis.appendChild(tickEl);
	}
}

function rebuildGridLines(
	grid: HTMLElement,
	dayTicks: TimelineTick[],
	weekTicks: TimelineTick[],
	monthTicks: TimelineTick[],
): void {
	grid.replaceChildren();

	for (const tick of dayTicks) {
		const line = document.createElement("div");
		line.className =
			"nui-timeline-grid-line nui-timeline-grid-line-day";
		line.style.left = `${tick.offsetPercent}%`;
		grid.appendChild(line);
	}

	for (const tick of weekTicks) {
		const line = document.createElement("div");
		line.className =
			"nui-timeline-grid-line nui-timeline-grid-line-week";
		line.style.left = `${tick.offsetPercent}%`;
		grid.appendChild(line);
	}

	for (const tick of monthTicks) {
		const line = document.createElement("div");
		line.className =
			"nui-timeline-grid-line nui-timeline-grid-line-month";
		line.style.left = `${tick.offsetPercent}%`;
		grid.appendChild(line);
	}
}

function setAxisHeights(
	root: HTMLElement,
	showWeekdays: boolean,
	showMondayDates: boolean,
): void {
	const mondayExtra =
		showMondayDates && !showWeekdays ? TIMELINE_MONDAY_DATE_SUBLABEL_HEIGHT : 0;
	const weekdayHeight = showWeekdays ? TIMELINE_WEEKDAY_AXIS_HEIGHT : 0;
	const mainHeight = TIMELINE_MAIN_AXIS_HEIGHT + mondayExtra;
	const totalHeight = mainHeight + weekdayHeight;

	root.style.setProperty("--nui-main-axis-height", `${mainHeight}px`);
	root.style.setProperty("--nui-month-axis-height", "0px");
	root.style.setProperty("--nui-weekday-axis-height", `${weekdayHeight}px`);
	root.style.setProperty("--nui-axis-height", `${totalHeight}px`);
}

function timelineAxisHeightRoot(container: HTMLElement): HTMLElement {
	if (container.classList.contains("nui-timeline")) {
		return container;
	}
	return (
		container.querySelector<HTMLElement>(".nui-timeline") ?? container
	);
}

export function syncTimelineAxis(
	container: HTMLElement,
	rangeStart: Date,
	rangeEnd: Date,
): TimelineTick[] {
	const chart = container.querySelector<HTMLElement>(".nui-timeline-chart");
	const axisRow = container.querySelector<HTMLElement>(".nui-timeline-axis-row");
	const monthAxis = container.querySelector<HTMLElement>(".nui-timeline-month-axis");
	const weekdayAxis = container.querySelector<HTMLElement>(
		".nui-timeline-weekday-axis",
	);
	const axis = container.querySelector<HTMLElement>(".nui-timeline-axis");
	const grid = container.querySelector<HTMLElement>(".nui-timeline-grid");

	const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd));
	const chartWidth = timelineChartWidthPx(container);
	const edgeInsetDays = timelineEdgeInsetDays(totalDays, chartWidth);
	const showWeekdays = shouldShowWeekdayLabels(totalDays, chartWidth);
	const showMondayDates = shouldShowMondayDateLabels(totalDays, chartWidth);
	const ticks = remapTicksForLayoutInset(
		buildTimelineTicks(rangeStart, rangeEnd, totalDays, {
			showMondayDates,
		}),
		totalDays,
		edgeInsetDays,
	);
	const monthTicks = remapTicksForLayoutInset(
		buildMonthTicks(rangeStart, totalDays),
		totalDays,
		edgeInsetDays,
	);
	const weekdayTicks = showWeekdays
		? remapTicksForLayoutInset(
				buildWeekdayTicks(rangeStart, totalDays, chartWidth),
				totalDays,
				edgeInsetDays,
			)
		: [];
	const gridTicks = remapTicksForLayoutInset(
		buildGridTicks(rangeStart, totalDays),
		totalDays,
		edgeInsetDays,
	);
	const dayGridTicks = shouldShowDayGridLines(totalDays, chartWidth)
		? remapTicksForLayoutInset(
				buildDayGridTicks(rangeStart, totalDays),
				totalDays,
				edgeInsetDays,
			)
		: [];
	const monthGridTicks = remapTicksForLayoutInset(
		buildMonthTicks(rangeStart, totalDays),
		totalDays,
		edgeInsetDays,
	);

	if (chart) {
		setAxisHeights(timelineAxisHeightRoot(container), showWeekdays, showMondayDates);
	}
	axisRow?.classList.add("has-months");
	axisRow?.classList.toggle("has-weekdays", showWeekdays);
	axisRow?.classList.toggle("has-monday-dates", showMondayDates);
	if (monthAxis) rebuildMonthAxis(monthAxis, monthTicks);
	if (weekdayAxis) rebuildWeekdayAxis(weekdayAxis, weekdayTicks);
	if (axis) rebuildAxisTicks(axis, ticks);
	if (grid) rebuildGridLines(grid, dayGridTicks, gridTicks, monthGridTicks);

	return ticks;
}

