import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import {
	ASIDE_ICON_LAYER_CLASS,
	collectAsideIconSpecs,
	layoutAsideIconLayer,
	syncAsideLineIndent,
} from "./callout-lp-aside-icons";
import {
	QUOTE_BODY_LINE_CLASS,
	QUOTE_HEADER_LINE_CLASS,
	calloutContinuationLineClass,
	calloutIconLineClass,
	isCalloutContinuationLine,
	isQuoteLine,
	parseCalloutType,
} from "./callout-lp-parse";

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

/** Line classes for callout + blockquote aside blocks (icons live in overlay layer). */
export function buildAsideLineDecorations(view: EditorView): DecorationSet {
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
			continue;
		}

		addLineClass(builder, line.from, QUOTE_BODY_LINE_CLASS);
	}

	return builder.finish();
}

function findAsideIconLayerHost(view: EditorView): HTMLElement | null {
	return (
		view.dom.querySelector(".cm-contentContainer") ??
		view.dom.querySelector(".cm-sizer")
	);
}

export const calloutLpIconExtension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet = Decoration.none;
		private livePreview = false;
		private readonly sourceViewEl: Element | null;
		private readonly modeObserver: MutationObserver | null;
		private layer: HTMLElement | null = null;
		private layerHost: HTMLElement | null = null;
		private layoutScheduled = false;

		constructor(view: EditorView) {
			this.sourceViewEl = view.dom.closest(".markdown-source-view");
			this.livePreview = isLivePreview(view);
			this.ensureLayer(view);
			this.sync(view);

			if (this.sourceViewEl !== null) {
				this.modeObserver = new MutationObserver(() => {
					const livePreview = isLivePreview(view);
					if (livePreview === this.livePreview) {
						return;
					}
					this.livePreview = livePreview;
					this.sync(view);
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
				this.destroyLayer();
				this.decorations = Decoration.none;
				return;
			}

			if (livePreviewChanged) {
				this.ensureLayer(update.view);
			} else if (this.layer === null) {
				this.ensureLayer(update.view);
			}

			if (
				livePreviewChanged ||
				update.docChanged ||
				update.viewportChanged ||
				update.geometryChanged
			) {
				this.syncDecorations(update.view);
				this.scheduleIconLayout(update.view);
			}
		}

		destroy() {
			this.modeObserver?.disconnect();
			this.destroyLayer();
		}

		private ensureLayer(view: EditorView) {
			if (!isLivePreview(view)) {
				this.destroyLayer();
				return;
			}

			const host = findAsideIconLayerHost(view);
			if (host === null) {
				return;
			}

			if (
				this.layer !== null &&
				this.layer.isConnected &&
				this.layerHost === host
			) {
				return;
			}

			this.destroyLayer();
			const layer = document.createElement("div");
			layer.className = ASIDE_ICON_LAYER_CLASS;
			layer.setAttribute("contenteditable", "false");
			host.appendChild(layer);
			this.layer = layer;
			this.layerHost = host;
		}

		private destroyLayer() {
			this.layer?.remove();
			this.layer = null;
			this.layerHost = null;
		}

		private syncDecorations(view: EditorView) {
			if (!isLivePreview(view)) {
				this.decorations = Decoration.none;
				this.layer?.replaceChildren();
				return;
			}

			this.decorations = buildAsideLineDecorations(view);
			syncAsideLineIndent(view);
		}

		private scheduleIconLayout(view: EditorView) {
			if (!isLivePreview(view)) {
				return;
			}

			if (this.layer === null || !this.layer.isConnected) {
				this.ensureLayer(view);
			}

			if (this.layer === null) {
				return;
			}

			if (this.layoutScheduled) {
				return;
			}

			this.layoutScheduled = true;
			view.requestMeasure({
				key: this,
				read: (measureView) => collectAsideIconSpecs(measureView),
				write: (specs, measureView) => {
					this.layoutScheduled = false;
					if (this.layer === null || !isLivePreview(measureView)) {
						return;
					}
					layoutAsideIconLayer(measureView, this.layer, specs);
				},
			});
		}

		private sync(view: EditorView) {
			this.ensureLayer(view);
			this.syncDecorations(view);
			this.scheduleIconLayout(view);
		}
	},
	{
		decorations: (plugin: { decorations: DecorationSet }) => plugin.decorations,
	},
);
