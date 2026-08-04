import { EditorView } from "@codemirror/view";
import { MarkdownView, type Plugin } from "obsidian";

/** Wiki / Bases / media embeds in Live Preview — not tables or fenced code. */
const EMBED_ROOT_SELECTOR =
	".internal-embed, .bases-embed, .block-language-base.bases-embed, .cm-embed-block";

const EMBED_ROOT_EXCLUDE =
	".cm-table-widget, .cm-preview-code-block, .HyperMD-codeblock";

/**
 * Controls that should keep their own click behaviour. The embed root itself
 * may carry `.interactive-child` (Bases); that is not treated as clickable.
 */
const CLICKABLE_INSIDE_EMBED = [
	"a",
	"button",
	"input",
	"textarea",
	"select",
	"label",
	"summary",
	"option",
	"[contenteditable='true']",
	"[role='button']",
	"[role='link']",
	"[role='checkbox']",
	"[role='menuitem']",
	"[role='tab']",
	"[role='option']",
	"[role='switch']",
	".clickable-icon",
	".nui-cards-item-clickable",
	".nui-cards-title",
	".nui-cards-title-text-link",
	".nui-cards-title-symbol-link",
	".nui-week-tracker-3-add",
	".nui-navigation-add",
	".nui-folders-add",
	".edit-block-button",
	".cm-edit-block-button",
	".embed-actions",
	".nui-timeline-event",
	".nui-timeline-bar",
	".nui-timeline-handle",
	".nui-timeline-scrub",
	".nui-timeline-timespan-select",
	".nui-timeline-today-btn",
	".nui-timeline-range-restore",
	".nui-timeline-search",
	".nui-bases-toolbar-item",
	".bases-toolbar-item",
	".bases-header",
].join(", ");

function findEmbedRoot(target: Element): HTMLElement | null {
	const root = target.closest<HTMLElement>(EMBED_ROOT_SELECTOR);
	if (!root) return null;
	if (root.matches(EMBED_ROOT_EXCLUDE)) return null;
	if (
		root.matches(".cm-embed-block") &&
		!root.matches(".internal-embed, .bases-embed") &&
		!root.querySelector(
			".internal-embed, .bases-embed, .image-embed, .media-embed",
		)
	) {
		return null;
	}
	return root;
}

function isAlreadyClickable(target: Element, embedRoot: HTMLElement): boolean {
	let el: Element | null = target;
	while (el && el !== embedRoot) {
		if (el instanceof HTMLElement && el.matches(CLICKABLE_INSIDE_EMBED)) {
			return true;
		}
		el = el.parentElement;
	}
	return false;
}

function editorViewForEmbed(
	plugin: Plugin,
	embedRoot: HTMLElement,
): EditorView | null {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		if (!view.containerEl.contains(embedRoot)) continue;
		const cm = (view.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm) return cm;
	}
	return null;
}

function placeCursorAtEmbedLineEnd(
	view: EditorView,
	embedRoot: HTMLElement,
): boolean {
	try {
		const pos = view.posAtDOM(embedRoot);
		const line = view.state.doc.lineAt(pos);
		const end = line.to;
		view.dispatch({
			selection: { anchor: end, head: end },
			scrollIntoView: true,
		});
		view.focus();
		return true;
	} catch {
		return false;
	}
}

function onEmbedPointerDown(plugin: Plugin, event: PointerEvent): void {
	if (event.button !== 0) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

	const target = event.target;
	if (!(target instanceof Element)) return;

	const sourceView = target.closest(
		".markdown-source-view.mod-cm6.is-live-preview",
	);
	if (!sourceView) return;

	const embedRoot = findEmbedRoot(target);
	if (!embedRoot) return;
	if (!sourceView.contains(embedRoot)) return;

	if (isAlreadyClickable(target, embedRoot)) return;

	const cm = editorViewForEmbed(plugin, embedRoot);
	if (!cm) return;

	if (!placeCursorAtEmbedLineEnd(cm, embedRoot)) return;

	event.preventDefault();
	event.stopPropagation();
}

/** Click empty embed chrome → caret at the end of the `![[…]]` source line. */
export function registerEmbedSourceClick(plugin: Plugin): void {
	const handler = (event: PointerEvent) => onEmbedPointerDown(plugin, event);
	plugin.registerDomEvent(document, "pointerdown", handler, {
		capture: true,
	});
}
