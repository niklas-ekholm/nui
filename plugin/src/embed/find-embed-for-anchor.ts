const BASE_EMBED_SELECTOR =
	".internal-embed.bases-embed, .block-language-base.bases-embed";

const BASE_VIEW_SELECTOR =
	".bases-view, [data-type='bases'], .nui-timeline-bases-container, .nui-task-list-bases-root";

export function baseEmbedElementsInScope(scope: ParentNode): HTMLElement[] {
	return Array.from(scope.querySelectorAll<HTMLElement>(BASE_EMBED_SELECTOR)).filter(
		(el) =>
			el.classList.contains("bases-embed") ||
			!!el.querySelector(BASE_VIEW_SELECTOR),
	);
}

/** Outermost-to-innermost base embed wrapper that contains `anchorEl`. */
export function findBaseEmbedWrapperForAnchor(
	anchorEl: HTMLElement,
	scope: ParentNode,
): HTMLElement | null {
	const embedEls = baseEmbedElementsInScope(scope);
	for (let index = embedEls.length - 1; index >= 0; index--) {
		if (embedEls[index].contains(anchorEl)) {
			return embedEls[index];
		}
	}
	return null;
}
