
import { parseTaskLine } from "./parse-task-line";

export function toggleTaskLine(line: string): string {
	const parsed = parseTaskLine(line);
	if (!parsed) return line;

	const marker = parsed.completed ? " " : "x";
	return `${parsed.indent}- [${marker}] ${parsed.text}`;
}

