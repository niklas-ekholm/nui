/** First line of a callout block: `> [!type]` with optional metadata/fold. */
export const CALLOUT_HEADER_RE =
	/^>\s*\[!([^\]|]+)(?:\|[^\]]*)?\][+\-]?(?:\s|$)/;

export function normalizeCalloutType(raw: string): string {
	return raw.trim().toLowerCase();
}

export function parseCalloutType(lineText: string): string | null {
	const match = CALLOUT_HEADER_RE.exec(lineText);
	return match ? normalizeCalloutType(match[1]) : null;
}

export function calloutIconLineClass(type: string): string {
	return `nui-lp-callout-icon nui-lp-callout--${type}`;
}

export function calloutContinuationLineClass(type: string): string {
	return `${CALLOUT_BODY_LINE_CLASS} nui-lp-callout--${type}`;
}

/** Continuation `>` line inside a callout block (not the header). */
export const CALLOUT_BODY_LINE_CLASS = "nui-lp-callout-continuation";

/** First / continuation lines of a plain blockquote block in LP. */
export const QUOTE_HEADER_LINE_CLASS = "nui-lp-quote-header";
export const QUOTE_BODY_LINE_CLASS = "nui-lp-quote-continuation";

const QUOTE_LINE_RE = /^>\s/;

export function isQuoteLine(lineText: string): boolean {
	return QUOTE_LINE_RE.test(lineText);
}

export function isCalloutContinuationLine(lineText: string): boolean {
	return isQuoteLine(lineText) && parseCalloutType(lineText) === null;
}

const CALLOUT_TYPE_ALIASES: Record<string, string> = {
	summary: "abstract",
	tldr: "abstract",
	default: "note",
	hint: "tip",
	check: "success",
	done: "success",
	help: "question",
	faq: "question",
	caution: "warning",
	attention: "warning",
	fail: "failure",
	missing: "failure",
	error: "danger",
	cite: "quote",
};

/** Map aliases (e.g. `caution`) to a picker option (e.g. `warning`). */
export function canonicalCalloutType(type: string): string {
	const normalized = normalizeCalloutType(type);
	return CALLOUT_TYPE_ALIASES[normalized] ?? normalized;
}

const CALLOUT_TYPE_REPLACE_RE = /^(\>\s*\[!)([^\]|]+)((?:\|[^\]]*)?\])/;

/** Replace `[!type]` on a callout header line; preserves metadata and fold markers. */
export function replaceCalloutTypeInLine(
	lineText: string,
	newType: string,
): string | null {
	if (parseCalloutType(lineText) === null) {
		return null;
	}
	const normalized = normalizeCalloutType(newType);
	return lineText.replace(
		CALLOUT_TYPE_REPLACE_RE,
		`$1${normalized}$3`,
	);
}
