import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { applyCalloutTypeChange } from "./callout-lp-apply-type";
import { createCalloutIconElement, createQuoteIconElement } from "./callout-lp-icons";
import { showCalloutTypeMenu } from "./callout-lp-type-menu";
import {
	QUOTE_BODY_LINE_CLASS,
	QUOTE_HEADER_LINE_CLASS,
	calloutContinuationLineClass,
	calloutIconLineClass,
	isCalloutContinuationLine,
	isQuoteLine,
	parseCalloutType,
} from "./callout-lp-parse";

const ASIDE_ICON_WIDGET_CLASS = "nui-lp-aside-icon-widget";

class CalloutIconWidget extends WidgetType {
	constructor(
		readonly type: string,
		readonly lineFrom: number,
		readonly view: EditorView,
	) {
		super();
	}

	eq(other: CalloutIconWidget): boolean {
		return (
			other.type === this.type &&
			other.lineFrom === this.lineFrom &&
			other.view === this.view
		);
	}

	toDOM(): HTMLElement {
		const el = document.createElement("span");
		el.className = `${ASIDE_ICON_WIDGET_CLASS} nui-lp-callout-icon-widget ${calloutIconLineClass(this.type)}`;
		el.setAttribute("role", "button");
		el.setAttribute("aria-label", "Change callout type");
		el.tabIndex = -1;
		el.addEventListener("mousedown", (event) => {
			event.preventDefault();
			event.stopPropagation();
		});
		el.addEventListener("click", (event) => {
			showCalloutTypeMenu(event, {
				currentType: this.type,
				onPick: (newType) => {
					applyCalloutTypeChange(this.view, this.lineFrom, newType);
				},
			});
		});
		el.appendChild(createCalloutIconElement(this.type));
		return el;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

class QuoteIconWidget extends WidgetType {
	eq(other: QuoteIconWidget): boolean {
		return other instanceof QuoteIconWidget;
	}

	toDOM(): HTMLElement {
		const el = document.createElement("span");
		el.className = `${ASIDE_ICON_WIDGET_CLASS} nui-lp-quote-icon-widget`;
		el.setAttribute("aria-hidden", "true");
		el.appendChild(createQuoteIconElement());
		return el;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

function isLivePreview(view: EditorView): boolean {
	return (
		view.dom
			.closest(".markdown-source-view")
			?.classList.contains("is-live-preview") ?? false
	);
}

function addLineClass(
	builder: RangeSetBuilder<Decoration>,
	lineFrom: number,
	className: string,
): void {
	builder.add(
		lineFrom,
		lineFrom,
		Decoration.line({
			class: className,
		}),
	);
}

function addIconWidget(
	builder: RangeSetBuilder<Decoration>,
	lineFrom: number,
	widget: WidgetType,
): void {
	builder.add(
		lineFrom,
		lineFrom,
		Decoration.widget({
			widget,
			side: -1,
			block: false,
		}),
	);
}

/** Icon on header rows; line classes for callout + blockquote aside blocks. */
export function buildCalloutIconDecorations(view: EditorView): DecorationSet {
	if (!isLivePreview(view)) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const doc = view.state.doc;
	let inCalloutBody = false;
	let inBlockquoteBody = false;
	let activeCalloutType: string | null = null;

	for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
		const line = doc.line(lineNo);
		const headerType = parseCalloutType(line.text);

		if (headerType) {
			inCalloutBody = true;
			inBlockquoteBody = false;
			activeCalloutType = headerType;

			addLineClass(builder, line.from, calloutIconLineClass(headerType));
			addIconWidget(
				builder,
				line.from,
				new CalloutIconWidget(headerType, line.from, view),
			);
			continue;
		}

		if (inCalloutBody && isCalloutContinuationLine(line.text)) {
			if (activeCalloutType !== null) {
				addLineClass(
					builder,
					line.from,
					calloutContinuationLineClass(activeCalloutType),
				);
			}
			continue;
		}

		inCalloutBody = false;
		activeCalloutType = null;

		if (!isQuoteLine(line.text)) {
			inBlockquoteBody = false;
			continue;
		}

		if (!inBlockquoteBody) {
			inBlockquoteBody = true;
			addLineClass(builder, line.from, QUOTE_HEADER_LINE_CLASS);
			addIconWidget(builder, line.from, new QuoteIconWidget());
			continue;
		}

		addLineClass(builder, line.from, QUOTE_BODY_LINE_CLASS);
	}

	return builder.finish();
}

export const calloutLpIconExtension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet = Decoration.none;
		private livePreview = false;
		private readonly sourceViewEl: Element | null;
		private readonly modeObserver: MutationObserver | null;

		constructor(view: EditorView) {
			this.sourceViewEl = view.dom.closest(".markdown-source-view");
			this.livePreview = isLivePreview(view);
			this.decorations = buildCalloutIconDecorations(view);

			if (this.sourceViewEl !== null) {
				this.modeObserver = new MutationObserver(() => {
					const livePreview = isLivePreview(view);
					if (livePreview === this.livePreview) {
						return;
					}
					this.livePreview = livePreview;
					this.decorations = buildCalloutIconDecorations(view);
					view.requestMeasure();
				});

				this.modeObserver.observe(this.sourceViewEl, {
					attributes: true,
					attributeFilter: ["class"],
				});
			}
		}

		update(update: ViewUpdate) {
			const livePreview = isLivePreview(update.view);
			const livePreviewChanged = livePreview !== this.livePreview;
			this.livePreview = livePreview;

			if (!livePreview) {
				this.decorations = Decoration.none;
				return;
			}

			if (
				livePreviewChanged ||
				update.docChanged ||
				update.viewportChanged
			) {
				this.decorations = buildCalloutIconDecorations(update.view);
			}
		}

		destroy() {
			this.modeObserver?.disconnect();
		}
	},
	{
		decorations: (plugin: { decorations: DecorationSet }) => plugin.decorations,
	},
);
