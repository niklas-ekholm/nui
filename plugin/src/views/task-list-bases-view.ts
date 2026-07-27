
import { BasesEntry, BasesView, QueryController } from "obsidian";
import {
	isActiveTaskNote,
	parseTimelineFolders,
} from "../bases/ongoing-project-folders";
import { tasksFromEntries } from "../bases/tasks-from-entries";
import { clearEmbeddedBasesChrome, syncEmbeddedBasesChrome } from "../bases/embedded-bases-chrome";
import { syncBasesViewTopbar } from "../bases/bases-view-topbar";
import { createNuiBasesContainer, mountBasesTitle } from "../bases/bases-view-title";
import { renderTaskList } from "../core/task-list/render-task-list";
import { taskSignature } from "../core/tasks/types";
import {
	TASK_LIST_BASES_VIEW_TYPE,
	mergeShowCompleted,
	mergeTaskProjectScope,
} from "../layouts/types";

export class TaskListBasesView extends BasesView {
	readonly type = TASK_LIST_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";
	private trackedPaths = new Set<string>();
	private updateGeneration = 0;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-task-list-bases-root",
		);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (
					!this.trackedPaths.has(file.path) &&
					!this.isTimelinePath(file.path)
				) {
					return;
				}
				this.renderedSignature = "";
				this.onDataUpdated();
			}),
		);
	}

	onDataUpdated(): void {
		void this.updateTasks();
	}

	private async updateTasks(): Promise<void> {
		const generation = ++this.updateGeneration;
		const showCompleted = mergeShowCompleted(this.config.get("showCompleted"));
		const projectScope = mergeTaskProjectScope(
			this.config.get("projectScope"),
		);
		const timelineFolders = parseTimelineFolders(
			this.config.get("timelineFolders"),
		);
		const order = this.config.getOrder().join(",");
		const entries = this.filterEntries(this.data.data, {
			projectScope,
			timelineFolders,
		});
		this.trackedPaths = new Set(entries.map((entry) => entry.file.path));

		this.syncChrome();

		const tasks = await tasksFromEntries(this.app, entries, showCompleted);
		if (generation !== this.updateGeneration) return;

		const signature = [
			this.type,
			showCompleted ? "1" : "0",
			projectScope,
			timelineFolders.join(","),
			order,
			taskSignature(tasks),
		].join("|");

		if (signature === this.renderedSignature) return;
		this.renderedSignature = signature;

		renderTaskList({
			app: this.app,
			containerEl: this.containerEl,
			tasks,
			emptyMessage:
				projectScope === "ongoing"
					? "No open tasks for today."
					: undefined,
			onToggle: () => {
				this.renderedSignature = "";
				this.onDataUpdated();
			},
		});

		this.syncChrome();
	}

	private syncChrome(): void {
		mountBasesTitle(this.app, this.containerEl, {
			viewName: this.config.name,
		});
		syncEmbeddedBasesChrome(this, this.containerEl, []);
		syncBasesViewTopbar(this.containerEl, {});
	}

	private filterEntries(
		entries: BasesEntry[],
		options: {
			projectScope: ReturnType<typeof mergeTaskProjectScope>;
			timelineFolders: string[];
		},
	): BasesEntry[] {
		if (options.projectScope !== "ongoing") return entries;

		return entries.filter((entry) =>
			isActiveTaskNote(this.app, entry.file.path),
		);
	}

	private isTimelinePath(filePath: string): boolean {
		if (mergeTaskProjectScope(this.config.get("projectScope")) !== "ongoing") {
			return false;
		}

		const timelineFolders = parseTimelineFolders(
			this.config.get("timelineFolders"),
		);
		return timelineFolders.some((folder) => {
			const prefix = folder.endsWith("/") ? folder : `${folder}/`;
			return filePath.startsWith(prefix);
		});
	}

	onunload(): void {
		clearEmbeddedBasesChrome(this.containerEl);
	}
}

