
import { addDays } from "../parse/dates";

export function trackWidthPx(track: HTMLElement): number {
	return track.getBoundingClientRect().width;
}

export function trackElementForTimelinePoint(
	scrollEl: HTMLElement,
	clientX: number,
	clientY: number,
): HTMLElement | null {
	const body = scrollEl.querySelector<HTMLElement>(".nui-timeline-body");
	if (!body) return null;

	for (const row of Array.from(
		body.querySelectorAll<HTMLElement>(".nui-timeline-row"),
	)) {
		const rect = row.getBoundingClientRect();
		if (clientY >= rect.top && clientY <= rect.bottom) {
			const track = row.querySelector(".nui-timeline-track");
			if (track instanceof HTMLElement) return track;
		}
	}

	const track = body.querySelector(".nui-timeline-track");
	if (track instanceof HTMLElement) return track;

	const chart = scrollEl.querySelector(".nui-timeline-chart");
	const axis =
		chart instanceof HTMLElement
			? chart.querySelector(".nui-timeline-axis")
			: null;
	if (axis instanceof HTMLElement) return axis;

	return body;
}

/** Which bar edge is being mapped — end uses the day before the track boundary. */
export type TrackDateEdge = "start" | "end";

export function dateFromTrackX(
	track: HTMLElement,
	clientX: number,
	rangeStart: Date,
	totalDays: number,
	edge: TrackDateEdge = "start",
): Date {
	const rect = track.getBoundingClientRect();
	const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
	let dayOffset = Math.round(fraction * totalDays);
	if (edge === "end") {
		dayOffset = Math.max(0, dayOffset - 1);
	}
	return addDays(rangeStart, dayOffset);
}

export function dayDeltaFromPixelDelta(
	pixelDelta: number,
	trackWidth: number,
	totalDays: number,
): number {
	const width = Math.max(trackWidth, 1);
	return Math.round((pixelDelta / width) * totalDays);
}

export interface ClientRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export function normalizeRect(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): ClientRect {
	return {
		left: Math.min(x1, x2),
		top: Math.min(y1, y2),
		right: Math.max(x1, x2),
		bottom: Math.max(y1, y2),
	};
}

export function rectsIntersect(a: ClientRect, b: ClientRect): boolean {
	return (
		a.left < b.right &&
		a.right > b.left &&
		a.top < b.bottom &&
		a.bottom > b.top
	);
}

