import { Prec, RangeSetBuilder, StateEffect, type Extension } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from "@codemirror/view";
import type { App } from "obsidian";

export const nuiHtmlLpRefreshEffect = StateEffect.define<null>();

const HIDDEN_TAG_RE =
	/<span style="color:\s*#[0-9a-fA-F]{6}">|<\/span>/g;

const COLOR_SPAN_RE =
	/<span style="color:\s*(#[0-9a-fA-F]{6})">([\s\S]*?)<\/span>/g;

function isLivePreview(view: EditorView): boolean {
	return (
		view.dom
			.closest(".markdown-source-view")
			?.classList.contains("is-live-preview") ?? false
	);
}

function rangesOverlap(
	aFrom: number,
	aTo: number,
	bFrom: number,
	bTo: number,
): boolean {
	return aFrom < bTo && bFrom < aTo;
}

type PendingDecoration =
	| { kind: "tag-mark"; from: number; to: number }
	| { kind: "mark"; from: number; to: number; color: string };

function buildDecorations(
	view: EditorView,
	enabled: boolean,
): DecorationSet {
	try {
		if (!enabled || !isLivePreview(view)) {
			return Decoration.none;
		}

		const doc = view.state.doc.toString();
		const pending: PendingDecoration[] = [];
		const marked: Array<{ from: number; to: number }> = [];

		const queueTagMark = (from: number, to: number): void => {
			if (from >= to) {
				return;
			}

			for (const range of marked) {
				if (rangesOverlap(from, to, range.from, range.to)) {
					return;
				}
			}

			pending.push({ kind: "tag-mark", from, to });
			marked.push({ from, to });
		};

		for (const { from, to } of view.visibleRanges) {
			const slice = doc.slice(from, to);

			HIDDEN_TAG_RE.lastIndex = 0;
			let tagMatch: RegExpExecArray | null;
			while ((tagMatch = HIDDEN_TAG_RE.exec(slice)) !== null) {
				queueTagMark(
					from + tagMatch.index,
					from + tagMatch.index + tagMatch[0].length,
				);
			}

			COLOR_SPAN_RE.lastIndex = 0;
			let colorMatch: RegExpExecArray | null;
			while ((colorMatch = COLOR_SPAN_RE.exec(slice)) !== null) {
				const openTag = colorMatch[0].slice(
					0,
					colorMatch[0].indexOf(colorMatch[2]),
				);
				const contentFrom = from + colorMatch.index + openTag.length;
				const contentTo = contentFrom + colorMatch[2].length;
				if (contentFrom >= contentTo) {
					continue;
				}

				pending.push({
					kind: "mark",
					from: contentFrom,
					to: contentTo,
					color: colorMatch[1],
				});
			}
		}

		pending.sort((a, b) => a.from - b.from);

		const builder = new RangeSetBuilder<Decoration>();

		for (const item of pending) {
			if (item.kind === "tag-mark") {
				builder.add(
					item.from,
					item.to,
					Decoration.mark({ class: "nui-html-lp-tag-mark" }),
				);
				continue;
			}

			builder.add(
				item.from,
				item.to,
				Decoration.mark({
					attributes: { style: `color: ${item.color}` },
				}),
			);
		}

		return builder.finish();
	} catch (error) {
		console.error("NUI HTML live preview decorations failed", error);
		return Decoration.none;
	}
}

export function createHtmlLpExtension(
	isEnabled: () => boolean,
): Extension {
	const plugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet = Decoration.none;
			private livePreview = false;

			constructor(_view: EditorView) {
				this.decorations = Decoration.none;
			}

			update(update: ViewUpdate) {
				const livePreview = isLivePreview(update.view);
				const livePreviewChanged = livePreview !== this.livePreview;
				this.livePreview = livePreview;

				if (!isEnabled() || !livePreview) {
					if (this.decorations !== Decoration.none) {
						this.decorations = Decoration.none;
					}
					return;
				}

				if (
					livePreviewChanged ||
					update.docChanged ||
					update.selectionSet ||
					update.viewportChanged ||
					update.transactions.some((transaction) =>
						transaction.effects.some((effect) =>
							effect.is(nuiHtmlLpRefreshEffect),
						),
					)
				) {
					this.decorations = buildDecorations(
						update.view,
						isEnabled(),
					);
				}
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		},
	);

	return Prec.highest(plugin);
}

export function dispatchHtmlLpRefresh(app: App): void {
	app.workspace.iterateAllLeaves((leaf) => {
		const view = leaf.view;
		if (!("editor" in view) || typeof view.editor !== "object") {
			return;
		}

		const editor = view.editor as { cm?: EditorView };
		editor.cm?.dispatch({ effects: nuiHtmlLpRefreshEffect.of(null) });
	});
}
