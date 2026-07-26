
import { TimelineItem } from "../models/timeline-item";

export function filterTimelineItems(
	items: TimelineItem[],
	query: string,
): TimelineItem[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return items;

	return items.filter((item) => {
		const projectLabel = item.projectLabel;
		return (
			item.title.toLowerCase().includes(needle) ||
			item.id.toLowerCase().includes(needle) ||
			(projectLabel?.toLowerCase().includes(needle) ?? false)
		);
	});
}

