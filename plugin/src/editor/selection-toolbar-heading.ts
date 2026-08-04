import { EditorState } from "@codemirror/state";

/** Heading level 0–6 for the line containing `pos` (0 = paragraph). */
export function headingLevelAt(state: EditorState, pos: number): number {
	const line = state.doc.lineAt(pos);
	const match = /^(#{1,6})(?:\s|$)/.exec(line.text);
	return match ? match[1].length : 0;
}

export function nextHeadingLevel(current: number): number {
	return (current + 1) % 7;
}
