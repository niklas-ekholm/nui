
import {
	BasesView,
	Notice,
	parsePropertyId,
	Plugin,
	QueryController,
	TFile,
} from "obsidian";
import { entriesToTimelineItems } from "../bases/timeline-from-entries";
import { tasksFromFile } from "../bases/tasks-from-entries";
import {
	formatIsoDate,
	parseIsoDate,
	shiftRangeStartToDate,
	startOfDay,
} from "../core/parse/dates";
import {
	buildDatedNoteContent,
	resolveUniqueNoteName,
} from "../core/mutate/create-note";
import { duplicateNote } from "../core/mutate/duplicate-note";
import { turnIntoProjectFolder } from "../core/mutate/turn-into-project-folder";
import {
	isNoteInsideProjectFolder,
	moveNotesIntoProjectFolder,
	moveNotesOutOfProjectFolder,
} from "../core/mutate/move-notes-project-folder";
import { confirmMoveToBin } from "../core/mutate/move-to-bin-modal";
import { setFrontmatterField } from "../core/mutate/set-frontmatter-field";
import {
	computeDefaultTimelineRange,
	renderTimeline,
} from "../core/timeline/render-timeline";
import {
	beginTimelineTitleRename,
	isTimelineTitleEditing,
} from "../core/timeline/timeline-title-rename";
import { filterTimelineItems } from "../core/timeline/timeline-search";
import { resolveProjectLabelFromIndexNotes } from "../core/timeline/project-label";
import {
	datesExceedSuperproject,
	filterCollapsedSubprojects,
	groupTimelineItemsBySuperproject,
	isSuperprojectItem,
	superprojectPathForItem,
} from "../core/timeline/superproject";
import {
	createNuiBasesContainer,
	applyTimelineBasesChrome,
	mountBasesTitle,
} from "../bases/bases-view-title";
import { resolveNoteCreateFolder } from "../bases/bases-view-topbar";
import { TimelineItem } from "../core/models/timeline-item";
import { TaskItem } from "../core/tasks/types";
import {
	parseTimelineLayoutMode,
	parseTimelineRange,
	TimelineLayoutMode,
	TimelineRange,
	TimelineTimespan,
	applyTimespanToRange,
	defaultTimelineRange,
	DEFAULT_TIMELINE_TIMESPAN,
} from "../timeline/types";

export const TIMELINE_BASES_VIEW_TYPE = "nui-timeline";

export class TimelineBasesView extends BasesView {
	readonly type = TIMELINE_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private rangePreview?: TimelineRange;
	private selectedItemIds = new Set<string>();
	private collapsedSuperprojectIds = new Set<string>();
	private searchQuery = "";
	private trackedPaths = new Set<string>();
	private updateGeneration = 0;

	constructor(
		controller: QueryController,
		parentEl: HTMLElement,
		private plugin: Plugin & {
			timelineRowSize: number;
			timelineTimespan: TimelineTimespan;
			timelineRangeStart?: string;
			timelineRangeEnd?: string;
			saveTimelineSettings: () => Promise<void>;
		},
	) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-timeline-bases-container",
		);
		applyTimelineBasesChrome(this.containerEl);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (!this.trackedPaths.has(file.path)) return;
				this.onDataUpdated();
			}),
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				this.selectedItemIds.delete(file.path);
				this.onDataUpdated();
			}),
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (this.selectedItemIds.has(oldPath)) {
					this.selectedItemIds.delete(oldPath);
					this.selectedItemIds.add(file.path);
				}
			}),
		);
	}

	onDataUpdated(): void {
		void this.renderTimelineView();
	}

	private async renderTimelineView(): Promise<void> {
		if (isTimelineTitleEditing(this.containerEl)) return;

		const generation = ++this.updateGeneration;
		mountBasesTitle(this.app, this.containerEl, {
			viewName: this.config.name,
		});

		const allItems = this.withProjectLabels(
			groupTimelineItemsBySuperproject(
				entriesToTimelineItems(this.data.data, this.config),
			),
		);
		const searchedItems = filterTimelineItems(allItems, this.searchQuery);
		const items = filterCollapsedSubprojects(
			searchedItems,
			this.collapsedSuperprojectIds,
		);
		const editable = this.isEditable();
		const rangeOverride = this.resolveRangeOverride(allItems);
		const layout = this.resolveLayoutMode();
		const tasksByFilePath =
			layout === "full-tasks"
				? await this.loadTasksByFilePath(items)
				: undefined;
		if (generation !== this.updateGeneration) return;

		this.trackedPaths = new Set(
			layout === "full-tasks" ? items.map((item) => item.id) : [],
		);

		renderTimeline(this.containerEl, items, {
			layout,
			editable,
			rowSize: this.plugin.timelineRowSize,
			rangeOverride,
			timespan: this.plugin.timelineTimespan,
			searchQuery: this.searchQuery,
			onSearchChange: (query) => {
				this.searchQuery = query;
				this.onDataUpdated();
			},
			selectedIds: this.selectedItemIds,
			onSelectionChange: (ids) => {
				this.selectedItemIds.clear();
				for (const id of ids) this.selectedItemIds.add(id);
			},
			onTimespanChange: (timespan) => {
				const current =
					this.resolveRangeOverride(allItems) ??
					computeDefaultTimelineRange(allItems);
				if (!current) return;

				const next = applyTimespanToRange(
					current.start,
					current.end,
					timespan,
				);
				this.rangePreview = undefined;
				this.plugin.timelineTimespan = timespan;
				this.plugin.timelineRangeStart = formatIsoDate(next.start);
				this.plugin.timelineRangeEnd = formatIsoDate(next.end);
				void this.plugin.saveTimelineSettings();
				this.onDataUpdated();
			},
			onRangePreview: (start, end) => {
				this.rangePreview = { start, end };
				this.onDataUpdated();
			},
			onRangeChange: (start, end) => {
				this.rangePreview = undefined;
				this.plugin.timelineRangeStart = formatIsoDate(start);
				this.plugin.timelineRangeEnd = formatIsoDate(end);
				void this.plugin.saveTimelineSettings();
				this.onDataUpdated();
			},
			onRangeRestoreDefault: () => {
				this.rangePreview = undefined;
				this.plugin.timelineTimespan = DEFAULT_TIMELINE_TIMESPAN;
				const next = defaultTimelineRange(DEFAULT_TIMELINE_TIMESPAN);
				this.plugin.timelineRangeStart = formatIsoDate(next.start);
				this.plugin.timelineRangeEnd = formatIsoDate(next.end);
				void this.plugin.saveTimelineSettings();
				this.onDataUpdated();
			},
			emptyMessage:
				"No timeline items. Add start/end dates or adjust the base filters.",
			onItemClick: (item) => this.openItem(item),
			onDeleteItems: (ids) => {
				void this.deleteItems(ids);
			},
			onDuplicateItems: (ids) => {
				void this.duplicateItems(ids);
			},
			onTurnIntoProjectFolder: (ids) => {
				void this.turnIntoProjectFolderItems(ids);
			},
			onMoveItemsToProjectFolder: (itemIds, targetSuperprojectId) => {
				void this.moveItemsToProjectFolder(itemIds, targetSuperprojectId);
			},
			onMoveOutOfProjectFolder: (ids) => {
				void this.moveItemsOutOfProjectFolder(ids);
			},
			canMoveOutOfProjectFolder: (ids) =>
				ids.some((id) => isNoteInsideProjectFolder(this.app, id)),
			onRenameItem: (itemId) => {
				requestAnimationFrame(() => {
					beginTimelineTitleRename(this.containerEl, itemId);
				});
			},
			onItemRenamed: () => {
				this.onDataUpdated();
			},
			groupedItems: searchedItems,
			collapsedSuperprojectIds: this.collapsedSuperprojectIds,
			onToggleSuperprojectCollapse: (superprojectId) => {
				if (this.collapsedSuperprojectIds.has(superprojectId)) {
					this.collapsedSuperprojectIds.delete(superprojectId);
				} else {
					this.collapsedSuperprojectIds.add(superprojectId);
				}
				this.onDataUpdated();
			},
			onDatesChange: editable
				? (item, start, end) => {
						void this.updateDates(item, start, end);
					}
				: undefined,
			onCreateNote: editable
				? () => {
						void this.createNote();
					}
				: undefined,
			onCreateNoteAtDate: editable
				? (date) => {
						void this.createNoteAtDate(date);
					}
				: undefined,
			onRowSizeChange: (rowSize) => {
				this.plugin.timelineRowSize = rowSize;
				void this.plugin.saveTimelineSettings();
				this.onDataUpdated();
			},
			app: editable || layout === "full-tasks" ? this.app : undefined,
			tasksByFilePath,
			onTaskToggle: () => {
				this.onDataUpdated();
			},
		});
	}

	private async loadTasksByFilePath(
		items: TimelineItem[],
	): Promise<Map<string, TaskItem[]>> {
		const tasksByFilePath = new Map<string, TaskItem[]>();

		await Promise.all(
			items.map(async (item) => {
				const tasks = await tasksFromFile(this.app, item.id);
				if (tasks.length > 0) {
					tasksByFilePath.set(item.id, tasks);
				}
			}),
		);

		return tasksByFilePath;
	}

	private resolveLayoutMode(): TimelineLayoutMode {
		return parseTimelineLayoutMode(this.config.get("layout"));
	}

	private withProjectLabels(items: TimelineItem[]): TimelineItem[] {
		return items.map((item) => ({
			...item,
			projectLabel:
				resolveProjectLabelFromIndexNotes(this.app, item.id) ??
				item.project,
		}));
	}

	private resolveRangeOverride(
		items: TimelineItem[],
	): TimelineRange | undefined {
		if (this.rangePreview) return this.rangePreview;

		const stored = parseTimelineRange(
			this.plugin.timelineRangeStart,
			this.plugin.timelineRangeEnd,
		);
		if (stored) return stored;

		return defaultTimelineRange(this.plugin.timelineTimespan);
	}

	private isEditable(): boolean {
		const startProp = this.config.getAsPropertyId("startField");
		const endProp = this.config.getAsPropertyId("endField");
		if (!startProp || !endProp) return false;

		const startType = parsePropertyId(startProp).type;
		const endType = parsePropertyId(endProp).type;
		return startType === "note" && endType === "note";
	}

	private async updateDates(
		item: TimelineItem,
		start: Date,
		end: Date,
	): Promise<void> {
		await this.persistItemDates(item, start, end);

		if (isSuperprojectItem(item.id)) return;

		const superprojectPath = superprojectPathForItem(item.id);
		if (!superprojectPath) return;

		const superFile = this.app.vault.getAbstractFileByPath(superprojectPath);
		if (!(superFile instanceof TFile)) return;

		const startKey = item.startField;
		const endKey = item.endField;
		if (!startKey || !endKey) return;

		const frontmatter =
			this.app.metadataCache.getFileCache(superFile)?.frontmatter ?? {};
		const superStart = parseIsoDate(frontmatter[startKey]);
		if (!superStart) return;

		const superEnd =
			parseIsoDate(frontmatter[endKey] ?? frontmatter[startKey]) ??
			superStart;
		const safeSuperEnd =
			superEnd.getTime() < superStart.getTime() ? superStart : superEnd;

		const expanded = datesExceedSuperproject(
			start,
			end,
			superStart,
			safeSuperEnd,
		);
		if (!expanded) return;

		const superItem: TimelineItem = {
			id: superprojectPath,
			title: superFile.basename,
			start: superStart,
			end: safeSuperEnd,
			startField: startKey,
			endField: endKey,
		};
		await this.persistItemDates(superItem, expanded.start, expanded.end);
	}

	private async persistItemDates(
		item: TimelineItem,
		start: Date,
		end: Date,
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(item.id);
		if (!(file instanceof TFile)) return;

		const startKey = item.startField;
		const endKey = item.endField;
		if (!startKey || !endKey) return;

		const content = await this.app.vault.read(file);
		let updated = setFrontmatterField(content, startKey, formatIsoDate(start));
		updated = setFrontmatterField(updated, endKey, formatIsoDate(end));

		if (updated !== content) {
			await this.app.vault.modify(file, updated);
		}
	}

	private resolveConfiguredFieldKey(optionKey: string, fallback: string): string {
		const configured = this.config.getAsPropertyId(optionKey);
		if (configured && parsePropertyId(configured).type === "note") {
			return parsePropertyId(configured).name;
		}
		return fallback;
	}

	private async createNoteAtDate(date: Date): Promise<void> {
		await this.shiftTimelineRangeToStartDate(date);
		await this.createNote(date);
	}

	private async shiftTimelineRangeToStartDate(date: Date): Promise<void> {
		const current =
			this.resolveRangeOverride([]) ??
			defaultTimelineRange(this.plugin.timelineTimespan);
		const next = shiftRangeStartToDate(current.start, current.end, date);
		const nextStart = startOfDay(next.start);

		if (nextStart.getTime() === startOfDay(current.start).getTime()) {
			return;
		}

		this.rangePreview = undefined;
		this.plugin.timelineRangeStart = formatIsoDate(next.start);
		this.plugin.timelineRangeEnd = formatIsoDate(next.end);
		await this.plugin.saveTimelineSettings();
		await this.renderTimelineView();
	}

	private async createNote(date = new Date()): Promise<void> {
		const folder = resolveNoteCreateFolder(
			this.app,
			this.containerEl,
			this.config.name,
		);
		if (folder === null) {
			new Notice("Timeline: could not resolve folder for new note.");
			return;
		}
		const startKey = this.resolveConfiguredFieldKey("startField", "Start Date");
		const endKey = this.resolveConfiguredFieldKey("endField", "End Date");
		const noteDate = formatIsoDate(date);
		const fileName = resolveUniqueNoteName(this.app, folder);
		const filePath = folder ? `${folder}/${fileName}` : fileName;

		try {
			const content = buildDatedNoteContent(startKey, endKey, noteDate);
			await this.app.vault.create(filePath, content);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not create note";
			new Notice(`Timeline: ${message}`);
		}
	}

	private openItem(item: TimelineItem): void {
		const file = this.app.vault.getAbstractFileByPath(item.id);
		if (!(file instanceof TFile)) return;

		void this.app.workspace.getLeaf(false).openFile(file);
	}

	private resolveFiles(ids: string[]): TFile[] {
		const files: TFile[] = [];
		for (const id of ids) {
			const file = this.app.vault.getAbstractFileByPath(id);
			if (file instanceof TFile) files.push(file);
		}
		return files;
	}

	private deleteItems(ids: string[]): void {
		const files = this.resolveFiles(ids);
		if (files.length === 0) return;

		const message =
			files.length === 1
				? "Are you sure? The file will be moved to Bin"
				: "Are you sure? The files will be moved to Bin";

		confirmMoveToBin(this.app, message, async () => {
			for (const file of files) {
				try {
					await this.app.fileManager.trashFile(file);
				} catch (error) {
					const detail =
						error instanceof Error ? error.message : "Could not move to Bin";
					new Notice(`Timeline: ${detail}`);
				}
			}
			this.selectedItemIds.clear();
		});
	}

	private async duplicateItems(ids: string[]): Promise<void> {
		const files = this.resolveFiles(ids);
		if (files.length === 0) return;

		for (const file of files) {
			try {
				await duplicateNote(this.app, file);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not duplicate note";
				new Notice(`Timeline: ${message}`);
			}
		}

		this.onDataUpdated();
	}

	private async turnIntoProjectFolderItems(ids: string[]): Promise<void> {
		if (ids.length !== 1) return;

		const file = this.resolveFiles(ids)[0];
		if (!file) return;

		try {
			const indexFile = await turnIntoProjectFolder(this.app, file);
			if (indexFile) {
				this.selectedItemIds.clear();
				this.onDataUpdated();
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Could not create project folder";
			new Notice(`Timeline: ${message}`);
		}
	}

	private async moveItemsToProjectFolder(
		itemIds: string[],
		targetSuperprojectId: string,
	): Promise<void> {
		const targetFile = this.app.vault.getAbstractFileByPath(targetSuperprojectId);
		if (!(targetFile instanceof TFile)) return;

		const files = this.resolveFiles(itemIds);
		if (files.length === 0) return;

		const moved = await moveNotesIntoProjectFolder(
			this.app,
			files,
			targetFile,
		);
		if (moved > 0) {
			this.selectedItemIds.clear();
			this.onDataUpdated();
		}
	}

	private async moveItemsOutOfProjectFolder(ids: string[]): Promise<void> {
		const files = this.resolveFiles(ids);
		if (files.length === 0) return;

		const moved = await moveNotesOutOfProjectFolder(this.app, files);
		if (moved > 0) {
			this.selectedItemIds.clear();
			this.onDataUpdated();
		}
	}
}

