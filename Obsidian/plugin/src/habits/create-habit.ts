
import { App, Notice, TFile } from "obsidian";
import {
	buildHabitIndexContent,
	DEFAULT_CALENDAR_FOLDER,
	habitFolderPath,
	habitIndexPath,
	habitTagFromName,
	resolveUniqueHabitName,
} from "./habit-bundle";

export interface CreateHabitOptions {
	calendarFolder?: string;
	year?: number;
	weeklyHabitsBasePath?: string;
}

export interface CreateHabitResult {
	name: string;
	tag: string;
	folderPath: string;
	indexPath: string;
	indexFile: TFile;
}

export async function createHabit(
	app: App,
	options: CreateHabitOptions = {},
): Promise<CreateHabitResult | null> {
	const calendarFolder = options.calendarFolder ?? DEFAULT_CALENDAR_FOLDER;
	const year = options.year ?? new Date().getFullYear();

	try {
		const name = resolveUniqueHabitName(app.vault, calendarFolder);
		const tag = habitTagFromName(name);
		const folderPath = habitFolderPath(calendarFolder, name);
		const indexPath = habitIndexPath(folderPath, name);

		await app.vault.createFolder(folderPath);

		const indexContent = buildHabitIndexContent(name, year);
		const indexFile = await app.vault.create(indexPath, indexContent);

		return {
			name,
			tag,
			folderPath,
			indexPath,
			indexFile,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Could not create habit";
		new Notice(`Add habit: ${message}`);
		return null;
	}
}
