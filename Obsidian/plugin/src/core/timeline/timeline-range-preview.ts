
import { daysBetween, formatDisplayDate, parseIsoDate, startOfDay } from "../parse/dates";
import { applyBarGeometry } from "./bar-geometry";
import { syncTimelineAxis } from "./timeline-axis";

function computeTodayOffset(
	rangeStart: Date,
	totalDays: number,
): number | null {
	const todayStart = startOfDay(new Date());
	const todayOffsetDays = daysBetween(rangeStart, todayStart);
	if (todayOffsetDays < 0 || todayOffsetDays > totalDays) return null;
	return (todayOffsetDays / totalDays) * 100;
}

function syncTodayLine(body: HTMLElement, todayOffset: number | null): void {
	let todayLine = body.querySelector<HTMLElement>(".nui-timeline-today");

	if (todayOffset === null) {
		todayLine?.remove();
		return;
	}

	if (!todayLine) {
		todayLine = document.createElement("div");
		todayLine.className = "nui-timeline-today";
		todayLine.title = "Today";
		const grid = body.querySelector(".nui-timeline-grid");
		if (grid) {
			grid.insertAdjacentElement("afterend", todayLine);
		} else {
			body.prepend(todayLine);
		}
	}

	todayLine.style.left = `${todayOffset}%`;
}

function syncHeaderRangeLabels(
	container: HTMLElement,
	rangeStart: Date,
	rangeEnd: Date,
): void {
	const startLabel = container.querySelector<HTMLElement>(
		'[data-scrub="range-start"]',
	);
	const endLabel = container.querySelector<HTMLElement>('[data-scrub="range-end"]');
	const rangeLabel = container.querySelector<HTMLElement>(".nui-timeline-range");

	if (startLabel) startLabel.textContent = formatDisplayDate(rangeStart);
	if (endLabel) endLabel.textContent = formatDisplayDate(rangeEnd);
	if (rangeLabel) {
		rangeLabel.textContent = `${formatDisplayDate(rangeStart)}–${formatDisplayDate(rangeEnd)}`;
	}
}

function syncTodayButton(container: HTMLElement, rangeStart: Date): void {
	const todayBtn = container.querySelector<HTMLElement>(".nui-timeline-today-btn");
	const startsAtToday =
		startOfDay(rangeStart).getTime() === startOfDay(new Date()).getTime();
	todayBtn?.classList.toggle("is-visible", !startsAtToday);
}

function syncRowBars(
	body: HTMLElement,
	rangeStart: Date,
	totalDays: number,
): void {
	for (const row of Array.from(
		body.querySelectorAll<HTMLElement>(".nui-timeline-row[data-item-id]"),
	)) {
		const start = parseIsoDate(row.dataset.start ?? "");
		const end = parseIsoDate(row.dataset.end ?? "");
		if (!start || !end) continue;

		const bar = row.querySelector<HTMLElement>(".nui-timeline-bar");
		const titleEl = row.querySelector<HTMLElement>(".nui-timeline-bar-title");
		const startDateEl = row.querySelector<HTMLElement>(
			".nui-timeline-date-start",
		);
		const endDateEl = row.querySelector<HTMLElement>(".nui-timeline-date-end");
		if (!bar || !startDateEl || !endDateEl) continue;

		applyBarGeometry(
			{ bar, startDateEl, endDateEl, titleEl: titleEl ?? undefined },
			rangeStart,
			totalDays,
			start,
			end,
		);
	}
}

export function updateTimelineRangePreview(
	container: HTMLElement,
	rangeStart: Date,
	rangeEnd: Date,
): void {
	const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd));
	const todayOffset = computeTodayOffset(rangeStart, totalDays);

	syncTimelineAxis(container, rangeStart, rangeEnd);

	const body = container.querySelector<HTMLElement>(".nui-timeline-body");

	if (body) {
		syncTodayLine(body, todayOffset);
		syncRowBars(body, rangeStart, totalDays);
	}

	syncHeaderRangeLabels(container, rangeStart, rangeEnd);
	syncTodayButton(container, rangeStart);
}

