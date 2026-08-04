
import {
	BasesView,
	Notice,
	Platform,
	QueryController,
	TFolder,
	TFile,
} from "obsidian";
import {
	filesToHabitDaysForHabitFolder,
	resolveDateFieldKey,
} from "../bases/tracker-from-entries";
import { parseIsoDate } from "../core/parse/dates";
import { buildEmbedDayNote } from "../core/year-tracker/resolve-year-create-context";
import {
	formatDayNumber,
	formatTooltipDate,
	renderWeekTracker3,
} from "../core/week-tracker-3/render-week-tracker-3";
import {
	buildRollingDayGrid,
	buildScrollableWeekGrid,
	MOBILE_WEEK_TRACKER_DAY_COUNT,
	rollingDayDateKeys,
	scrollableWeekDateKeys,
	WeekTracker3Block,
} from "../core/week-tracker-3/week-grid";
import {
	clearEmbeddedBasesChrome,
	syncEmbeddedBasesChrome,
} from "../bases/embedded-bases-chrome";
import { createNuiBasesContainer, mountBasesTitle } from "../bases/bases-view-title";
import { createHabit } from "../habits/create-habit";
import {
	habitFolderPathInHost,
	listHabitRowsInHostFolder,
	listOwnFilesInHabitFolder,
} from "../habits/habit-bundle";
import {
	registerWeekTrackerView,
	unregisterWeekTrackerView,
} from "../habits/tracker-registry";
import { WEEK_TRACKER_3_BASES_VIEW_TYPE } from "../layouts/types";
import {
	findHostFileForElement,
	getFolderIndexPath,
	openFileInWorkspace,
	type FolderIndexOpener,
	type TrackerHostPlugin,
} from "../shared/host";
import { withFolderIndexCreateSuppressed } from "../navigation/folder-index-suppress";

export class WeekTracker3BasesView extends BasesView {
	readonly type = WEEK_TRACKER_3_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";
	private savedScrollLeft = 0;

	constructor(
		controller: QueryController,
		parentEl: HTMLElement,
		private plugin: TrackerHostPlugin,
	) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-tracker-bases-container",
		);
		registerWeekTrackerView(this);
	}

	refreshAfterHabitChange(): void {
		this.renderedSignature = "";
		this.onDataUpdated();
	}

	onDataUpdated(): void {
		const hostFolder = this.resolveHostFolder();
		const habitRows = listHabitRowsInHostFolder(this.app.vault, hostFolder);
		const dateFieldKey = resolveDateFieldKey(this.config);

		const weekBlocks = this.resolveWeekBlocks();
		const allowedDateKeys = this.resolveAllowedDateKeys();
		const folderPathByTag = new Map(habitRows.map((row) => [row.name, row.path]));
		const rows = habitRows.map((habitRow) => {
			const folder = this.app.vault.getAbstractFileByPath(habitRow.path);
			// Own files only: a host row must not absorb the day notes of habit
			// folders nested inside it, which are named after those habits.
			const files =
				folder instanceof TFolder
					? listOwnFilesInHabitFolder(this.app.vault, folder)
					: [];

			return {
				tag: habitRow.name,
				entriesByDate: filesToHabitDaysForHabitFolder(
					this.app,
					files,
					dateFieldKey,
					allowedDateKeys,
				),
			};
		});
		const signature = `${hostFolder}\n${habitRows.map((row) => row.path).join(",")}\n${this.entriesSignature(rows, weekBlocks)}`;

		mountBasesTitle(this.app, this.containerEl, { viewName: this.config.name });
		syncEmbeddedBasesChrome(this, this.containerEl, []);

		if (
			signature === this.renderedSignature &&
			this.containerEl.querySelector(".nui-week-tracker-3")
		) {
			return;
		}

		this.renderedSignature = signature;

		const existingScroll = this.containerEl.querySelector<HTMLElement>(
			".nui-week-tracker-3-scroll",
		);
		if (existingScroll) {
			this.savedScrollLeft = existingScroll.scrollLeft;
		}

		renderWeekTracker3(this.containerEl, {
			weekBlocks,
			rows,
			rollingDayCount: Platform.isMobile ? MOBILE_WEEK_TRACKER_DAY_COUNT : undefined,
			initialScrollLeft: this.savedScrollLeft,
			onScrollLeftChange: (scrollLeft) => {
				this.savedScrollLeft = scrollLeft;
			},
			onAddHabit: (anchorEl) => {
				void this.addHabit(anchorEl);
			},
			tagHost: {
				createTag: (parent, tag) => {
					const folderPath =
						folderPathByTag.get(tag) ?? habitFolderPathInHost(hostFolder, tag);
					const link = parent.createEl("a", {
						cls: "nui-week-tracker-3-tag-link",
						text: tag,
						href: "#",
					});
					link.title = folderPath;

					this.registerDomEvent(
						link,
						"click",
						(evt) => {
							if (evt.button !== 0 && evt.button !== 1) return;
							evt.preventDefault();
							evt.stopPropagation();
							evt.stopImmediatePropagation();
							void this.openTagFolder(folderPath, link, evt);
						},
						{ capture: true },
					);
				},
			},
			host: {
				createDay: (daysEl, cell, state, tag) => {
					const label = formatDayNumber(cell.date);
					const tooltip = formatTooltipDate(cell.date);
					const cellEl = daysEl.createDiv("nui-tracker-day-cell");
					cellEl.dataset.tag = tag;

					if (state.isDone) {
						const markEl = cellEl.createDiv({
							cls: "nui-tracker-day-mark is-done",
						});
						if (state.rating) {
							markEl.dataset.rating = String(state.rating);
						}
					} else if (state.isToday) {
						cellEl.createDiv({ cls: "nui-tracker-day-mark is-today" });
					}

					const labelClasses = ["nui-tracker-day-label"];
					if (state.isDone) labelClasses.push("is-done");
					if (state.isToday) labelClasses.push("is-today");

					const labelEl = cellEl.createSpan({
						cls: labelClasses.join(" "),
						text: label,
					});
					labelEl.setAttr("role", "button");
					labelEl.setAttr("tabindex", "0");
					labelEl.title = tooltip;
					labelEl.setAttr("aria-label", tooltip);
					labelEl.dataset.dateKey = cell.dateKey;
					labelEl.dataset.tag = tag;

					this.registerDomEvent(
						labelEl,
						"click",
						(evt) => {
							if (evt.button !== 0 && evt.button !== 1) return;
							evt.preventDefault();
							evt.stopPropagation();
							evt.stopImmediatePropagation();

							if (state.isDone && state.filePath) {
								const file = this.app.vault.getAbstractFileByPath(
									state.filePath,
								);
								if (file instanceof TFile) {
									void openFileInWorkspace(this.app, file, {
										anchorEl: labelEl,
										evt,
									});
								}
								return;
							}

							void this.createDayNote(hostFolder, cell.dateKey, tag, labelEl);
						},
						{ capture: true },
					);
				},
			},
		});
	}

	onunload(): void {
		unregisterWeekTrackerView(this);
		clearEmbeddedBasesChrome(this.containerEl);
	}

	private async addHabit(anchorEl: HTMLElement): Promise<void> {
		const hostFolder = this.resolveHostFolder();
		if (!hostFolder) {
			new Notice("Week Tracker: could not resolve host folder.");
			return;
		}

		const result = await createHabit(this.app, {
			calendarFolder: hostFolder,
		});
		if (!result) return;

		this.renderedSignature = "";
		await openFileInWorkspace(this.app, result.indexFile, { anchorEl });
	}

	private resolveWeekBlocks(): WeekTracker3Block[] {
		if (Platform.isMobile) {
			return buildRollingDayGrid(MOBILE_WEEK_TRACKER_DAY_COUNT);
		}
		return buildScrollableWeekGrid();
	}

	private resolveAllowedDateKeys(): Set<string> {
		if (Platform.isMobile) {
			return rollingDayDateKeys(MOBILE_WEEK_TRACKER_DAY_COUNT);
		}
		return scrollableWeekDateKeys();
	}

	private resolveHostFolder(): string {
		const hostFile = findHostFileForElement(this.app, this.containerEl);
		return hostFile?.parent?.path ?? "";
	}

	private getFolderIndexManager(): FolderIndexOpener | null {
		return this.plugin.folderIndexManager;
	}

	private async openTagFolder(
		folderPath: string,
		anchorEl: HTMLElement,
		evt: MouseEvent,
	): Promise<void> {
		const manager = this.getFolderIndexManager();
		if (manager && (await manager.openFolderIndex(folderPath))) {
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (folder instanceof TFolder) {
			const indexPath = getFolderIndexPath(folder);
			const indexFile = this.app.vault.getAbstractFileByPath(indexPath);
			if (indexFile instanceof TFile) {
				await openFileInWorkspace(this.app, indexFile, { anchorEl, evt });
				return;
			}
		}

		new Notice(`Folder not found: "${folderPath}".`);
	}

	private entriesSignature(
		rows: { tag: string; entriesByDate: Map<string, { filePath: string }> }[],
		weekBlocks: { cells: { dateKey: string }[] }[],
	): string {
		const weeks = weekBlocks
			.map((block) => block.cells.map((cell) => cell.dateKey).join(","))
			.join("|");
		const rowKeys = rows
			.map(
				(row) =>
					`${row.tag}:${[...row.entriesByDate.keys()].sort().join(",")}`,
			)
			.join("\n");
		return `${weeks}\n${rowKeys}`;
	}

	private async createDayNote(
		hostFolder: string,
		dateKey: string,
		habitName: string,
		anchorEl?: HTMLElement,
	): Promise<void> {
		const date = parseIsoDate(dateKey);
		if (!date) return;

		const habitRows = listHabitRowsInHostFolder(this.app.vault, hostFolder);
		const habitRow = habitRows.find((row) => row.name === habitName);
		if (!habitRow) {
			this.refreshAfterHabitChange();
			new Notice(`Week Tracker: habit folder not found for "${habitName}".`);
			return;
		}

		const folderPath = habitRow.path;
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		const files =
			folder instanceof TFolder
				? listOwnFilesInHabitFolder(this.app.vault, folder)
				: [];
		const allowedDateKeys = this.resolveAllowedDateKeys();
		const dateFieldKey = resolveDateFieldKey(this.config);
		const existing = filesToHabitDaysForHabitFolder(
			this.app,
			files,
			dateFieldKey,
			allowedDateKeys,
		).get(dateKey);
		if (existing) {
			const file = this.app.vault.getAbstractFileByPath(existing.filePath);
			if (file instanceof TFile) {
				void openFileInWorkspace(this.app, file, { anchorEl });
			}
			return;
		}

		if (!(folder instanceof TFolder)) {
			try {
				await withFolderIndexCreateSuppressed(async () => {
					await this.app.vault.createFolder(folderPath);
				});
			} catch {
				this.refreshAfterHabitChange();
				new Notice(`Folder not found: "${folderPath}".`);
				return;
			}
		}

		const resolvedFolder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!(resolvedFolder instanceof TFolder)) {
			this.refreshAfterHabitChange();
			new Notice(`Folder not found: "${folderPath}".`);
			return;
		}

		const inferred = buildEmbedDayNote(dateFieldKey, dateKey, habitName);
		const filePath = `${folderPath}/${inferred.fileName}`;

		const existingFile = this.app.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			await openFileInWorkspace(this.app, existingFile, { anchorEl });
			return;
		}

		try {
			const file = await this.app.vault.create(filePath, inferred.content);
			await openFileInWorkspace(this.app, file, { anchorEl });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Could not create note";
			new Notice(`Week Tracker: ${message}`);
		}
	}
}
