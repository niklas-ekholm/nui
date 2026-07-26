
import { BasesEntry, BasesViewConfig, NullValue } from "obsidian";
import { formatIsoDate } from "../core/parse/dates";
import { readEntryDate } from "./entry-date";

export interface ScorePoint {
	date: Date;
	dateKey: string;
	score: number;
	filePath: string;
}

export function entriesToScorePoints(
	entries: BasesEntry[],
	config: BasesViewConfig,
): ScorePoint[] {
	const points: ScorePoint[] = [];

	for (const entry of entries) {
		const value = entry.getValue("note.score");
		if (!value || value instanceof NullValue) continue;

		const score = Number(value.toString());
		if (!Number.isFinite(score)) continue;

		const date = readEntryDate(entry, config);
		if (!date) continue;

		points.push({
			date,
			dateKey: formatIsoDate(date),
			score,
			filePath: entry.file.path,
		});
	}

	points.sort((a, b) => {
		const diff = a.date.getTime() - b.date.getTime();
		if (diff !== 0) return diff;
		return a.filePath.localeCompare(b.filePath);
	});

	return points;
}
