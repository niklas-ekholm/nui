export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const BARE_HEX_COLOR_RE = /^[0-9a-fA-F]{6}$/;

export const DEFAULT_TEXT_COLOR = "#000000";

export function normalizeHexColor(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim().replace(/^["']|["']$/g, "");
	if (HEX_COLOR_RE.test(trimmed)) {
		return trimmed.toLowerCase();
	}
	if (BARE_HEX_COLOR_RE.test(trimmed)) {
		return `#${trimmed.toLowerCase()}`;
	}

	return null;
}

/** YAML-safe hex literal for frontmatter (quotes required; `#` starts a comment). */
export function formatHexColorForYaml(color: string): string | null {
	const normalized = normalizeHexColor(color);
	return normalized ? `"${normalized}"` : null;
}
