import { EditorView } from "@codemirror/view";
import { MarkdownView, type Plugin } from "obsidian";
import { isPointInEditorMargin } from "./embed-source-margin";

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
	".nui-navigation-files-add",
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
	".nui-week-tracker-3-today-btn",
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

/** Timeline embeds: only the topbar title slot and its outer padding may select source. */
function shouldAllowTimelineEmbedSourceClick(
	target: Element,
	embedRoot: HTMLElement,
): boolean {
	const timelineRoot = target.closest(
		".nui-timeline-bases-container, .nui-timeline",
	);
	if (!timelineRoot || !embedRoot.contains(timelineRoot)) {
		return true;
	}

	const topbar = target.closest(".nui-timeline-topbar");
	if (!topbar || !embedRoot.contains(topbar)) {
		return false;
	}

	// Controls row (search, range, Today, …) — not embed-source targets.
	if (target.closest(".nui-timeline-header")) {
		return false;
	}

	return true;
}

const NOTE_HEADER_SELECTOR = ".mod-header, .metadata-container, .inline-title";

function editorViewForSourceView(
	plugin: Plugin,
	sourceView: Element,
): EditorView | null {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		if (!view.containerEl.contains(sourceView)) continue;
		const cm = (view.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm) return cm;
	}
	return null;
}

function activeLivePreviewEditorView(plugin: Plugin): EditorView | null {
	const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!activeView) return null;
	const sourceView = activeView.containerEl.querySelector(
		".markdown-source-view.mod-cm6.is-live-preview",
	);
	if (!sourceView) return null;
	const cm = (activeView.editor as { cm?: EditorView } | undefined)?.cm;
	return cm ?? null;
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

function cmLineAtPos(view: EditorView, pos: number): HTMLElement | null {
	try {
		const dom = view.domAtPos(pos);
		let node: Node | null = dom.node;
		if (node.nodeType === Node.TEXT_NODE) {
			node = node.parentElement;
		}
		return node instanceof HTMLElement ? node.closest(".cm-line") : null;
	} catch {
		return null;
	}
}

function isEmbedSourceCmLine(cmLine: HTMLElement): boolean {
	if (!cmLine.querySelector(".cm-formatting-embed, .cm-hmd-embed")) {
		return false;
	}
	const next = cmLine.nextElementSibling;
	return (
		next instanceof HTMLElement &&
		next.matches(".cm-embed-block, .internal-embed")
	);
}

function isCursorOnEmbedSourceLine(view: EditorView): boolean {
	const { head } = view.state.selection.main;
	const cmLine = cmLineAtPos(view, head);
	return cmLine ? isEmbedSourceCmLine(cmLine) : false;
}

function isClickInEditorMargin(
	event: PointerEvent,
	sourceView: Element,
): boolean {
	const scroller = sourceView.querySelector<HTMLElement>(".cm-scroller");
	const sizer = scroller?.querySelector<HTMLElement>(":scope > .cm-sizer");
	const content = sizer?.querySelector<HTMLElement>(".cm-content");
	if (!scroller || !sizer || !content) return false;

	const target = event.target;
	if (!(target instanceof Node) || !scroller.contains(target)) return false;
	if (target instanceof Element && target.closest(NOTE_HEADER_SELECTOR)) {
		return false;
	}

	return isPointInEditorMargin(event.clientX, event.clientY, {
		sizer: sizer.getBoundingClientRect(),
		content: content.getBoundingClientRect(),
	});
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
			// Keep the viewport on the embed — scrolling to the source line jumps
			// timeline sticky chrome and pan position (especially the topbar).
			scrollIntoView: false,
		});
		view.contentDOM.focus({ preventScroll: true });
		return true;
	} catch {
		return false;
	}
}

function dismissEmbedSourceLine(view: EditorView): boolean {
	const { head } = view.state.selection.main;
	const cmLine = cmLineAtPos(view, head);
	if (!cmLine || !isEmbedSourceCmLine(cmLine)) return false;

	const embedEl = cmLine.nextElementSibling;
	if (!(embedEl instanceof HTMLElement)) {
		view.contentDOM.blur();
		return true;
	}

	try {
		const embedPos = view.posAtDOM(embedEl);
		const embedLine = view.state.doc.lineAt(embedPos);
		const doc = view.state.doc;
		let pos: number;
		if (embedLine.number < doc.lines) {
			pos = doc.line(embedLine.number + 1).from;
		} else if (embedLine.number > 1) {
			pos = doc.line(embedLine.number - 1).to;
		} else {
			view.contentDOM.blur();
			return true;
		}
		view.dispatch({
			selection: { anchor: pos, head: pos },
			scrollIntoView: false,
		});
		view.contentDOM.focus({ preventScroll: true });
		return true;
	} catch {
		view.contentDOM.blur();
		return true;
	}
}

function onMarginPointerDown(plugin: Plugin, event: PointerEvent): void {
	if (event.button !== 0) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

	const target = event.target;
	if (!(target instanceof Element)) return;

	const sourceView = target.closest(
		".markdown-source-view.mod-cm6.is-live-preview",
	);
	if (!sourceView) return;

	if (!isClickInEditorMargin(event, sourceView)) return;

	const cm = editorViewForSourceView(plugin, sourceView);
	if (!cm || !isCursorOnEmbedSourceLine(cm)) return;

	if (!dismissEmbedSourceLine(cm)) return;

	event.preventDefault();
	event.stopPropagation();
}

function isEscapeFromEmbedControl(event: KeyboardEvent): boolean {
	const target = event.target;
	if (!(target instanceof Element)) return false;
	if (target.closest(".cm-content")) return false;
	return Boolean(
		target.closest(
			"input, textarea, select, [contenteditable='true'], [role='textbox']",
		),
	);
}

function onEscapeKeyDown(plugin: Plugin, event: KeyboardEvent): void {
	if (event.key !== "Escape") return;
	if (event.metaKey || event.ctrlKey || event.altKey) return;
	if (isEscapeFromEmbedControl(event)) return;

	const cm = activeLivePreviewEditorView(plugin);
	if (!cm?.hasFocus || !isCursorOnEmbedSourceLine(cm)) return;

	if (!dismissEmbedSourceLine(cm)) return;

	event.preventDefault();
	event.stopPropagation();
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

	if (!shouldAllowTimelineEmbedSourceClick(target, embedRoot)) return;

	if (isAlreadyClickable(target, embedRoot)) return;

	const cm = editorViewForEmbed(plugin, embedRoot);
	if (!cm) return;

	if (!placeCursorAtEmbedLineEnd(cm, embedRoot)) return;

	event.preventDefault();
	event.stopPropagation();
}

/**
 * Embed source in Live Preview:
 * - click empty embed chrome → caret at the end of the `![[…]]` source line
 * - click editor margin (outside `.cm-content`) or Escape while on that line → restore embed
 */
export function registerEmbedSourceClick(plugin: Plugin): void {
	plugin.registerDomEvent(
		document,
		"pointerdown",
		(event: PointerEvent) => onEmbedPointerDown(plugin, event),
		{ capture: true },
	);
	plugin.registerDomEvent(
		document,
		"pointerdown",
		(event: PointerEvent) => onMarginPointerDown(plugin, event),
		{ capture: true },
	);
	plugin.registerDomEvent(
		document,
		"keydown",
		(event: KeyboardEvent) => onEscapeKeyDown(plugin, event),
		{ capture: true },
	);
}
