import { parseEmbedLinkText } from "./parse-embed-pipes.ts";

/** Parse `![[Some.base|Niklas]]` lines from host note source. */
export function parseResponsibilityForBaseEmbed(
	source: string,
	basePath: string,
	resolveLink: (link: string) => string | null,
): string | null {
	for (const match of source.matchAll(/!\[\[([^\]]+)\]\]/g)) {
		const inner = match[1];
		if (!inner.includes("|")) continue;

		const pipeIndex = inner.indexOf("|");
		const linkPart = inner.slice(0, pipeIndex).trim();
		if (resolveLink(linkPart) !== basePath) continue;

		const parsed = parseEmbedLinkText(inner);
		if (parsed.responsibility) return parsed.responsibility;
	}

	return null;
}
