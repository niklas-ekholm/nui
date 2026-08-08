import { EditorState } from "@codemirror/state";

const INLINE_WRAPPERS: readonly { open: string; close: string }[] = [
	{ open: "**", close: "**" },
	{ open: "__", close: "__" },
	{ open: "~~", close: "~~" },
	{ open: "==", close: "==" },
	{ open: "[[", close: "]]" },
	{ open: "`", close: "`" },
	{ open: "*", close: "*" },
	{ open: "_", close: "_" },
];

function expandInlineAnchorLeft(
	state: EditorState,
	from: number,
	to: number,
): number {
	const doc = state.doc;
	let anchor = from;
	let changed = true;

	while (changed) {
		changed = false;
		for (const { open, close } of INLINE_WRAPPERS) {
			const start = anchor - open.length;
			if (start < 0 || doc.sliceString(start, anchor) !== open) {
				continue;
			}
			if (doc.sliceString(to, to + close.length) !== close) {
				continue;
			}
			anchor = start;
			changed = true;
			break;
		}
	}

	return anchor;
}

function expandLinePrefixAnchorLeft(state: EditorState, from: number): number {
	const line = state.doc.lineAt(from);
	if (from <= line.from) {
		return from;
	}

	const relative = from - line.from;
	const text = line.text;

	const heading = text.match(/^(#{1,6}\s)/);
	if (heading && relative >= heading[0].length) {
		return line.from;
	}

	const blockquote = text.match(/^(>\s)/);
	if (blockquote && relative >= blockquote[0].length) {
		return line.from;
	}

	const unordered = text.match(/^(\s*)([-*+]\s)/);
	if (unordered && relative >= unordered[0].length) {
		return line.from + unordered[1].length;
	}

	const ordered = text.match(/^(\s*)(\d+\.\s)/);
	if (ordered && relative >= ordered[0].length) {
		return line.from + ordered[1].length;
	}

	return from;
}

/** Left edge of visible selection, including markdown syntax that wraps it. */
export function toolbarAnchorPos(
	state: EditorState,
	from: number,
	to: number,
): number {
	return Math.min(
		from,
		expandInlineAnchorLeft(state, from, to),
		expandLinePrefixAnchorLeft(state, from),
	);
}
