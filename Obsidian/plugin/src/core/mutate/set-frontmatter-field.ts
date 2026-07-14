
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function setFrontmatterField(
	content: string,
	key: string,
	value: string,
): string {
	const match = content.match(FRONTMATTER_RE);
	if (!match) {
		return `---\n${key}: ${value}\n---\n\n${content}`;
	}

	const yaml = match[1];
	const body = match[2];
	const keyPattern = new RegExp(`^${escapeRegExp(key)}\\s*:`);
	const lines = yaml.split("\n");
	let found = false;

	const updatedLines = lines.map((line) => {
		if (keyPattern.test(line.trim())) {
			found = true;
			return `${key}: ${value}`;
		}
		return line;
	});

	if (!found) {
		updatedLines.push(`${key}: ${value}`);
	}

	return `---\n${updatedLines.join("\n")}\n---\n${body}`;
}

