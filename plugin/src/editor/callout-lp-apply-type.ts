import type { EditorView } from "@codemirror/view";
import { replaceCalloutTypeInLine } from "./callout-lp-parse";

export function applyCalloutTypeChange(
	view: EditorView,
	lineFrom: number,
	newType: string,
): void {
	const line = view.state.doc.lineAt(lineFrom);
	const nextText = replaceCalloutTypeInLine(line.text, newType);
	if (nextText === null || nextText === line.text) {
		return;
	}

	view.dispatch({
		changes: { from: line.from, to: line.to, insert: nextText },
	});
}
