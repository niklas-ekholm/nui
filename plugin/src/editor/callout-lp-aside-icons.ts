import type { EditorView } from "@codemirror/view";
import { applyCalloutTypeChange } from "./callout-lp-apply-type";
import { createCalloutIconElement, createQuoteIconElement } from "./callout-lp-icons";
import { showCalloutTypeMenu } from "./callout-lp-type-menu";
import {
	calloutIconLineClass,
	isCalloutContinuationLine,
	isQuoteLine,
	parseCalloutType,
} from "./callout-lp-parse";

const ASIDE_ICON_WIDGET_CLASS = "nui-lp-aside-icon-widget";
export const ASIDE_ICON_LAYER_CLASS = "nui-lp-aside-icon-layer";

export type AsideIconSpec =
	| { kind: "callout"; lineFrom: number; type: string }
	| { kind: "quote"; lineFrom: number };

export function collectAsideIconSpecs(view: EditorView): AsideIconSpec[] {
	const specs: AsideIconSpec[] = [];
	const doc = view.state.doc;
	let inCalloutBody = false;
	let inBlockquoteBody = false;

	for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
		const line = doc.line(lineNo);
		const headerType = parseCalloutType(line.text);

		if (headerType) {
			inCalloutBody = true;
			inBlockquoteBody = false;
			specs.push({ kind: "callout", lineFrom: line.from, type: headerType });
			continue;
		}

		if (inCalloutBody && isCalloutContinuationLine(line.text)) {
			continue;
		}

		inCalloutBody = false;

		if (!isQuoteLine(line.text)) {
			inBlockquoteBody = false;
			continue;
		}

		if (!inBlockquoteBody) {
			inBlockquoteBody = true;
			specs.push({ kind: "quote", lineFrom: line.from });
			continue;
		}
	}

	return specs;
}

function createCalloutAsideIconEl(
	spec: Extract<AsideIconSpec, { kind: "callout" }>,
	view: EditorView,
): HTMLElement {
	const el = document.createElement("span");
	el.className = `${ASIDE_ICON_WIDGET_CLASS} nui-lp-callout-icon-widget ${calloutIconLineClass(spec.type)}`;
	el.setAttribute("role", "button");
	el.setAttribute("aria-label", "Change callout type");
	el.tabIndex = -1;
	el.addEventListener("mousedown", (event) => {
		event.preventDefault();
		event.stopPropagation();
	});
	el.addEventListener("click", (event) => {
		showCalloutTypeMenu(event, {
			currentType: spec.type,
			onPick: (newType) => {
				applyCalloutTypeChange(view, spec.lineFrom, newType);
			},
		});
	});
	el.appendChild(createCalloutIconElement(spec.type));
	return el;
}

function createQuoteAsideIconEl(): HTMLElement {
	const el = document.createElement("span");
	el.className = `${ASIDE_ICON_WIDGET_CLASS} nui-lp-quote-icon-widget`;
	el.setAttribute("aria-hidden", "true");
	el.appendChild(createQuoteIconElement());
	return el;
}

const ASIDE_LINE_INDENT_VAR = "--nui-lp-aside-text-indent";

/** Obsidian sets inline quote nesting indent on LP lines; override for aside blocks. */
export function syncAsideLineIndent(view: EditorView): void {
	const lines = view.dom.querySelectorAll<HTMLElement>(
		".cm-line.HyperMD-callout, .cm-line.nui-lp-callout-continuation, .cm-line.nui-lp-quote-header, .cm-line.nui-lp-quote-continuation",
	);

	for (const line of Array.from(lines)) {
		line.style.setProperty(
			"padding-inline-start",
			`var(${ASIDE_LINE_INDENT_VAR})`,
			"important",
		);
		line.style.setProperty("text-indent", "0", "important");
	}
}

export function layoutAsideIconLayer(
	view: EditorView,
	layer: HTMLElement,
	specs: AsideIconSpec[],
): void {
	layer.replaceChildren();
	syncAsideLineIndent(view);

	for (const spec of specs) {
		const block = view.lineBlockAt(spec.lineFrom);
		const icon =
			spec.kind === "callout"
				? createCalloutAsideIconEl(spec, view)
				: createQuoteAsideIconEl();

		icon.style.top = `${block.top}px`;
		icon.style.left = "0";
		layer.appendChild(icon);
	}
}
