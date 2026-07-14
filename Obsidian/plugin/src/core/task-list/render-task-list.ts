
import { App, TFile } from "obsidian";
import { TaskItem } from "../tasks/types";
import { toggleTaskInVault } from "../tasks/toggle-task-in-vault";

export interface RenderTaskListOptions {
	app: App;
	containerEl: HTMLElement;
	tasks: TaskItem[];
	emptyMessage?: string;
	onToggle?: () => void;
}

export interface RenderTaskRowOptions {
	showSource?: boolean;
}

export function renderTaskList(options: RenderTaskListOptions): void {
	const { app, containerEl, tasks, emptyMessage, onToggle } = options;

	containerEl.empty();
	containerEl.addClass("nui-task-list");

	if (tasks.length === 0) {
		containerEl.createDiv({
			cls: "nui-task-list-empty",
			text:
				emptyMessage ??
				"No tasks. Add `- [ ]` items in project notes.",
		});
		return;
	}

	const listEl = containerEl.createDiv({ cls: "nui-task-list-items" });

	for (const task of tasks) {
		renderTaskRow(listEl, app, task, onToggle);
	}
}

export function renderInlineTaskRows(
	listEl: HTMLElement,
	app: App,
	tasks: TaskItem[],
	onToggle?: () => void,
): void {
	for (const task of tasks) {
		renderTaskRow(listEl, app, task, onToggle, { showSource: false });
	}
}

function renderTaskRow(
	listEl: HTMLElement,
	app: App,
	task: TaskItem,
	onToggle?: () => void,
	options: RenderTaskRowOptions = {},
): void {
	const showSource = options.showSource ?? true;
	const rowEl = listEl.createDiv({ cls: "nui-task-list-row" });
	if (task.completed) {
		rowEl.addClass("nui-task-list-row--completed");
	}

	const checkboxEl = rowEl.createEl("input", {
		type: "checkbox",
		cls: "nui-task-list-checkbox",
	});
	checkboxEl.checked = task.completed;
	checkboxEl.addEventListener("click", (event) => {
		event.stopPropagation();
		void (async () => {
			await toggleTaskInVault(app, task);
			onToggle?.();
		})();
	});

	const textEl = rowEl.createSpan({
		cls: "nui-task-list-text",
		text: task.text,
	});
	textEl.addEventListener("click", () => {
		void openTaskSource(app, task);
	});

	if (showSource) {
		const sourceEl = rowEl.createEl("a", {
			cls: "nui-task-list-source",
			href: "#",
			text: basenameWithoutExtension(task.filePath),
		});
		sourceEl.addEventListener("click", (event) => {
			event.preventDefault();
			void openTaskSource(app, task);
		});
	}
}

function basenameWithoutExtension(path: string): string {
	const base = path.split("/").pop() ?? path;
	return base.replace(/\.md$/i, "");
}

async function openTaskSource(app: App, task: TaskItem): Promise<void> {
	const file = app.vault.getAbstractFileByPath(task.filePath);
	if (!(file instanceof TFile)) return;

	const linkPath = task.blockId
		? `${file.basename}#^${task.blockId}`
		: file.path;

	await app.workspace.openLinkText(linkPath, "", false, {
		active: true,
	});
}

