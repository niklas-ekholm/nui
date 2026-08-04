
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
import { scrollTimelineRowToCenter } from "../core/timeline/timeline-scroll-to-row";
import { filterTimelineItems } from "../core/timeline/timeline-search";
import { filterTimelineItemsByResponsibility } from "../core/timeline/timeline-responsibility-filter";
import { resolveInheritedEventColor } from "../core/timeline/event-color";
import { resolveResponsibilityForItem } from "../core/timeline/project-label";
import {
	ancestorFolderHubsOnTimeline,
	datesExceedHubNote,
	filterCollapsedFolderGroups,
	groupTimelineItemsByFolder,
	isHubNoteItem,
} from "../core/timeline/timeline-folder-grouping";
import {
	createNuiBasesContainer,
	applyTimelineBasesChrome,
	mountBasesTitle,
} from "../bases/bases-view-title";
import { resolveNoteCreateFolder } from "../bases/bases-view-topbar";
import { resolveTimelineLayoutFromEmbed, resolveEmbedResponsibilityFromEmbedAsync } from "../embed/embed-pipe-sync";
import { EMBED_PIPES_CHANGED_EVENT } from "../embed/embed-pipe-events";
import { TimelineItem } from "../core/models/timeline-item";
import { TaskItem } from "../core/tasks/types";
import {
	readNoteColor,
	setNoteColor,
} from "../editor/note-text-color";
import { openTextColorPicker } from "../editor/text-color-picker-modal";
import { DEFAULT_TEXT_COLOR } from "../editor/text-color-utils";
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
	private collapsedFolderHubIds = new Set<string>();
	private searchQuery = "";
	private trackedPaths = new Set<string>();
	private updateGeneration = 0;
	private suppressDataUpdate = false;
	private pendingRenameItemId: string | null = null;
	private pendingScrollToItemId: string | null = null;
	private createFollowUpInProgress = false;
	private createFollowUpRetryTimer: number | null = null;

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
		applyTimelineBasesChrome(this.containerEl, this.app);
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				const pending =
					this.pendingScrollToItemId ?? this.pendingRenameItemId;
				if (pending && file.path === pending) {
					this.onDataUpdated();
					return;
				}
				if (!this.trackedPaths.has(file.path)) return;
				this.onDataUpdated();
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				const pending =
					this.pendingScrollToItemId ?? this.pendingRenameItemId;
				if (pending && file.path === pending) {
					this.onDataUpdated();
				}
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
		const onEmbedPipesChanged = (): void => {
			this.onDataUpdated();
		};
		this.containerEl.addEventListener(
			EMBED_PIPES_CHANGED_EVENT,
			onEmbedPipesChanged,
		);
		this.register(() => {
			this.containerEl.removeEventListener(
				EMBED_PIPES_CHANGED_EVENT,
				onEmbedPipesChanged,
			);
			this.clearCreateFollowUpRetryTimer();
		});
	}

	onDataUpdated(): void {
		if (this.suppressDataUpdate) return;
		if (this.createFollowUpInProgress) return;
		void this.renderTimelineView();
	}

	private async renderTimelineView(): Promise<void> {
		if (isTimelineTitleEditing(this.containerEl)) return;

		const generation = ++this.updateGeneration;
		mountBasesTitle(this.app, this.containerEl, {
			viewName: this.config.name,
		});

		const allItems = this.withTimelineItemDisplay(
			groupTimelineItemsByFolder(
				entriesToTimelineItems(this.data.data, this.config, this.app),
			),
		);
		const responsibility = await resolveEmbedResponsibilityFromEmbedAsync(
			this.app,
			this.containerEl,
			this.config.name,
		);
		const responsibilityItems = responsibility
			? filterTimelineItemsByResponsibility(allItems, responsibility)
			: allItems;
		const searchedItems = filterTimelineItems(
			responsibilityItems,
			this.searchQuery,
		);
		const items = filterCollapsedFolderGroups(
			searchedItems,
			this.collapsedFolderHubIds,
		);
		const editable = this.isEditable();
		const rangeOverride = this.resolveRangeOverride();
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
					this.resolveRangeOverride() ??
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
			onMoveItemsToProjectFolder: (itemIds, targetFolderHubId) => {
				void this.moveItemsToProjectFolder(itemIds, targetFolderHubId);
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
			onSetItemColor: (ids) => {
				this.openItemsColorPicker(ids);
			},
			onItemRenamed: () => {
				this.onDataUpdated();
			},			groupedItems: searchedItems,
			collapsedFolderHubIds: this.collapsedFolderHubIds,
			onToggleFolderCollapse: (folderHubId) => {
				if (this.collapsedFolderHubIds.has(folderHubId)) {
					this.collapsedFolderHubIds.delete(folderHubId);
				} else {
					this.collapsedFolderHubIds.add(folderHubId);
				}
				this.onDataUpdated();
			},
			onDatesChange: editable
				? (item, start, end) => {
						void this.updateDates(item, start, end);
					}
				: undefined,
			onDatesBatchChange: editable
				? (updates) => {
						void this.updateDatesBatch(updates);
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

		this.schedulePendingCreateFollowUp();
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
		const fromPipe = resolveTimelineLayoutFromEmbed(
			this.app,
			this.containerEl,
		);
		if (fromPipe) return fromPipe;

		const isEmbedded = this.containerEl.closest(
			".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
		);
		if (isEmbedded) return "full";

		return parseTimelineLayoutMode(this.config.get("layout"));
	}

	private withTimelineItemDisplay(items: TimelineItem[]): TimelineItem[] {
		return items.map((item) => ({
			...item,
			responsibility: resolveResponsibilityForItem(this.app, item),
			color: resolveInheritedEventColor(this.app, item.id, item.color),
		}));
	}

	private resolveRangeOverride(): TimelineRange | undefined {
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

	private timelineItemsById(): Map<string, TimelineItem> {
		return new Map(
			entriesToTimelineItems(this.data.data, this.config, this.app).map(
				(entry) => [entry.id, entry],
			),
		);
	}

	private async updateDates(
		item: TimelineItem,
		start: Date,
		end: Date,
	): Promise<void> {
		await this.persistItemDates(item, start, end);

		if (isHubNoteItem(item.id)) return;

		const ancestorHubIds = ancestorFolderHubsOnTimeline(
			item.id,
			this.timelineItemsById(),
		);
		if (ancestorHubIds.length === 0) return;

		const startKey = item.startField;
		const endKey = item.endField;
		if (!startKey || !endKey) return;

		let childStart = start;
		let childEnd = end;

		for (const hubPath of ancestorHubIds) {
			const hubFile = this.app.vault.getAbstractFileByPath(hubPath);
			if (!(hubFile instanceof TFile)) continue;

			const frontmatter =
				this.app.metadataCache.getFileCache(hubFile)?.frontmatter ?? {};
			const hubStart = parseIsoDate(frontmatter[startKey]);
			if (!hubStart) continue;

			const hubEnd =
				parseIsoDate(frontmatter[endKey] ?? frontmatter[startKey]) ??
				hubStart;
			const safeHubEnd =
				hubEnd.getTime() < hubStart.getTime() ? hubStart : hubEnd;

			const expanded = datesExceedHubNote(
				childStart,
				childEnd,
				hubStart,
				safeHubEnd,
			);
			if (!expanded) continue;

			const hubItem: TimelineItem = {
				id: hubPath,
				title: hubFile.basename,
				start: hubStart,
				end: safeHubEnd,
				startField: startKey,
				endField: endKey,
			};
			await this.persistItemDates(hubItem, expanded.start, expanded.end);
			childStart = expanded.start;
			childEnd = expanded.end;
		}
	}

	private async updateDatesBatch(
		updates: Array<{ item: TimelineItem; start: Date; end: Date }>,
	): Promise<void> {
		if (updates.length === 0) return;

		this.suppressDataUpdate = true;
		try {
			await Promise.all(
				updates.map((update) =>
					this.persistItemDates(update.item, update.start, update.end),
				),
			);
		} finally {
			this.suppressDataUpdate = false;
		}
		this.onDataUpdated();
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
		const createdPath = await this.createNote(date);
		if (createdPath) {
			this.pendingRenameItemId = createdPath;
			this.pendingScrollToItemId = createdPath;
			this.onDataUpdated();
		}
	}

	private async createNote(date = new Date()): Promise<string | null> {
		const folder = resolveNoteCreateFolder(
			this.app,
			this.containerEl,
			this.config.name,
		);
		if (folder === null) {
			new Notice("Timeline: could not resolve folder for new note.");
			return null;
		}
		const startKey = this.resolveConfiguredFieldKey("startField", "Start Date");
		const endKey = this.resolveConfiguredFieldKey("endField", "End Date");
		const noteDate = formatIsoDate(date);
		const fileName = resolveUniqueNoteName(this.app, folder);
		const filePath = folder ? `${folder}/${fileName}` : fileName;

		try {
			const content = buildDatedNoteContent(startKey, endKey, noteDate);
			await this.app.vault.create(filePath, content);
			return filePath;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not create note";
			new Notice(`Timeline: ${message}`);
			return null;
		}
	}

	private schedulePendingCreateFollowUp(): void {
		if (!this.pendingScrollToItemId && !this.pendingRenameItemId) return;
		if (this.createFollowUpInProgress) return;

		this.clearCreateFollowUpRetryTimer();

		let attempts = 0;
		const maxAttempts = 40;

		const tick = (): void => {
			attempts += 1;
			const scrollItemId = this.pendingScrollToItemId;
			const renameItemId = this.pendingRenameItemId;
			const itemId = scrollItemId ?? renameItemId;

			if (!itemId) {
				this.clearCreateFollowUpRetryTimer();
				this.createFollowUpInProgress = false;
				return;
			}

			const row = this.containerEl.querySelector<HTMLElement>(
				`.nui-timeline-row[data-item-id="${CSS.escape(itemId)}"]`,
			);

			if (!row) {
				if (attempts < maxAttempts) {
					this.createFollowUpRetryTimer = window.setTimeout(tick, 50);
				} else {
					this.pendingScrollToItemId = null;
					this.pendingRenameItemId = null;
					this.clearCreateFollowUpRetryTimer();
					this.createFollowUpInProgress = false;
				}
				return;
			}

			this.clearCreateFollowUpRetryTimer();
			this.createFollowUpInProgress = true;

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const finishIfDone = (): void => {
						if (!this.pendingScrollToItemId && !this.pendingRenameItemId) {
							this.createFollowUpInProgress = false;
						}
					};

					const tryRename = (): void => {
						if (!renameItemId) {
							finishIfDone();
							return;
						}
						if (beginTimelineTitleRename(this.containerEl, renameItemId)) {
							this.pendingRenameItemId = null;
						}
						finishIfDone();
					};

					if (scrollItemId) {
						if (
							scrollTimelineRowToCenter(
								this.containerEl,
								scrollItemId,
								300,
								() => {
									this.pendingScrollToItemId = null;
									tryRename();
								},
							)
						) {
							return;
						}
						this.pendingScrollToItemId = null;
					}

					tryRename();
				});
			});
		};

		tick();
	}

	private clearCreateFollowUpRetryTimer(): void {
		if (this.createFollowUpRetryTimer === null) return;
		window.clearTimeout(this.createFollowUpRetryTimer);
		this.createFollowUpRetryTimer = null;
	}

	private openItem(item: TimelineItem): void {
		const file = this.app.vault.getAbstractFileByPath(item.id);
		if (!(file instanceof TFile)) return;

		void this.app.workspace.getLeaf(false).openFile(file);
	}

	private openItemsColorPicker(ids: string[]): void {
		const files = this.resolveFiles(ids);
		if (files.length === 0) return;

		const initial =
			readNoteColor(this.app, files[0]) ?? DEFAULT_TEXT_COLOR;

		openTextColorPicker(this.app, {
			mode: "property",
			initialColor: initial,
			onApply: async (color) => {
				for (const file of files) {
					await setNoteColor(this.app, file, color);
				}
			},
			onClear: async () => {
				for (const file of files) {
					await setNoteColor(this.app, file, null);
				}
			},
		});
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
		targetFolderHubId: string,
	): Promise<void> {
		const targetFile = this.app.vault.getAbstractFileByPath(targetFolderHubId);
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

