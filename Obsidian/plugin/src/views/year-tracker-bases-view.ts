
import {
	BasesView,
	Notice,
	Plugin,
	QueryController,
	TFile,
	TFolder,
} from "obsidian";
import { HabitDayEntry } from "../core/models/habit-day";
import {
	entriesToHabitDays,
	resolveDateFieldKey,
} from "../bases/tracker-from-entries";
import { parseIsoDate } from "../core/parse/dates";
import {
	formatDayNumber,
	formatTooltipDate,
	renderYearTracker,
} from "../core/year-tracker/render-year-tracker";
import {
	buildEmbedDayNote,
	resolveHabitNameFromHostFolder,
} from "../core/year-tracker/resolve-year-create-context";
import {
	buildYearGrid,
	parseYear,
	parseYearFromFolderBasename,
	parseYearFromFolderPath,
} from "../core/year-tracker/year-grid";
import {
	registerYearTrackerView,
	unregisterYearTrackerView,
} from "../habits/tracker-registry";
import {
	clearMountedBasesTitle,
	createNuiBasesContainer,
} from "../bases/bases-view-title";
import { resolveEmbedHostFolderPath } from "../bases/bases-view-topbar";
import { YEAR_TRACKER_BASES_VIEW_TYPE } from "../layouts/types";
import { openFileInWorkspace, findHostFileForElement } from "../navigation/folder-index";

export class YearTrackerBasesView extends BasesView {
	readonly type = YEAR_TRACKER_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";

	constructor(
		controller: QueryController,
		parentEl: HTMLElement,
		private plugin: Plugin,
	) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-tracker-bases-container",
		);
		registerYearTrackerView(this);
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file.extension === "base") {
					this.refreshAfterHabitChange();
				}
			}),
		);
	}

	refreshAfterHabitChange(): void {
		this.renderedSignature = "";
		this.onDataUpdated();
	}

	onunload(): void {
		unregisterYearTrackerView(this);
	}

	onDataUpdated(): void {
		const year = this.resolveYear();
		const habitName = this.resolveHabitName();
		const entriesByDate = entriesToHabitDays(this.data.data, this.config, year);
		const signature = this.entriesSignature(entriesByDate, year, habitName);

		if (
			signature === this.renderedSignature &&
			this.containerEl.querySelector(".nui-year-tracker-root")
		) {
			return;
		}

		clearMountedBasesTitle(this.containerEl);
		this.renderedSignature = signature;
		const months = buildYearGrid(year);

		renderYearTracker(this.containerEl, {
			year,
			months,
			entriesByDate,
			host: {
				createEmptyDay: (daysEl) => {
					daysEl.createDiv({ cls: "nui-tracker-day-cell is-empty" });
				},
				createDay: (daysEl, cell, state) => {
					const label = formatDayNumber(cell.date);
					const tooltip = formatTooltipDate(cell.date);
					const cellEl = daysEl.createDiv("nui-tracker-day-cell");

					if (state.isDone) {
						cellEl.createDiv({ cls: "nui-tracker-day-mark is-done" });
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

							void this.createDayNote(cell.dateKey, labelEl);
						},
						{ capture: true },
					);
				},
			},
		});
	}

	private entriesSignature(
		entriesByDate: Map<string, HabitDayEntry>,
		year: number,
		habitName: string,
	): string {
		const keys = [...entriesByDate.keys()].sort().join("\n");
		return `${year}\n${habitName}\n${keys}`;
	}

	private async createDayNote(
		dateKey: string,
		anchorEl?: HTMLElement,
	): Promise<void> {
		const date = parseIsoDate(dateKey);
		if (!date) return;

		const year = this.resolveYear();
		const existing = entriesToHabitDays(
			this.data.data,
			this.config,
			year,
		).get(dateKey);
		if (existing) {
			const file = this.app.vault.getAbstractFileByPath(existing.filePath);
			if (file instanceof TFile) {
				void openFileInWorkspace(this.app, file, { anchorEl });
			}
			return;
		}

		const folderPath = this.resolveDayNoteFolder(anchorEl);
		const folderLabel = folderPath
			? resolveHabitNameFromHostFolder(folderPath)
			: null;
		if (!folderPath || !folderLabel) {
			new Notice("Year Tracker: could not resolve folder for new note.");
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!(folder instanceof TFolder)) {
			try {
				await this.app.vault.createFolder(folderPath);
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

		const dateField = resolveDateFieldKey(this.config);
		const inferred = buildEmbedDayNote(dateField, dateKey, folderLabel);
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
			new Notice(`Year Tracker: ${message}`);
		}
	}

	private resolveDayNoteFolder(anchorEl?: HTMLElement): string | null {
		const embedFolder = resolveEmbedHostFolderPath(
			this.app,
			anchorEl ?? this.containerEl,
		);
		if (embedFolder !== null) return embedFolder;

		return this.resolveHostHabitFolderPath(anchorEl);
	}

	private resolveHostHabitFolderPath(anchorEl?: HTMLElement): string | null {
		for (const el of [anchorEl, this.containerEl]) {
			if (!el) continue;
			const hostFile = findHostFileForElement(this.app, el);
			if (hostFile?.parent) return hostFile.parent.path;
		}

		const sample = this.data.data[0]?.file.path;
		if (!sample) {
			return null;
		}

		const parts = sample.split("/");
		parts.pop();
		return parts.join("/");
	}

	private resolveHabitFolderPath(anchorEl?: HTMLElement): string | null {
		const hostFolder = this.resolveHostHabitFolderPath(anchorEl);
		if (!hostFolder) {
			return null;
		}

		if (parseYearFromFolderPath(hostFolder) !== null) {
			const parts = hostFolder.split("/").filter(Boolean);
			parts.pop();
			return parts.join("/");
		}

		return hostFolder;
	}

	private resolveHabitName(anchorEl?: HTMLElement): string {
		const folderPath = this.resolveHabitFolderPath(anchorEl);
		if (folderPath) {
			return resolveHabitNameFromHostFolder(folderPath) ?? "";
		}
		return "";
	}

	private resolveYear(): number {
		const fromViewName = parseYearFromFolderBasename(this.config.name);
		if (fromViewName !== null) {
			return fromViewName;
		}

		const configured = this.config.get("year");
		if (
			(typeof configured === "number" && Number.isInteger(configured)) ||
			(typeof configured === "string" && /^\d{4}$/.test(configured.trim()))
		) {
			return parseYear(configured);
		}

		const hostFolder = this.resolveHostHabitFolderPath();
		if (hostFolder) {
			const fromFolder = parseYearFromFolderPath(hostFolder);
			if (fromFolder !== null) {
				return fromFolder;
			}
		}

		return new Date().getFullYear();
	}
}
