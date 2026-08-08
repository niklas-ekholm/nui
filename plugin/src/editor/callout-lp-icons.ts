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

/** SVG Repo quotation right mark — https://www.svgrepo.com/svg/42678/quotation-right-mark */
const QUOTE_MARK_RIGHT_PATH =
	"M198.779,322.441v-58.245c0-7.903,6.406-14.304,14.304-14.304c28.183,0,43.515-28.904,45.643-85.961h-45.643c-7.897,0-14.304-6.41-14.304-14.304V26.64c0-7.9,6.406-14.301,14.304-14.301h121.69c7.896,0,14.305,6.408,14.305,14.301v122.988c0,27.349-2.761,52.446-8.181,74.611c-5.568,22.722-14.115,42.587-25.398,59.049c-11.604,16.917-26.132,30.192-43.155,39.437c-17.152,9.304-37.09,14.026-59.267,14.026C205.186,336.745,198.779,330.338,198.779,322.441z M14.301,249.887C6.404,249.887,0,256.293,0,264.185v58.257c0,7.896,6.404,14.298,14.301,14.298c22.166,0,42.114-4.723,59.255-14.026c17.032-9.244,31.558-22.508,43.161-39.437c11.29-16.462,19.836-36.328,25.404-59.061c5.423-22.165,8.178-47.263,8.178-74.6V26.628c0-7.9-6.41-14.301-14.304-14.301H14.301C6.404,12.327,0,18.734,0,26.628v122.988c0,7.899,6.404,14.304,14.301,14.304h45.002C57.201,220.982,42.09,249.887,14.301,249.887z";

function createQuoteMarkRightSvg(): SVGSVGElement {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 349.078 349.078");
	svg.setAttribute("aria-hidden", "true");
	svg.classList.add("svg-icon", "nui-lp-quote-mark-icon");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute("fill", "currentColor");
	path.setAttribute("d", QUOTE_MARK_RIGHT_PATH);
	svg.appendChild(path);

	return svg;
}

/** Obsidian callout icon chrome — same structure as reading view `.callout-icon`. */
export function createCalloutIconElement(type: string): HTMLElement {
	const iconWrap = document.createElement("div");
	iconWrap.className = "callout-icon";
	setIcon(iconWrap, getObsidianCalloutIconId(type));
	return iconWrap;
}

/** Blockquote LP — SVG Repo quotation right mark. */
export function createQuoteIconElement(): HTMLElement {
	const iconWrap = document.createElement("div");
	iconWrap.className = "callout-icon";
	iconWrap.appendChild(createQuoteMarkRightSvg());
	return iconWrap;
}
