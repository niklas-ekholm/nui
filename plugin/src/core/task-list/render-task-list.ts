
import { App, Keymap, TFile } from "obsidian";
import { displayBasenameForNotePath } from "../../navigation/folder-index-path";
import { parseTaskTextSegments } from "./parse-task-text-segments";
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
		cls: "nui-task-list-text nui-body-copy",
	});
	renderTaskText(textEl, app, task, () => {
		void openTaskSource(app, task);
	});

	if (showSource) {
		const sourceEl = rowEl.createEl("a", {
			cls: "nui-task-list-source",
			href: "#",
			text: displayBasenameForNotePath(task.filePath),
		});
		sourceEl.addEventListener("click", (event) => {
			event.preventDefault();
			void openTaskSource(app, task);
		});
	}
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

function renderTaskText(
	container: HTMLElement,
	app: App,
	task: TaskItem,
	onPlainClick: () => void,
): void {
	const segments = parseTaskTextSegments(task.text);
	const hasWikilink = segments.some((segment) => segment.type === "wikilink");

	if (!hasWikilink) {
		container.setText(task.text);
		container.addEventListener("click", onPlainClick);
		return;
	}

	for (const segment of segments) {
		if (segment.type === "text") {
			const textEl = container.createSpan({ text: segment.content });
			textEl.addEventListener("click", onPlainClick);
			continue;
		}

		const linkEl = container.createEl("a", {
			cls: "internal-link",
			text: segment.content,
			href: "#",
		});
		if (
			segment.target &&
			!app.metadataCache.getFirstLinkpathDest(
				segment.target,
				task.filePath,
			)
		) {
			linkEl.addClass("is-unresolved");
		}
		linkEl.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (!segment.target) return;
			void app.workspace.openLinkText(
				segment.target,
				task.filePath,
				Keymap.isModEvent(event),
			);
		});
	}
}
