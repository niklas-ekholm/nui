
import { HabitDayEntry } from "../models/habit-day";
import {
	formatDayNumber,
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
	/** Restore horizontal scroll after re-render. */
	initialScrollLeft?: number;
	/** Called when the user scrolls the week strip. */
	onScrollLeftChange?: (scrollLeft: number) => void;
}

function renderWeekBlocksHeader(
	parent: HTMLElement,
	weekBlocks: WeekTracker3Block[],
	today: Date,
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
			const headEl = daysEl.createDiv("nui-week-tracker-3-day-head");
			headEl.dataset.dateKey = cell.dateKey;
			if (isSameDay(cell.date, today)) {
				headEl.dataset.isToday = "true";
			}
			headEl.createSpan({
				cls: "nui-week-tracker-3-weekday",
				text: formatWeekdayShort(cell.date),
			});
			headEl.createSpan({
				cls: "nui-week-tracker-3-date",
				text: formatDayNumber(cell.date),
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
	addBtn.addEventListener("click", (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		options.onAddHabit?.(addBtn);
	});
}

function getWeekTrackerScrollEl(grid: HTMLElement): HTMLElement | null {
	return grid.querySelector<HTMLElement>(".nui-week-tracker-3-scroll");
}

function isWeekTrackerScrolledToToday(
	scrollEl: HTMLElement,
	rolling: boolean,
): boolean {
	const target = rolling
		? initialScrollLeftForRollingEnd(scrollEl)
		: initialScrollLeftForCurrentWeek(scrollEl);
	return Math.abs(scrollEl.scrollLeft - target) < 2;
}

function syncWeekTrackerTodayButton(grid: HTMLElement, rolling: boolean): void {
	const scrollEl = getWeekTrackerScrollEl(grid);
	const todayBtn = grid.querySelector<HTMLElement>(".nui-week-tracker-3-today-btn");
	if (!scrollEl || !todayBtn) return;
	todayBtn.classList.toggle(
		"is-visible",
		!isWeekTrackerScrolledToToday(scrollEl, rolling),
	);
}

export function syncWeekTrackerTodayLine(grid: HTMLElement): void {
	const line = grid.querySelector<HTMLElement>(".nui-week-tracker-3-today-line");
	const body = grid.querySelector<HTMLElement>(".nui-week-tracker-3-body");
	const todayHead = grid.querySelector<HTMLElement>(
		'.nui-week-tracker-3-day-head[data-is-today="true"]',
	);
	if (!line || !body) return;

	if (!todayHead) {
		line.classList.add("is-hidden");
		return;
	}

	const bodyRect = body.getBoundingClientRect();
	const headRect = todayHead.getBoundingClientRect();
	const centerX = headRect.left + headRect.width / 2 - bodyRect.left;

	line.classList.remove("is-hidden");
	line.style.left = `${centerX}px`;
}

function syncWeekTrackerChrome(
	grid: HTMLElement,
	rolling: boolean,
): void {
	syncWeekTrackerTodayLine(grid);
	syncWeekTrackerTodayButton(grid, rolling);
}

function scrollWeekTrackerToToday(
	grid: HTMLElement,
	onScrollLeftChange?: (scrollLeft: number) => void,
): void {
	const scrollEl = getWeekTrackerScrollEl(grid);
	if (!scrollEl) return;

	const rolling = grid.classList.contains("nui-week-tracker-3--rolling");
	const target = rolling
		? initialScrollLeftForRollingEnd(scrollEl)
		: initialScrollLeftForCurrentWeek(scrollEl);
	scrollEl.scrollLeft = target;
	onScrollLeftChange?.(target);
	syncWeekTrackerChrome(grid, rolling);
}

function attachWeekTrackerScroll(
	grid: HTMLElement,
	options: Pick<
		WeekTracker3RenderOptions,
		"initialScrollLeft" | "onScrollLeftChange" | "rollingDayCount"
	>,
): void {
	const scrollEl = getWeekTrackerScrollEl(grid);
	if (!scrollEl) return;

	const rolling = !!options.rollingDayCount;

	const applyInitialScroll = () => {
		const resolvedInitial =
			options.initialScrollLeft && options.initialScrollLeft > 0
				? options.initialScrollLeft
				: rolling
					? initialScrollLeftForRollingEnd(scrollEl)
					: initialScrollLeftForCurrentWeek(scrollEl);
		scrollEl.scrollLeft = resolvedInitial;
		options.onScrollLeftChange?.(resolvedInitial);
		syncWeekTrackerChrome(grid, rolling);
	};

	requestAnimationFrame(applyInitialScroll);

	scrollEl.addEventListener(
		"scroll",
		() => {
			options.onScrollLeftChange?.(scrollEl.scrollLeft);
			syncWeekTrackerChrome(grid, rolling);
		},
		{ passive: true },
	);

	const scrollInner = scrollEl.querySelector<HTMLElement>(
		".nui-week-tracker-3-scroll-inner",
	);
	if (scrollInner) {
		const observer = new ResizeObserver(() => {
			syncWeekTrackerChrome(grid, rolling);
		});
		observer.observe(scrollInner);
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

/** Rolling mobile: today is the rightmost column. */
export function initialScrollLeftForRollingEnd(scrollEl: HTMLElement): number {
	return Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
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
	const scrollEl = layout.createDiv("nui-week-tracker-3-scroll");
	const scrollInner = scrollEl.createDiv("nui-week-tracker-3-scroll-inner");

	const header = scrollInner.createDiv("nui-week-tracker-3-header");
	renderWeekBlocksHeader(header, options.weekBlocks, today);

	const body = scrollInner.createDiv("nui-week-tracker-3-body");
	body.createDiv("nui-week-tracker-3-today-line");

	for (const row of options.rows) {
		const dataRow = body.createDiv("nui-week-tracker-3-data-row");
		options.tagHost.createTag(dataRow, row.tag);
		renderWeekBlocksDays(dataRow, options.weekBlocks, row, today, options.host);
	}

	attachWeekTrackerScroll(grid, options);
}

export { formatDayNumber };
