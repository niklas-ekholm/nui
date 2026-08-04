
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
		state: {
			isDone: boolean;
			isToday: boolean;
			filePath?: string;
			rating?: number;
		},
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
	/** Restore horizontal scroll after re-render (desktop week strip). */
	initialScrollLeft?: number;
	/** Called when the user scrolls the week strip. */
	onScrollLeftChange?: (scrollLeft: number) => void;
}

function renderWeekBlocksHeader(
	parent: HTMLElement,
	weekBlocks: WeekTracker3Block[],
): void {
	const blocksEl = parent.createDiv("nui-week-tracker-3-blocks");
	for (const block of weekBlocks) {
		const blockEl = blocksEl.createDiv("nui-week-tracker-3-block");
		blockEl.dataset.week = block.id;
		if (block.weekOffset !== undefined) {
			blockEl.dataset.weekOffset = String(block.weekOffset);
		}
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
		if (block.weekOffset !== undefined) {
			blockEl.dataset.weekOffset = String(block.weekOffset);
		}
		const daysEl = blockEl.createDiv("nui-week-tracker-3-days");
		daysEl.dataset.tag = row.tag;

		for (const cell of block.cells) {
			const entry = row.entriesByDate.get(cell.dateKey);
			host.createDay(daysEl, cell, {
				isDone: !!entry,
				isToday: isSameDay(cell.date, today),
				filePath: entry?.filePath,
				rating: entry?.rating,
			}, row.tag);
		}
	}
}

function renderWeekTrackerTopbar(
	grid: HTMLElement,
	adoptedTitle: HTMLElement | null,
	options: WeekTracker3RenderOptions,
): void {
	const showTodayButton = !options.rollingDayCount;
	if (!adoptedTitle && !options.onAddHabit && !showTodayButton) return;

	const topbar = grid.createDiv("nui-week-tracker-3-topbar");
	const titleSlot = topbar.createDiv("nui-week-tracker-3-topbar-title");
	if (adoptedTitle) {
		titleSlot.appendChild(adoptedTitle);
	}

	if (!showTodayButton && !options.onAddHabit) return;

	const controls = topbar.createDiv("nui-week-tracker-3-topbar-controls");

	if (showTodayButton) {
		const todayBtn = controls.createEl("button", {
			type: "button",
			cls: "nui-week-tracker-3-today-btn",
			text: "Today",
		});
		todayBtn.title = "Scroll to the current week";
		todayBtn.addEventListener("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			scrollWeekTrackerToToday(grid, options.onScrollLeftChange);
		});
	}

	if (!options.onAddHabit) return;

	const addBtn = controls.createSpan({
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

function isWeekTrackerScrolledToToday(scrollEl: HTMLElement): boolean {
	const target = initialScrollLeftForCurrentWeek(scrollEl);
	return Math.abs(scrollEl.scrollLeft - target) < 2;
}

function syncWeekTrackerTodayButton(grid: HTMLElement): void {
	const scrollEl = grid.querySelector<HTMLElement>(".nui-week-tracker-3-scroll");
	const todayBtn = grid.querySelector<HTMLElement>(".nui-week-tracker-3-today-btn");
	if (!scrollEl || !todayBtn) return;
	todayBtn.classList.toggle(
		"is-visible",
		!isWeekTrackerScrolledToToday(scrollEl),
	);
}

function scrollWeekTrackerToToday(
	grid: HTMLElement,
	onScrollLeftChange?: (scrollLeft: number) => void,
): void {
	const scrollEls = Array.from(
		grid.querySelectorAll<HTMLElement>(".nui-week-tracker-3-scroll"),
	);
	if (!scrollEls.length) return;

	const target = initialScrollLeftForCurrentWeek(scrollEls[0]);
	for (const el of scrollEls) {
		el.scrollLeft = target;
	}
	onScrollLeftChange?.(target);
	syncWeekTrackerTodayButton(grid);
}

function attachWeekTrackerScrollSync(
	grid: HTMLElement,
	options: Pick<WeekTracker3RenderOptions, "initialScrollLeft" | "onScrollLeftChange">,
): void {
	const scrollEls = Array.from(
		grid.querySelectorAll<HTMLElement>(".nui-week-tracker-3-scroll"),
	);
	if (!scrollEls.length) return;

	let syncing = false;
	const applyScrollLeft = (scrollLeft: number) => {
		syncing = true;
		for (const el of scrollEls) {
			el.scrollLeft = scrollLeft;
		}
		syncing = false;
	};

	requestAnimationFrame(() => {
		const resolvedInitial =
			options.initialScrollLeft && options.initialScrollLeft > 0
				? options.initialScrollLeft
				: initialScrollLeftForCurrentWeek(scrollEls[0]);
		applyScrollLeft(resolvedInitial);
		options.onScrollLeftChange?.(resolvedInitial);
		syncWeekTrackerTodayButton(grid);
	});

	for (const el of scrollEls) {
		el.addEventListener(
			"scroll",
			() => {
				if (syncing) return;
				const { scrollLeft } = el;
				syncing = true;
				for (const other of scrollEls) {
					if (other !== el) other.scrollLeft = scrollLeft;
				}
				syncing = false;
				options.onScrollLeftChange?.(scrollLeft);
				syncWeekTrackerTodayButton(grid);
			},
			{ passive: true },
		);
	}
}

/** Scroll so the current week sits at the right edge (two prior weeks visible). */
export function initialScrollLeftForCurrentWeek(
	scrollEl: HTMLElement,
): number {
	const currentBlock = scrollEl.querySelector<HTMLElement>(
		'.nui-week-tracker-3-block[data-week-offset="0"]',
	);
	if (!currentBlock) return 0;

	const target =
		currentBlock.offsetLeft +
		currentBlock.offsetWidth -
		scrollEl.clientWidth;
	return Math.max(0, target);
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
	} else {
		grid.style.setProperty(
			"--n-week-tracker-3-week-count",
			String(options.weekBlocks.length),
		);
	}
	renderWeekTrackerTopbar(grid, adoptedTitle, options);
	const layout = grid.createDiv("nui-week-tracker-3-layout");

	layout.createDiv({ cls: "nui-week-tracker-3-tag-spacer" });
	const headerRow = layout.createDiv("nui-week-tracker-3-header");
	const headerScroll = headerRow.createDiv("nui-week-tracker-3-scroll");
	renderWeekBlocksHeader(headerScroll, options.weekBlocks);

	for (const row of options.rows) {
		options.tagHost.createTag(layout, row.tag);
		const dataRow = layout.createDiv("nui-week-tracker-3-data-row");
		const rowScroll = dataRow.createDiv("nui-week-tracker-3-scroll");
		renderWeekBlocksDays(
			rowScroll,
			options.weekBlocks,
			row,
			today,
			options.host,
		);
	}

	if (!options.rollingDayCount) {
		attachWeekTrackerScrollSync(grid, options);
	}
}

export { formatDayNumber, formatTooltipDate };

