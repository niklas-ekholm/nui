export interface TaskTextSegment {
	type: "text" | "wikilink";
	content: string;
	target?: string;
	alias?: string;
}

const WIKILINK_PATTERN = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export function parseTaskTextSegments(text: string): TaskTextSegment[] {
	const segments: TaskTextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(WIKILINK_PATTERN)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			segments.push({
				type: "text",
				content: text.slice(lastIndex, index),
			});
		}

		segments.push({
			type: "wikilink",
			content: match[2] ?? match[1],
			target: match[1],
			alias: match[2],
		});

		lastIndex = index + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({
			type: "text",
			content: text.slice(lastIndex),
		});
	}

	if (segments.length === 0) {
		segments.push({ type: "text", content: text });
	}

	return segments;
}
