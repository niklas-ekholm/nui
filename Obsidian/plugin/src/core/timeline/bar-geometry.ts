
import { daysBetween } from "../parse/dates";

export interface BarGeometryElements {
	bar: HTMLElement;
	startDateEl: HTMLElement;
	endDateEl: HTMLElement;
	titleEl?: HTMLElement;
}

function applyTitleGeometry(
	titleEl: HTMLElement,
	leftPercent: number,
): void {
	titleEl.style.setProperty("--title-bar-left", `${leftPercent}%`);
}

export function applyBarGeometry(
	elements: BarGeometryElements,
	rangeStart: Date,
	totalDays: number,
	start: Date,
	end: Date,
): void {
	const startOffset = daysBetween(rangeStart, start);
	const span = Math.max(1, daysBetween(start, end) + 1);
	const leftPercent = (startOffset / totalDays) * 100;
	const widthPercent = (span / totalDays) * 100;

	elements.bar.style.left = `${leftPercent}%`;
	elements.bar.style.width = `${widthPercent}%`;
	elements.startDateEl.style.left = `${leftPercent}%`;
	elements.endDateEl.style.left = `${leftPercent + widthPercent}%`;

	if (elements.titleEl) {
		applyTitleGeometry(elements.titleEl, leftPercent);
	}
}

