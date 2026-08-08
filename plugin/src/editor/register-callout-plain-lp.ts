import type { Range } from "@codemirror/state";
import { Decoration, type DecorationSet } from "@codemirror/view";
import type { Plugin } from "obsidian";
import { filterCalloutLivePreviewDecorations } from "./callout-plain-lp";

function isDecorationSet(
	of: Range<Decoration> | readonly Range<Decoration>[] | DecorationSet,
): of is DecorationSet {
	return (
		typeof of === "object" &&
		of !== null &&
		!Array.isArray(of) &&
		"size" in of
	);
}

/**
 * Live Preview callouts as plain source text — no embed block, no rendered widget.
 * Patches CodeMirror decoration assembly the same way as community
 * “live preview options” plugins filter math widgets.
 */
export function registerCalloutPlainLp(plugin: Plugin): void {
	const originalSet = Decoration.set;

	Decoration.set = function patchedDecorationSet(
		of: Range<Decoration> | readonly Range<Decoration>[] | DecorationSet,
		sort?: boolean,
	): DecorationSet {
		// CodeMirror passes existing sets through unchanged.
		if (isDecorationSet(of)) {
			return originalSet.call(Decoration, of, sort);
		}

		const filtered = filterCalloutLivePreviewDecorations(
			of as Range<Decoration> | readonly Range<Decoration>[],
		);
		if (filtered === null) {
			return Decoration.none;
		}
		return originalSet.call(Decoration, filtered, sort);
	};

	plugin.register(() => {
		Decoration.set = originalSet;
	});
}
