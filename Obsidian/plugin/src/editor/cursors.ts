
import type { Editor, EditorPosition, EditorSelection, EditorSelectionOrCaret } from "obsidian";

type Direction = "up" | "down";

function reconstructSelections(
	selections: EditorSelectionOrCaret[],
): EditorSelectionOrCaret[] {
	return selections.map(({ anchor, head }) => ({ anchor, head }));
}

function linesOfSelection(editor: Editor): string[] {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const lines: string[] = [];
	for (let line = from.line; line <= to.line; line++) {
		lines.push(editor.getLine(line));
	}
	return lines;
}

function scrollSelectionIntoView(
	editor: Editor,
	selection: EditorSelection,
): void {
	const lastLine = editor.lastLine();
	const anchorLine = Math.max(0, selection.anchor.line - 1);
	const headLine = Math.min(lastLine, selection.head.line + 1);
	editor.scrollIntoView(
		{
			from: { line: anchorLine, ch: selection.anchor.ch },
			to: { line: headLine, ch: selection.head.ch },
		},
		true,
	);
}

function posOffset(editor: Editor, pos: EditorPosition): number {
	return editor.posToOffset(pos);
}

function anchorAheadOfHead(
	editor: Editor,
	selection: EditorSelection,
): boolean {
	return posOffset(editor, selection.anchor) > posOffset(editor, selection.head);
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordAtCursor(editor: Editor): {
	wordAnchor: EditorPosition;
	wordHead: EditorPosition;
	text: string;
} {
	const cursor = editor.getCursor();
	const cm = (editor as Editor & { cm?: { viewState?: { state: { wordAt: (offset: number) => { from: number; to: number } | null } } } }).cm;
	const cursorOffset = editor.posToOffset(cursor);

	if (cm?.viewState?.state.wordAt) {
		const word = cm.viewState.state.wordAt(cursorOffset);
		if (word) {
			const wordAnchor = editor.offsetToPos(word.from);
			const wordHead = editor.offsetToPos(word.to);
			const text = editor.getRange(wordAnchor, wordHead);
			if (anchorAheadOfHead(editor, { anchor: wordAnchor, head: wordHead })) {
				return { wordAnchor: wordHead, wordHead: wordAnchor, text };
			}
			return { wordAnchor, wordHead, text };
		}
	}

	const length = editor.getValue().length;
	if (length === 0) {
		const start = { line: 0, ch: 0 };
		return { wordAnchor: start, wordHead: start, text: "" };
	}

	if (cursorOffset < length) {
		const wordAnchor = cursor;
		const wordHead = editor.offsetToPos(cursorOffset + 1);
		return {
			wordAnchor,
			wordHead,
			text: editor.getRange(wordAnchor, wordHead),
		};
	}

	const wordAnchor = editor.offsetToPos(cursorOffset - 1);
	const wordHead = cursor;
	return {
		wordAnchor,
		wordHead,
		text: editor.getRange(wordAnchor, wordHead),
	};
}

function getSelectionTarget(editor: Editor): {
	text: string;
	wordAnchor: EditorPosition;
	wordHead: EditorPosition;
} {
	const selections = editor.listSelections();
	const last = selections[selections.length - 1];
	const { anchor, head } = last;

	if (!(anchor.line === head.line && anchor.ch === head.ch)) {
		const text =
			posOffset(editor, anchor) < posOffset(editor, head)
				? editor.getRange(anchor, head)
				: editor.getRange(head, anchor);
		return { text, wordAnchor: anchor, wordHead: head };
	}

	const { wordAnchor, wordHead, text } = wordAtCursor(editor);
	return { text, wordAnchor, wordHead };
}

function selectionFromMatch(
	editor: Editor,
	match: RegExpMatchArray,
): EditorSelection {
	const fromOffset = match.index ?? 0;
	const toOffset = fromOffset + match[0].length;
	return {
		anchor: editor.offsetToPos(fromOffset),
		head: editor.offsetToPos(toOffset),
	};
}

function isSelectionActive(
	editor: Editor,
	selection: EditorSelection,
): boolean {
	const anchorOffset = posOffset(editor, selection.anchor);
	const headOffset = posOffset(editor, selection.head);
	return editor
		.listSelections()
		.some(
			(sel) =>
				posOffset(editor, sel.anchor) === anchorOffset &&
				posOffset(editor, sel.head) === headOffset,
		);
}

function nextUnselectedMatch(
	editor: Editor,
	matches: RegExpMatchArray[],
	fromOffset: number,
): RegExpMatchArray | undefined {
	const next = matches.find((match) => (match.index ?? 0) > fromOffset);
	if (next) return next;

	return matches.find((match) => {
		const selection = selectionFromMatch(editor, match);
		return (match.index ?? 0) < fromOffset && !isSelectionActive(editor, selection);
	});
}

export function copyLine(editor: Editor, direction: Direction): void {
	let cursorFrom = editor.getCursor("from");
	let cursorTo = editor.getCursor("to");
	const copyLines = linesOfSelection(editor);
	const lines = editor.getValue().split("\n");

	lines.splice(
		cursorTo.line + (direction === "up" ? 0 : 1),
		0,
		...copyLines,
	);
	editor.setValue(lines.join("\n"));

	if (direction === "down") {
		cursorFrom = { ...cursorFrom, line: cursorFrom.line + copyLines.length };
		cursorTo = { ...cursorTo, line: cursorTo.line + copyLines.length };
	}

	editor.setSelection(cursorFrom, cursorTo);
	scrollSelectionIntoView(editor, { anchor: cursorFrom, head: cursorTo });
}

export function addCursorOnAdjacentLine(
	editor: Editor,
	direction: Direction,
): void {
	const selections = editor.listSelections();
	const ref =
		direction === "up"
			? selections[0]
			: selections[selections.length - 1];
	const { ch, line } = ref.anchor;
	const targetLine = line + (direction === "up" ? -1 : 1);

	if (targetLine < 0 || targetLine > editor.lastLine()) return;

	const targetCh = Math.min(ch, editor.getLine(targetLine).length);
	const pos = { line: targetLine, ch: targetCh };
	selections.push({ anchor: pos, head: pos });
	editor.setSelections(reconstructSelections(selections));
}

export function addNextMatchToSelections(editor: Editor): void {
	const { text, wordAnchor, wordHead } = getSelectionTarget(editor);

	if (!editor.somethingSelected()) {
		editor.setSelection(wordAnchor, wordHead);
		return;
	}

	if (!text) return;

	const regex = new RegExp(escapeRegex(text), "g");
	const matches = [...editor.getValue().matchAll(regex)];
	const latest = editor.listSelections().at(-1);
	if (!latest) return;

	const fromOffset = posOffset(editor, latest.head);
	const match = nextUnselectedMatch(editor, matches, fromOffset);

	if (!match) return;

	const nextSelection = selectionFromMatch(editor, match);
	editor.setSelections(
		reconstructSelections([...editor.listSelections(), nextSelection]),
	);
	scrollSelectionIntoView(editor, nextSelection);
}

