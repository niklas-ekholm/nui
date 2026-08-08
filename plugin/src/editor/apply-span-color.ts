import type { Editor } from "obsidian";
import { DEFAULT_TEXT_COLOR, normalizeHexColor } from "./text-color-utils.ts";

const SPAN_COLOR_OPEN_RE =
	/^<span style="color:\s*(#[0-9a-fA-F]{6})">([\s\S]*)<\/span>$/;

const COLOR_SPAN_PAIR_RE =
	/<span\s+style="color:\s*[^"]*"\s*>([\s\S]*?)<\/span>/gi;

const COLOR_SPAN_OPEN_RE = /<span\s+style="color:\s*[^"]*"\s*>/gi;

const SPAN_CLOSE_RE = /<\/span>/gi;

/** Strip color span tags from text, including nested spans and broken LP markup. */
export function stripColorMarkup(text: string): string {
	let result = text;
	let prev = "";
	while (result !== prev) {
		prev = result;
		result = result.replace(COLOR_SPAN_PAIR_RE, "$1");
	}

	return result
		.replace(COLOR_SPAN_OPEN_RE, "")
		.replace(SPAN_CLOSE_RE, "");
}

type WrappingColorSpan = {
	full: string;
	inner: string;
	color: string;
	start: { line: number; ch: number };
	end: { line: number; ch: number };
};

function findWrappingColorSpan(editor: Editor): WrappingColorSpan | null {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const selected = editor.getSelection();

	const fullSpanMatch = selected.match(SPAN_COLOR_OPEN_RE);
	if (fullSpanMatch) {
		return {
			full: selected,
			inner: fullSpanMatch[2],
			color: fullSpanMatch[1],
			start: from,
			end: to,
		};
	}

	if (from.line !== to.line) {
		return null;
	}

	const line = editor.getLine(from.line);
	const before = line.slice(0, from.ch);
	const openIdx = before.lastIndexOf('<span style="color:');
	if (openIdx < 0) {
		return null;
	}

	const openTagMatch = line
		.slice(openIdx)
		.match(/^<span style="color:\s*(#[0-9a-fA-F]{6})">/);
	if (!openTagMatch) {
		return null;
	}

	const tagEnd = openIdx + openTagMatch[0].length;
	const closeIdx = line.indexOf("</span>", to.ch);
	if (closeIdx < 0 || tagEnd > from.ch) {
		return null;
	}

	const inner = line.slice(tagEnd, closeIdx);
	const full = line.slice(openIdx, closeIdx + "</span>".length);

	return {
		full,
		inner,
		color: openTagMatch[1],
		start: { line: from.line, ch: openIdx },
		end: { line: from.line, ch: openIdx + full.length },
	};
}

export function getSpanColorFromSelection(editor: Editor): string {
	const wrapping = findWrappingColorSpan(editor);
	if (wrapping) {
		return wrapping.color;
	}

	const selected = editor.getSelection();
	const match = selected.match(/^<span style="color:\s*(#[0-9a-fA-F]{6})">/);
	if (match) {
		return match[1];
	}

	return DEFAULT_TEXT_COLOR;
}

export function applySpanColor(editor: Editor, color: string): void {
	const normalized = normalizeHexColor(color);
	if (!normalized) {
		return;
	}

	const wrapping = findWrappingColorSpan(editor);
	if (wrapping) {
		editor.replaceRange(
			`<span style="color: ${normalized}">${wrapping.inner}</span>`,
			wrapping.start,
			wrapping.end,
		);
		return;
	}

	const selected = editor.getSelection();
	if (!selected) {
		return;
	}

	editor.replaceSelection(
		`<span style="color: ${normalized}">${selected}</span>`,
	);
}

export function clearSpanColor(editor: Editor): void {
	const wrapping = findWrappingColorSpan(editor);
	if (wrapping) {
		editor.replaceRange(
			stripColorMarkup(wrapping.inner),
			wrapping.start,
			wrapping.end,
		);
		return;
	}

	const selected = editor.getSelection();
	if (!selected) {
		return;
	}

	const cleaned = stripColorMarkup(selected);
	if (cleaned !== selected) {
		editor.replaceSelection(cleaned);
	}
}
