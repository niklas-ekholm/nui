/** Strip view/alias fragments from an embed link stored on a DOM node. */
export function readEmbedLinkFromDom(embedRoot: HTMLElement): string | null {
	for (const attr of ["src", "data-src", "alt"]) {
		const value = embedRoot.getAttribute(attr)?.trim();
		if (!value) continue;
		return value.split("#")[0]?.split("|")[0]?.trim() ?? null;
	}
	return null;
}

/** Read the full embed target including pipe tokens when present on the DOM. */
export function readEmbedOriginalFromDom(embedRoot: HTMLElement): string | null {
	for (const attr of ["alt", "src", "data-src"]) {
		const value = embedRoot.getAttribute(attr)?.trim();
		if (value?.includes("|")) return value;
	}
	return null;
}
