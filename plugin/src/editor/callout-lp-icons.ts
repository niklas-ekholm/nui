import { setIcon } from "obsidian";

/** Matches Obsidian’s `--callout-icon` values in app.css (without `lucide-` where setIcon expects it). */
const CALLOUT_ICON_IDS: Record<string, string> = {
	note: "pencil",
	abstract: "clipboard-list",
	summary: "clipboard-list",
	tldr: "clipboard-list",
	info: "info",
	todo: "check-circle-2",
	important: "flame",
	tip: "flame",
	hint: "flame",
	success: "check",
	check: "check",
	done: "check",
	question: "help-circle",
	help: "help-circle",
	faq: "help-circle",
	warning: "alert-triangle",
	caution: "alert-triangle",
	attention: "alert-triangle",
	failure: "x",
	fail: "x",
	missing: "x",
	danger: "zap",
	error: "zap",
	bug: "bug",
	example: "list",
	quote: "quote-glyph",
	cite: "quote-glyph",
};

const DEFAULT_CALLOUT_ICON_ID = "pencil";

/** Primary callout types shown when clicking the LP icon. */
export const CALLOUT_TYPE_PICKER_OPTIONS = [
	{ type: "note", label: "Note" },
	{ type: "abstract", label: "Abstract" },
	{ type: "info", label: "Info" },
	{ type: "todo", label: "Todo" },
	{ type: "important", label: "Important" },
	{ type: "tip", label: "Tip" },
	{ type: "success", label: "Success" },
	{ type: "question", label: "Question" },
	{ type: "warning", label: "Warning" },
	{ type: "failure", label: "Failure" },
	{ type: "danger", label: "Danger" },
	{ type: "bug", label: "Bug" },
	{ type: "example", label: "Example" },
	{ type: "quote", label: "Quote" },
] as const;

export function getObsidianCalloutIconId(type: string): string {
	return CALLOUT_ICON_IDS[type] ?? DEFAULT_CALLOUT_ICON_ID;
}

/** Obsidian callout icon chrome — same structure as reading view `.callout-icon`. */
export function createCalloutIconElement(type: string): HTMLElement {
	const iconWrap = document.createElement("div");
	iconWrap.className = "callout-icon";
	setIcon(iconWrap, getObsidianCalloutIconId(type));
	return iconWrap;
}

/** Blockquote LP — Obsidian’s quote glyph (same as `[!quote]` callouts). */
export function createQuoteIconElement(): HTMLElement {
	const iconWrap = document.createElement("div");
	iconWrap.className = "callout-icon";
	setIcon(iconWrap, "quote-glyph");
	return iconWrap;
}
