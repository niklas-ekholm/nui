import type { TimelineRowElements } from "./timeline-row-dom";
import { getTimelineRowElements } from "./timeline-row-dom";

const EVENT_FRAME_CLASS = "nui-timeline-event";

/** Seam half-gap for selection borders — always from chart `--nui-row-gap`, not row margin. */
export function timelineSeamExtendPx(row: HTMLElement): number {
	const chart = row.closest<HTMLElement>(".nui-timeline-chart");
	const source = chart ?? row;
	const raw = getComputedStyle(source).getPropertyValue("--nui-row-gap").trim();
	const rowGap = parseFloat(raw);
	return Number.isFinite(rowGap) ? rowGap / 2 : 0;
}

export function ensureTimelineEventFrame(track: HTMLElement): HTMLElement {
	let eventEl = track.querySelector<HTMLElement>(`.${EVENT_FRAME_CLASS}`);
	if (!eventEl) {
		eventEl = document.createElement("div");
		eventEl.className = EVENT_FRAME_CLASS;
		track.prepend(eventEl);
	}
	return eventEl;
}

export function syncTimelineEventFrame(elements: TimelineRowElements): void {
	const { row, track, bar, startDateEl, endDateEl, titleEl } = elements;
	const eventEl = ensureTimelineEventFrame(track);
	const trackRect = track.getBoundingClientRect();

	const parts: HTMLElement[] = [bar, startDateEl, endDateEl];
	if (titleEl) parts.push(titleEl);

	let left = Infinity;
	let right = -Infinity;

	for (const el of parts) {
		const rect = el.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) continue;
		left = Math.min(left, rect.left);
		right = Math.max(right, rect.right);
	}

	if (!Number.isFinite(left)) return;

	const seamExtend = timelineSeamExtendPx(row);

	eventEl.style.left = `${left - trackRect.left}px`;
	eventEl.style.width = `${right - left}px`;
	eventEl.style.top = `${-seamExtend}px`;
	eventEl.style.height = `${trackRect.height + seamExtend * 2}px`;
}

export function syncAllTimelineEventFrames(body: HTMLElement): void {
	for (const row of Array.from(
		body.querySelectorAll<HTMLElement>(".nui-timeline-row[data-item-id]"),
	)) {
		const elements = getTimelineRowElements(row);
		if (elements) syncTimelineEventFrame(elements);
	}
}
