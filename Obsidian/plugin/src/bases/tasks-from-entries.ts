
import { App, BasesEntry, TFile } from "obsidian";
import { parseTaskLine } from "../core/tasks/parse-task-line";
import { TaskItem } from "../core/tasks/types";

export async function tasksFromFile(
	app: App,
	filePath: string,
	showCompleted = false,
): Promise<TaskItem[]> {
	const file = app.vault.getAbstractFileByPath(filePath);
	if (!(file instanceof TFile)) return [];
	return tasksFromFileEntry(app, file, showCompleted);
}

async function tasksFromFileEntry(
	app: App,
	file: TFile,
	showCompleted: boolean,
): Promise<TaskItem[]> {
	const cache = app.metadataCache.getFileCache(file);
	const listItems = cache?.listItems;
	if (!listItems?.length) return [];

	const content = await app.vault.cachedRead(file);
	const lines = content.split("\n");
	const tasks: TaskItem[] = [];

	for (const item of listItems) {
		if (item.task === undefined) continue;

		const completed = item.task !== " ";
		if (!showCompleted && completed) continue;

		const line = lines[item.position.start.line] ?? "";
		const parsed = parseTaskLine(line);
		if (!parsed) continue;

		tasks.push({
			text: parsed.text,
			completed,
			filePath: file.path,
			line: item.position.start.line,
			blockId: item.id,
		});
	}

	return sortTasks(tasks);
}

export async function tasksFromEntries(
	app: App,
	entries: BasesEntry[],
	showCompleted: boolean,
): Promise<TaskItem[]> {
	const tasks: TaskItem[] = [];

	for (const entry of entries) {
		const file = entry.file;
		tasks.push(...(await tasksFromFileEntry(app, file, showCompleted)));
	}

	return sortTasks(tasks);
}

function sortTasks(tasks: TaskItem[]): TaskItem[] {
	return [...tasks].sort((left, right) => {
		if (left.completed !== right.completed) {
			return left.completed ? 1 : -1;
		}
		if (left.filePath !== right.filePath) {
			return left.filePath.localeCompare(right.filePath);
		}
		return left.line - right.line;
	});
}

