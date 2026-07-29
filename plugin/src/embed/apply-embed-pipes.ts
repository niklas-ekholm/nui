import type { ParsedEmbedPipes } from "./parse-embed-pipes";

export interface ApplyEmbedPipesOptions {
	/** Timeline embeds are wide by default unless `|narrow` is set. */
	defaultWide?: boolean;
}

export function shouldEmbedBeWide(
	parsed: ParsedEmbedPipes,
	defaultWide = false,
): boolean {
	if (parsed.narrow) return false;
	return !!(parsed.wide || defaultWide);
}

export function applyParsedEmbedPipes(
	el: HTMLElement,
	parsed: ParsedEmbedPipes,
	options: ApplyEmbedPipesOptions = {},
): void {
	const wide = shouldEmbedBeWide(parsed, options.defaultWide);

	if (wide) {
		el.setAttribute("data-nui-embed-wide", "");
	} else {
		el.removeAttribute("data-nui-embed-wide");
	}

	el.removeAttribute("data-nui-embed-width");
	el.style.removeProperty("--nui-embed-width");

	if (parsed.timelineCompact) {
		el.setAttribute("data-nui-embed-compact", "");
	} else {
		el.removeAttribute("data-nui-embed-compact");
	}

	if (parsed.timelineLayout) {
		el.setAttribute("data-nui-embed-timeline-layout", parsed.timelineLayout);
	} else {
		el.removeAttribute("data-nui-embed-timeline-layout");
	}

	if (parsed.responsibility) {
		el.setAttribute("data-nui-embed-responsibility", parsed.responsibility);
	} else {
		el.removeAttribute("data-nui-embed-responsibility");
	}

	const img = el.matches("img")
		? el
		: el.querySelector<HTMLImageElement>("img");
	if (!img) return;

	if (wide) {
		img.style.width = "100%";
		img.style.maxWidth = "100%";
	} else if (parsed.widthPx) {
		img.style.width = `${parsed.widthPx}px`;
		img.style.maxWidth = `${parsed.widthPx}px`;
	} else if (parsed.imageWidthPx) {
		img.style.width = `${parsed.imageWidthPx}px`;
		if (parsed.imageHeightPx) {
			img.style.height = `${parsed.imageHeightPx}px`;
		}
	}
}
