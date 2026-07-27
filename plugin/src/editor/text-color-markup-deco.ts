import {
	Decoration,
	MatchDecorator,
	ViewPlugin,
	type DecorationSet,
	type EditorView,
	type ViewUpdate,
} from "@codemirror/view";

const htmlMarkupMatcher = new MatchDecorator({
	regexp: /<span style="color:\s*#[0-9a-fA-F]{6}">|<\/span>/g,
	decoration: Decoration.mark({
		class: "nui-text-color-markup",
	}),
});

function isLivePreview(view: EditorView): boolean {
	return (
		view.dom
			.closest(".markdown-source-view")
			?.classList.contains("is-live-preview") ?? false
	);
}

export const textColorMarkupExtension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet = Decoration.none;
		private livePreview = false;
		private readonly sourceViewEl: Element | null;
		private readonly modeObserver: MutationObserver | null;

		constructor(view: EditorView) {
			this.sourceViewEl = view.dom.closest(".markdown-source-view");
			this.livePreview = isLivePreview(view);
			this.decorations = this.buildDecorations(view);

			if (this.sourceViewEl !== null) {
				this.modeObserver = new MutationObserver(() => {
					const livePreview = isLivePreview(view);
					if (livePreview === this.livePreview) {
						return;
					}
					this.livePreview = livePreview;
					this.decorations = this.buildDecorations(view);
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

			if (livePreview) {
				this.decorations = Decoration.none;
				return;
			}

			if (livePreviewChanged) {
				this.decorations = htmlMarkupMatcher.createDeco(update.view);
				return;
			}

			this.decorations = htmlMarkupMatcher.updateDeco(
				update,
				this.decorations,
			);
		}

		destroy() {
			this.modeObserver?.disconnect();
		}

		private buildDecorations(view: EditorView): DecorationSet {
			if (isLivePreview(view)) {
				return Decoration.none;
			}
			return htmlMarkupMatcher.createDeco(view);
		}
	},
	{
		decorations: (plugin: { decorations: DecorationSet }) => plugin.decorations,
	},
);
