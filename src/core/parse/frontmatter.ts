
export interface ParsedDocument {
	frontmatter: Record<string, unknown>;
	body: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(content: string): ParsedDocument {
	const match = content.match(FRONTMATTER_RE);
	if (!match) {
		return { frontmatter: {}, body: content };
	}

	const frontmatter = parseSimpleYaml(match[1]);
	return { frontmatter, body: match[2] };
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const line of yaml.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const colonIndex = trimmed.indexOf(":");
		if (colonIndex === -1) continue;

		const key = trimmed.slice(0, colonIndex).trim();
		let value = trimmed.slice(colonIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		result[key] = value;
	}

	return result;
}

