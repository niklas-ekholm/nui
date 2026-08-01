import { App, MarkdownView } from "obsidian";

/** The view's own elements, never one belonging to an embedded note. */
export function isOwnElement(view: MarkdownView, el: Element): boolean {
	return view.containerEl.contains(el) && !el.closest(".internal-embed");
}

export function mainMetadataContainer(view: MarkdownView): HTMLElement | null {
	return (
		Array.from(
			view.containerEl.querySelectorAll<HTMLElement>(".metadata-container"),
		).find((el) => isOwnElement(view, el)) ?? null
	);
}

/** Live-preview and reading-view content wrappers. */
export function contentSizers(view: MarkdownView): HTMLElement[] {
	return Array.from(
		view.containerEl.querySelectorAll<HTMLElement>(
			".cm-sizer, .markdown-preview-sizer",
		),
	).filter((el) => isOwnElement(view, el));
}

/** Strict Source mode shows frontmatter as plain text — no properties widget. */
export function isRawSourceView(view: MarkdownView): boolean {
	const state = view.getState() as { mode?: string; source?: boolean };
	return state.mode === "source" && state.source === true;
}

export function findViewForElement(
	app: App,
	element: Element,
): MarkdownView | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (
			leaf.view instanceof MarkdownView &&
			leaf.view.containerEl.contains(element)
		) {
			return leaf.view;
		}
	}
	return null;
}

export function readPropertyKey(propertyEl: HTMLElement): string | null {
	const input = propertyEl.querySelector<HTMLInputElement>(
		":scope > .metadata-property-key .metadata-property-key-input",
	);
	const key = input?.value.trim();
	return key || null;
}

/** Top-level property rows rendered by Obsidian, not our nested tree. */
export function topLevelPropertyRows(container: HTMLElement): HTMLElement[] {
	return Array.from(
		container.querySelectorAll<HTMLElement>(
			":scope .metadata-properties > .metadata-property",
		),
	).filter((el) => !el.closest(".nui-nested-container"));
}
