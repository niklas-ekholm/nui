
const TASK_LINE = /^(\s*)-\s*\[([ xX])\]\s*(.*)$/;

export interface ParsedTaskLine {
	indent: string;
	completed: boolean;
	text: string;
}

export function parseTaskLine(line: string): ParsedTaskLine | null {
	const match = line.match(TASK_LINE);
	if (!match) return null;

	return {
		indent: match[1],
		completed: match[2].toLowerCase() === "x",
		text: match[3].trimEnd(),
	};
}

