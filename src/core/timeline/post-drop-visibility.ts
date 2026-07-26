import { formatIsoDate } from "../parse/dates";
import type { TimelineItem } from "../models/timeline-item";

interface TimelineDrop {
	itemId: string;
	start: Date;
	end: Date;
}

interface PendingDrop {
	start: string;
	end: string;
}

const pendingDrops = new WeakMap<HTMLElement, Map<string, PendingDrop>>();

export function trackTimelineDrops(
	container: HTMLElement,
	dropsToTrack: Iterable<TimelineDrop>,
): void {
	const drops = pendingDrops.get(container) ?? new Map<string, PendingDrop>();

	for (const drop of dropsToTrack) {
		drops.set(drop.itemId, {
			start: formatIsoDate(drop.start),
			end: formatIsoDate(drop.end),
		});
	}

	pendingDrops.set(container, drops);
}

export function shouldDeferTimelineDropRender(
	container: HTMLElement,
	items: TimelineItem[],
): boolean {
	const drops = pendingDrops.get(container);
	if (!drops) return false;

	for (const [itemId, drop] of drops) {
		const item = items.find((candidate) => candidate.id === itemId);
		if (
			!item ||
			formatIsoDate(item.start) !== drop.start ||
			formatIsoDate(item.end) !== drop.end
		) {
			return true;
		}
	}

	pendingDrops.delete(container);
	return false;
}
