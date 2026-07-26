export interface ParsedEmbedPipes {
	wide?: boolean;
	narrow?: boolean;
	widthPx?: number;
	timelineCompact?: boolean;
	timelineLayout?: "compact" | "full" | "full-tasks";
	imageWidthPx?: number;
	imageHeightPx?: number;
	rawTokens: string[];
}

const DIMENSION_TOKEN = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/;
const PX_TOKEN = /^(\d+(?:\.\d+)?)$/;

export function parseEmbedPipeTokens(tokens: string[]): ParsedEmbedPipes {
	const result: ParsedEmbedPipes = { rawTokens: [...tokens] };

	for (const raw of tokens) {
		const token = raw.trim();
		if (!token) continue;

		if (token === "wide") {
			result.wide = true;
			continue;
		}

		if (token === "narrow") {
			result.narrow = true;
			continue;
		}

		if (token === "compact") {
			result.timelineCompact = true;
			result.timelineLayout = "compact";
			continue;
		}

		if (token === "full-tasks") {
			result.timelineLayout = "full-tasks";
			continue;
		}

		const dimension = token.match(DIMENSION_TOKEN);
		if (dimension) {
			result.imageWidthPx = Number(dimension[1]);
			result.imageHeightPx = Number(dimension[2]);
			continue;
		}

		const px = token.match(PX_TOKEN);
		if (px) {
			result.widthPx = Number(px[1]);
		}
	}

	return result;
}

/** Parse pipe modifiers from a wikilink inner string or full embed original. */
export function parseEmbedLinkText(linkText: string): ParsedEmbedPipes {
	const inner = extractWikiInner(linkText);
	if (!inner) return { rawTokens: [] };

	const pipeIndex = inner.indexOf("|");
	if (pipeIndex === -1) return { rawTokens: [] };

	const tokens = inner
		.slice(pipeIndex + 1)
		.split("|")
		.map((part) => part.trim())
		.filter(Boolean);

	return parseEmbedPipeTokens(tokens);
}

function extractWikiInner(linkText: string): string | null {
	const trimmed = linkText.trim();
	const wrapped = trimmed.match(/^!\[\[([^\]]+)\]\]$/);
	if (wrapped) return wrapped[1];

	const bare = trimmed.match(/^\[\[([^\]]+)\]\]$/);
	if (bare) return bare[1];

	return trimmed.includes("|") ? trimmed : null;
}
