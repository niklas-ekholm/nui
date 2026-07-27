
import { App, TFile } from "obsidian";
import { toggleTaskLine } from "./toggle-task-line";
import { TaskItem } from "./types";

export async function toggleTaskInVault(
	app: App,
	task: TaskItem,
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(task.filePath);
	if (!(file instanceof TFile)) return;

	await app.vault.process(file, (content) => {
		const lines = content.split("\n");
		const line = lines[task.line];
		if (!line) return content;

		lines[task.line] = toggleTaskLine(line);
		return lines.join("\n");
	});
}

