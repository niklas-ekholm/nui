import {
	buildHabitDayFileName,
	buildMinimalDayNoteContent,
} from "../../habits/habit-bundle";

const ISO_DAY_BASENAME = /^(\d{4}-\d{2}-\d{2})$/;
const TAGGED_DAY_BASENAME = /^(\d{4}-\d{2}-\d{2}) .+$/;

export type DayNoteNamingStyle = "date-only" | "tagged";

export interface InferredDayNote {
	fileName: string;
	content: string;
	style: DayNoteNamingStyle;
}

export function resolveHabitNameFromHostFolder(hostFolder: string): string | null {
	const parts = hostFolder.split("/").filter(Boolean);
	const name = parts[parts.length - 1];
	return name || null;
}

export function buildDayNoteContent(
	dateField: string,
	dateKey: string,
): string {
	return `---\n${dateField}: ${dateKey}\n---\n\n`;
}

export function buildEmbedDayNote(
	dateField: string,
	dateKey: string,
	folderLabel: string,
): InferredDayNote {
	return {
		style: "tagged",
		fileName: buildHabitDayFileName(dateKey, folderLabel),
		content: buildDayNoteContent(dateField, dateKey),
	};
}

export function inferDayNoteNamingStyle(samplePaths: string[]): DayNoteNamingStyle {
	for (const filePath of samplePaths) {
		const basename = filePath.split("/").pop()?.replace(/\.md$/i, "") ?? "";
		if (TAGGED_DAY_BASENAME.test(basename)) {
			return "tagged";
		}
		if (ISO_DAY_BASENAME.test(basename)) {
			return "date-only";
		}
	}
	return "date-only";
}

export function buildInferredDayNote(
	dateField: string,
	dateKey: string,
	habitName: string,
	samplePaths: string[],
): InferredDayNote {
	const style = inferDayNoteNamingStyle(samplePaths);
	if (style === "tagged") {
		return {
			style,
			fileName: buildHabitDayFileName(dateKey, habitName),
			content: buildDayNoteContent(dateField, dateKey),
		};
	}
	return {
		style,
		fileName: `${dateKey}.md`,
		content: buildMinimalDayNoteContent(),
	};
}
