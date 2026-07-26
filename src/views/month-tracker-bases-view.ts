
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
	entriesToMonthDayEvents,
	MonthDayEvent,
	resolveDateFieldKey,
} from "../bases/tracker-from-entries";
import { parseIsoDate } from "../core/parse/dates";
import {
	buildContinuousWeekRows,
	resolveMonthTrackerScope,
} from "../core/month-tracker/month-grid";
import {
	formatDayNumber,
	formatTooltipDate,
	isCompactMonthTrackerView,
	renderMonthTracker,
} from "../core/month-tracker/render-month-tracker";
import {
	buildEmbedDayNote,
	resolveHabitNameFromHostFolder,
} from "../core/year-tracker/resolve-year-create-context";
import { parseYearFromFolderPath } from "../core/year-tracker/year-grid";
import {
	registerMonthTrackerView,
	unregisterMonthTrackerView,
} from "../habits/tracker-registry";
import {
	clearMountedBasesTitle,
	createNuiBasesContainer,
} from "../bases/bases-view-title";
import { resolveEmbedHostFolderPath } from "../bases/bases-view-topbar";
import { MONTH_TRACKER_BASES_VIEW_TYPE } from "../layouts/types";
import { openFileInWorkspace, findHostFileForElement } from "../navigation/folder-index";
import { withFolderIndexCreateSuppressed } from "../navigation/folder-index-suppress";

export class MonthTrackerBasesView extends BasesView {
	readonly type = MONTH_TRACKER_BASES_VIEW_TYPE;
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
		registerMonthTrackerView(this);
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
		unregisterMonthTrackerView(this);
	}

	onDataUpdated(): void {
		const scope = this.resolveScope();
		const layout = isCompactMonthTrackerView(this.config.name)
			? "compact"
			: "events";
		const habitName = this.resolveHabitName();
		const entriesByDate = entriesToHabitDays(
			this.data.data,
			this.config,
			scope.year,
		);
		const eventsByDate = entriesToMonthDayEvents(
			this.data.data,
			this.config,
			scope.year,
		);
		const signature = this.entriesSignature(
			layout,
			entriesByDate,
			eventsByDate,
			scope.year,
			scope.monthIndices,
			habitName,
		);

		if (
			signature === this.renderedSignature &&
			this.containerEl.querySelector(".nui-month-tracker-root")
		) {
			return;
		}

		clearMountedBasesTitle(this.containerEl);
		this.renderedSignature = signature;
		const weekRows = buildContinuousWeekRows(scope.year, scope.monthIndices);

		renderMonthTracker(this.containerEl, {
			year: scope.year,
			layout,
			weekRows,
			entriesByDate,
			eventsByDate,
			compactHost: {
				createEmptyDay: (daysEl) => {
					daysEl.createDiv({ cls: "nui-tracker-day-cell is-empty" });
				},
				createCompactDay: (daysEl, cell, state) => {
					this.renderCompactDay(daysEl, cell, state);
				},
			},
			eventsHost: {
				createEmptyDay: (daysEl) => {
					daysEl.createDiv({ cls: "nui-tracker-day-cell is-empty" });
				},
				createEventsDay: (daysEl, cell, state) => {
					this.renderEventsDay(daysEl, cell, state);
				},
			},
		});
	}

	private renderCompactDay(
		daysEl: HTMLElement,
		cell: { date: Date; dateKey: string },
		state: {
			isDone: boolean;
			isToday: boolean;
			filePath?: string;
			rating?: number;
		},
	): void {
		const label = formatDayNumber(cell.date);
		const tooltip = formatTooltipDate(cell.date);
		const cellEl = daysEl.createDiv("nui-tracker-day-cell");

		if (state.isDone) {
			const markEl = cellEl.createDiv({ cls: "nui-tracker-day-mark is-done" });
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

		this.registerDomEvent(
			labelEl,
			"click",
			(evt) => {
				if (evt.button !== 0 && evt.button !== 1) return;
				evt.preventDefault();
				evt.stopPropagation();
				evt.stopImmediatePropagation();

				if (state.isDone && state.filePath) {
					const file = this.app.vault.getAbstractFileByPath(state.filePath);
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
	}

	private renderEventsDay(
		daysEl: HTMLElement,
		cell: { date: Date; dateKey: string },
		state: { isToday: boolean; events: MonthDayEvent[] },
	): void {
		const label = formatDayNumber(cell.date);
		const tooltip = formatTooltipDate(cell.date);
		const cellEl = daysEl.createDiv("nui-tracker-day-cell");
		const rowEl = cellEl.createDiv("nui-month-tracker-day-row");
		const numberEl = rowEl.createDiv("nui-month-tracker-day-number");

		if (state.isToday) {
			numberEl.createDiv({ cls: "nui-tracker-day-mark is-today" });
		}

		const labelClasses = ["nui-tracker-day-label"];
		if (state.isToday) labelClasses.push("is-today");

		const labelEl = numberEl.createSpan({
			cls: labelClasses.join(" "),
			text: label,
		});
		labelEl.setAttr("role", "button");
		labelEl.setAttr("tabindex", "0");
		labelEl.title = tooltip;
		labelEl.setAttr("aria-label", tooltip);
		labelEl.dataset.dateKey = cell.dateKey;

		if (state.events.length === 0) {
			this.registerDomEvent(
				labelEl,
				"click",
				(evt) => {
					if (evt.button !== 0 && evt.button !== 1) return;
					evt.preventDefault();
					evt.stopPropagation();
					evt.stopImmediatePropagation();
					void this.createDayNote(cell.dateKey, labelEl);
				},
				{ capture: true },
			);
			return;
		}

		const eventsEl = rowEl.createDiv("nui-month-tracker-events");
		const maxVisible = 5;
		const visibleEvents = state.events.slice(0, maxVisible);
		const hasOverflow = state.events.length > maxVisible;

		visibleEvents.forEach((event, index) => {
			const pillEl = eventsEl.createSpan({
				cls: "nui-month-tracker-event-pill",
			});
			pillEl.setAttr("role", "button");
			pillEl.setAttr("tabindex", "0");
			pillEl.title = event.title;
			pillEl.setAttr("aria-label", event.title);

			const dotEl = pillEl.createSpan({
				cls: "nui-month-tracker-event-dot",
			});
			if (event.rating) {
				dotEl.dataset.rating = String(event.rating);
			}

			pillEl.createSpan({
				cls: "nui-month-tracker-event-title",
				text: event.title,
			});

			if (hasOverflow && index === visibleEvents.length - 1) {
				pillEl.createSpan({
					cls: "nui-month-tracker-event-more",
					text: "…",
				});
			}

			this.registerDomEvent(
				pillEl,
				"click",
				(evt) => {
					if (evt.button !== 0 && evt.button !== 1) return;
					evt.preventDefault();
					evt.stopPropagation();
					evt.stopImmediatePropagation();

					const file = this.app.vault.getAbstractFileByPath(event.filePath);
					if (file instanceof TFile) {
						void openFileInWorkspace(this.app, file, {
							anchorEl: pillEl,
							evt,
						});
					}
				},
				{ capture: true },
			);
		});
	}

	private entriesSignature(
		layout: "compact" | "events",
		entriesByDate: Map<string, HabitDayEntry>,
		eventsByDate: Map<string, MonthDayEvent[]>,
		year: number,
		monthIndices: number[],
		habitName: string,
	): string {
		const months = monthIndices.join(",");
		if (layout === "compact") {
			const keys = [...entriesByDate.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, entry]) => `${key}:${entry.filePath}`)
				.join("\n");
			return `compact\n${year}\n${months}\n${habitName}\n${keys}`;
		}

		const keys = [...eventsByDate.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.flatMap(([dateKey, events]) =>
				events.map(
					(event) =>
						`${dateKey}:${event.filePath}:${event.title}:${event.rating ?? ""}`,
				),
			)
			.join("\n");
		return `events\n${year}\n${months}\n${habitName}\n${keys}`;
	}

	private resolveScope() {
		const hostFolder = this.resolveHostHabitFolderPath();
		const hostFolderYear = hostFolder
			? parseYearFromFolderPath(hostFolder)
			: null;

		return resolveMonthTrackerScope(
			this.config.name,
			this.config.get("year"),
			hostFolderYear,
		);
	}

	private async createDayNote(
		dateKey: string,
		anchorEl?: HTMLElement,
	): Promise<void> {
		const date = parseIsoDate(dateKey);
		if (!date) return;

		const { year } = this.resolveScope();
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
			new Notice("Month Tracker: could not resolve folder for new note.");
			return;
		}

		const folder = this.app.vault.getAbstractFileByPath(folderPath);
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
			new Notice(`Month Tracker: ${message}`);
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
}
