
import { readEndDate, readStartDate } from "../parse/dates";
import { parseFrontmatter } from "../parse/frontmatter";
import { TimelineDocumentInput, TimelineItem } from "../models/timeline-item";

function titleFromPath(path: string): string {
	const name = path.split("/").pop() ?? path;
	return name.replace(/\.md$/i, "");
}

function readStringField(
	frontmatter: Record<string, unknown>,
	key: string,
): string | undefined {
	const value = frontmatter[key];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function documentToTimelineItem(
	input: TimelineDocumentInput,
): TimelineItem | null {
	try {
		const { frontmatter } = parseFrontmatter(input.content);
		const start = readStartDate(frontmatter);
		if (!start) return null;

		const end = readEndDate(frontmatter);
		if (!end) return null;

		const safeEnd = end.getTime() < start.getTime() ? start : end;

		return {
			id: input.path,
			title: readStringField(frontmatter, "title") ?? titleFromPath(input.path),
			start,
			end: safeEnd,
			type: readStringField(frontmatter, "type"),
			project: readStringField(frontmatter, "project"),
		};
	} catch {
		return null;
	}
}

export function queryTimelineItems(
	documents: TimelineDocumentInput[],
): TimelineItem[] {
	return documents
		.map(documentToTimelineItem)
		.filter((item): item is TimelineItem => item !== null)
		.sort((a, b) => a.start.getTime() - b.start.getTime());
}

