import type { TimelineItem } from "../models/timeline-item";

export function filterTimelineItemsByResponsibility(
	items: TimelineItem[],
	responsibility: string,
): TimelineItem[] {
	const needle = responsibility.trim();
	if (!needle) return items;

	return items.filter((item) => item.responsibility?.trim() === needle);
}
