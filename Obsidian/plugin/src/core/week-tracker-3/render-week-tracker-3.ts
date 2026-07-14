
import { HabitDayEntry } from "../models/habit-day";
import {
	formatDayNumber,
	formatTooltipDate,
	isSameDay,
	todayStart,
} from "../year-tracker/year-grid";
import {
	formatWeekdayShort,
	WeekTracker3Block,
	WeekTracker3Cell,
} from "./week-grid";
import { findAdoptedBasesTitle } from "../../bases/bases-view-title";

export interface WeekTracker3Row {
	tag: string;
	entriesByDate: Map<string, HabitDayEntry>;
}

export interface WeekTracker3DayHost {
	createDay(
		daysEl: HTMLElement,
		cell: WeekTracker3Cell,
		state: { isDone: boolean; isToday: boolean; filePath?: string },
		tag: string,
	): void;
}

export interface WeekTracker3TagHost {
	createTag(parent: HTMLElement, tag: string): void;
}

export interface WeekTracker3RenderOptions {
	weekBlocks: WeekTracker3Block[];
	rows: WeekTracker3Row[];
	host: WeekTracker3DayHost;
	tagHost: WeekTracker3TagHost;
	onAddHabit?: (anchorEl: HTMLElement) => void;
	/** Single row of N days (mobile rolling window). */
	rollingDayCount?: number;
}

function renderWeekBlocksHeader(
	parent: HTMLElement,
	weekBlocks: WeekTracker3Block[],
): void {
	const blocksEl = parent.createDiv("nui-week-tracker-3-blocks");
	for (const block of weekBlocks) {
		const blockEl = blocksEl.createDiv("nui-week-tracker-3-block");
		blockEl.dataset.week = block.id;
		const daysEl = blockEl.createDiv("nui-week-tracker-3-days");
		for (const cell of block.cells) {
			daysEl.createDiv({
				cls: "nui-week-tracker-3-weekday-label",
				text: formatWeekdayShort(cell.date),
			});
		}
	}
}

function renderWeekBlocksDays(
	parent: HTMLElement,
	weekBlocks: WeekTracker3Block[],
	row: WeekTracker3Row,
	today: Date,
	host: WeekTracker3DayHost,
): void {
	const blocksEl = parent.createDiv("nui-week-tracker-3-blocks");
	for (const block of weekBlocks) {
		const blockEl = blocksEl.createDiv("nui-week-tracker-3-block");
		blockEl.dataset.week = block.id;
		const daysEl = blockEl.createDiv("nui-week-tracker-3-days");
		daysEl.dataset.tag = row.tag;

		for (const cell of block.cells) {
			const entry = row.entriesByDate.get(cell.dateKey);
			host.createDay(daysEl, cell, {
				isDone: !!entry,
				isToday: isSameDay(cell.date, today),
				filePath: entry?.filePath,
			}, row.tag);
		}
	}
}

function renderWeekTrackerTopbar(
	grid: HTMLElement,
	adoptedTitle: HTMLElement | null,
	options: WeekTracker3RenderOptions,
): void {
	if (!adoptedTitle && !options.onAddHabit) return;

	const topbar = grid.createDiv("nui-week-tracker-3-topbar");
	const titleSlot = topbar.createDiv("nui-week-tracker-3-topbar-title");
	if (adoptedTitle) {
		titleSlot.appendChild(adoptedTitle);
	}

	if (!options.onAddHabit) return;

	const addBtn = topbar.createSpan({
		cls: "nui-week-tracker-3-add",
		text: "+",
	});
	addBtn.setAttr("role", "button");
	addBtn.setAttr("tabindex", "0");
	addBtn.title = "Add habit";
	addBtn.setAttr("aria-label", "Add habit");
	addBtn.addEventListener("click", (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		options.onAddHabit?.(addBtn);
	});
}

export function renderWeekTracker3(
	container: HTMLElement,
	options: WeekTracker3RenderOptions,
): void {
	const adoptedTitle = findAdoptedBasesTitle(container);
	const gridRoot = container.querySelector(".nui-week-tracker-3");
	if (gridRoot) {
		gridRoot.remove();
	} else {
		container.empty();
		container.classList.add("nui-tracker");
	}

	const today = todayStart();
	const grid = container.createDiv("nui-week-tracker-3");
	if (options.rollingDayCount) {
		grid.classList.add("nui-week-tracker-3--rolling");
		grid.style.setProperty(
			"--n-week-tracker-rolling-days",
			String(options.rollingDayCount),
		);
	}
	renderWeekTrackerTopbar(grid, adoptedTitle, options);
	const layout = grid.createDiv("nui-week-tracker-3-layout");

	layout.createDiv({ cls: "nui-week-tracker-3-tag-spacer" });
	const headerRow = layout.createDiv("nui-week-tracker-3-header");
	renderWeekBlocksHeader(headerRow, options.weekBlocks);

	for (const row of options.rows) {
		options.tagHost.createTag(layout, row.tag);
		const dataRow = layout.createDiv("nui-week-tracker-3-data-row");
		renderWeekBlocksDays(dataRow, options.weekBlocks, row, today, options.host);
	}
}

export { formatDayNumber, formatTooltipDate };

