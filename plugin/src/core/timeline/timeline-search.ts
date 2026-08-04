
import { TimelineItem } from "../models/timeline-item";

export function filterTimelineItems(
	items: TimelineItem[],
	query: string,
): TimelineItem[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return items;

	return items.filter((item) => {
		const responsibility = item.responsibility;
		return (
			item.title.toLowerCase().includes(needle) ||
			item.id.toLowerCase().includes(needle) ||
			(responsibility?.toLowerCase().includes(needle) ?? false)
		);
	});
}

