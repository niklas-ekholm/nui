
import { Menu, Platform, setIcon, App, TFile } from "obsidian";
import { addDays, dateRangesOverlap, daysBetween, formatDisplayDate, formatIsoDate, shiftRangeStartToDate, startOfDay } from "../parse/dates";
import { TimelineItem } from "../models/timeline-item";
import { TaskItem } from "../tasks/types";
import { renderInlineTaskRows } from "../task-list/render-task-list";
import { attachBarDrag } from "./bar-drag";
import {
	buildTimelineTicks,
	chooseGranularity,
	TIMELINE_MAIN_AXIS_HEIGHT,
	TimelineTick,
} from "./timeline-scale";
import { syncTimelineAxis } from "./timeline-axis";
import {
	applyTimelineRowSizeStyles,
	DEFAULT_TIMELINE_ROW_SIZE,
	TIMELINE_TRACK_HEIGHT,
	TimelineRange,
	formatTimelineRowSize,
	TimelineLayoutMode,
	TimelineTimespan,
	TIMELINE_TIMESPAN_OPTIONS,
	formatTimelineTimespanShort,
	timelineLayoutClass,
} from "../../timeline/types";
import {
	attachTimelineViewport,
	createScrubControl,
} from "./timeline-viewport";
import { attachTimelineSelection } from "./timeline-selection";
import { bindTimelineTitleRename } from "./timeline-title-rename";
import { animateRowTransitions, snapshotRowPositions } from "./row-transition";
import { applyBarGeometry } from "./bar-geometry";
import { findBasesRoot } from "../../bases/bases-view-title";
import {
	hasMultipleProjectFolders,
} from "./project-label";
import { isSuperprojectItem, superprojectIdForGroupedItem, superprojectHasSubprojects } from "./superproject";

export interface TimelineLayout {
	rangeStart: Date;
	rangeEnd: Date;
	totalDays: number;
	granularity: ReturnType<typeof chooseGranularity>;
	ticks: TimelineTick[];
	todayOffset: number | null;
	rows: TimelineRow[];
}

export type { TimelineTick };

export interface TimelineRow {
	item: TimelineItem;
	leftPercent: number;
	widthPercent: number;
}

const AXIS_HEIGHT = TIMELINE_MAIN_AXIS_HEIGHT;
const PADDING_DAYS = 2;

export function computeDefaultTimelineRange(items: TimelineItem[]): TimelineRange {
	let rangeStart = items[0].start;
	let rangeEnd = items[0].end;

	for (const item of items) {
		if (item.start < rangeStart) rangeStart = item.start;
		if (item.end > rangeEnd) rangeEnd = item.end;
	}

	return {
		start: addDays(rangeStart, -PADDING_DAYS),
		end: addDays(rangeEnd, PADDING_DAYS),
	};
}

export function buildTimelineLayout(
	items: TimelineItem[],
	today: Date = new Date(),
	rangeOverride?: TimelineRange,
): TimelineLayout | null {
	if (items.length === 0 && !rangeOverride) return null;

	const defaultRange =
		items.length > 0
			? computeDefaultTimelineRange(items)
			: rangeOverride!;
	const rangeStart = rangeOverride?.start ?? defaultRange.start;
	const rangeEnd = rangeOverride?.end ?? defaultRange.end;
	const visibleItems = items.filter((item) =>
		dateRangesOverlap(item.start, item.end, rangeStart, rangeEnd),
	);
	const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd));

	const rows = visibleItems.map((item) => {
		const startOffset = daysBetween(rangeStart, item.start);
		const span = Math.max(1, daysBetween(item.start, item.end) + 1);
		return {
			item,
			leftPercent: (startOffset / totalDays) * 100,
			widthPercent: (span / totalDays) * 100,
		};
	});

	const granularity = chooseGranularity(totalDays);
	const ticks = buildTimelineTicks(
		rangeStart,
		rangeEnd,
		totalDays,
	);

	const todayStart = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	const todayOffsetDays = daysBetween(rangeStart, todayStart);
	const todayOffset =
		todayOffsetDays >= 0 && todayOffsetDays <= totalDays
			? (todayOffsetDays / totalDays) * 100
			: null;

	return {
		rangeStart,
		rangeEnd,
		totalDays,
		granularity,
		ticks,
		todayOffset,
		rows,
	};
}

export interface RenderTimelineOptions {
	layout?: TimelineLayoutMode;
	onItemClick?: (item: TimelineItem) => void;
	onDatesChange?: (item: TimelineItem, start: Date, end: Date) => void;
	editable?: boolean;
	emptyMessage?: string;
	timespan?: TimelineTimespan;
	onTimespanChange?: (timespan: TimelineTimespan) => void;
	rowSize?: number;
	onRowSizeChange?: (rowSize: number) => void;
	rangeOverride?: TimelineRange;
	onRangePreview?: (start: Date, end: Date) => void;
	onRangeChange?: (start: Date, end: Date) => void;
	onRangeRestoreDefault?: () => void;
	onCreateNote?: () => void;
	onCreateNoteAtDate?: (date: Date) => void;
	searchQuery?: string;
	onSearchChange?: (query: string) => void;
	selectedIds?: Set<string>;
	onSelectionChange?: (ids: Set<string>) => void;
	onDeleteItems?: (ids: string[]) => void;
	onDuplicateItems?: (ids: string[]) => void;
	onTurnIntoProjectFolder?: (ids: string[]) => void;
	onMoveItemsToProjectFolder?: (
		itemIds: string[],
		targetSuperprojectId: string,
	) => void;
	onMoveOutOfProjectFolder?: (ids: string[]) => void;
	canMoveOutOfProjectFolder?: (ids: string[]) => boolean;
	onRenameItem?: (itemId: string) => void;
	onItemRenamed?: () => void;
	groupedItems?: TimelineItem[];
	collapsedSuperprojectIds?: Set<string>;
	onToggleSuperprojectCollapse?: (superprojectId: string) => void;
	app?: App;
	tasksByFilePath?: Map<string, TaskItem[]>;
	onTaskToggle?: () => void;
}

function clearElement(element: HTMLElement): void {
	element.replaceChildren();
}

function el(
	tag: string,
	className?: string,
	text?: string,
): HTMLElement {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function findAdoptedBasesTitle(container: HTMLElement): HTMLElement | null {
	const basesView = findBasesRoot(container);
	if (!basesView) return null;
	return basesView.querySelector<HTMLElement>(".nui-bases-view-title");
}

export function renderTimeline(
	container: HTMLElement,
	items: TimelineItem[],
	options: RenderTimelineOptions = {},
): void {
	const previousRowPositions = snapshotRowPositions(container);
	const adoptedTitle = findAdoptedBasesTitle(container);
	const activeSearchInput =
		document.activeElement instanceof HTMLInputElement &&
		document.activeElement.classList.contains("nui-timeline-search-input") &&
		container.contains(document.activeElement)
			? document.activeElement
			: null;
	const searchSelection = activeSearchInput?.selectionStart ?? null;
	const layoutMode = options.layout ?? "full";
	const layoutClass = timelineLayoutClass(layoutMode);
	const timespan = options.timespan;
	const rowSize = options.rowSize ?? DEFAULT_TIMELINE_ROW_SIZE;
	const layout = buildTimelineLayout(
		items,
		new Date(),
		options.rangeOverride,
	);

	if (!layout) {
		clearElement(container);
		container.classList.add("nui-timeline");
		container.classList.add(layoutClass);
		if (Platform.isMobile) {
			container.classList.add("nui-timeline--mobile");
		}
		container.appendChild(
			el(
				"div",
				"nui-timeline-empty",
				options.emptyMessage ??
					"No dated documents found. Add `date` or `Start Date` to frontmatter.",
			),
		);
		return;
	}

	clearElement(container);
	container.classList.add("nui-timeline");
	container.classList.add(layoutClass);
	if (Platform.isMobile) {
		container.classList.add("nui-timeline--mobile");
	}
	renderTimelineContent(container, items, layout, {
		...options,
		layoutMode,
		timespan,
		rowSize,
		adoptedTitle,
	});
	animateRowTransitions(container, previousRowPositions);

	if (activeSearchInput) {
		const input = container.querySelector<HTMLInputElement>(
			".nui-timeline-search-input",
		);
		input?.focus();
		if (input && searchSelection !== null) {
			input.setSelectionRange(searchSelection, searchSelection);
		}
	}
}

function renderTimelineContent(
	container: HTMLElement,
	items: TimelineItem[],
	layout: TimelineLayout,
	options: RenderTimelineOptions & {
		layoutMode: TimelineLayoutMode;
		timespan?: TimelineTimespan;
		rowSize: number;
		adoptedTitle?: HTMLElement | null;
	},
): void {
	const layoutMode = options.layoutMode;
	const timespan = options.timespan;
	const rowSize = options.rowSize;

	const topbar = el("div", "nui-timeline-topbar");
	const topbarTitle = el("div", "nui-timeline-topbar-title");
	if (options.adoptedTitle) {
		topbarTitle.appendChild(options.adoptedTitle);
	}
	topbar.appendChild(topbarTitle);

	const header = el("div", "nui-timeline-header");

	const searchWrap = el("div", "nui-timeline-search");
	if ((options.searchQuery ?? "").length > 0) {
		searchWrap.classList.add("has-value");
	}
	const searchIcon = el("span", "nui-timeline-search-icon");
	setIcon(searchIcon, "search");
	searchIcon.setAttribute("aria-hidden", "true");
	const searchInput = document.createElement("input");
	searchInput.type = "text";
	searchInput.className = "nui-timeline-search-input";
	searchInput.value = options.searchQuery ?? "";
	searchInput.setAttribute("aria-label", "Filter timeline items");
	const clearBtn = document.createElement("button");
	clearBtn.type = "button";
	clearBtn.className = "nui-timeline-search-clear";
	clearBtn.textContent = "×";
	clearBtn.title = "Clear filter";
	clearBtn.setAttribute("aria-label", "Clear filter");
	const syncSearchValue = (value: string) => {
		searchWrap.classList.toggle("has-value", value.length > 0);
		options.onSearchChange?.(value);
	};
	const clearSearch = () => {
		searchInput.value = "";
		syncSearchValue("");
	};
	searchInput.addEventListener("input", () => {
		syncSearchValue(searchInput.value);
	});
	searchInput.addEventListener("keydown", (event) => {
		if (event.code !== "Escape" || searchInput.value.length === 0) return;
		event.preventDefault();
		event.stopPropagation();
		clearSearch();
	});
	clearBtn.addEventListener("click", () => {
		clearSearch();
		searchInput.focus();
	});
	searchWrap.appendChild(searchIcon);
	searchWrap.appendChild(searchInput);
	searchWrap.appendChild(clearBtn);
	header.appendChild(searchWrap);

	const rangeGroup = el("div", "nui-timeline-range-group");

	if (options.onRangeChange) {
		rangeGroup.appendChild(
			createScrubControl({
				scrubId: "range-start",
				labelClassName: "nui-timeline-range-label",
				labelText: formatDisplayDate(layout.rangeStart),
				title: "Drag vertically to change start date",
			}),
		);
		rangeGroup.appendChild(el("span", "nui-timeline-range-separator", "–"));
		rangeGroup.appendChild(
			createScrubControl({
				scrubId: "range-end",
				labelClassName: "nui-timeline-range-label",
				labelText: formatDisplayDate(layout.rangeEnd),
				title: "Drag vertically to change end date",
			}),
		);
	} else {
		rangeGroup.appendChild(
			el(
				"span",
				"nui-timeline-range",
				`${formatDisplayDate(layout.rangeStart)}–${formatDisplayDate(layout.rangeEnd)}`,
			),
		);
	}

	if (options.onRangeRestoreDefault) {
		const restoreBtn = document.createElement("button");
		restoreBtn.type = "button";
		restoreBtn.className = "nui-timeline-range-restore";
		restoreBtn.textContent = "⤶";
		restoreBtn.title = "Restore default date range";
		restoreBtn.setAttribute("aria-label", "Restore default date range");
		restoreBtn.addEventListener("click", () => {
			options.onRangeRestoreDefault?.();
		});
		header.appendChild(rangeGroup);
		header.appendChild(restoreBtn);
	} else {
		header.appendChild(rangeGroup);
	}

	if (options.onTimespanChange && timespan) {
		const timespanBtn = document.createElement("button");
		timespanBtn.type = "button";
		timespanBtn.className = "nui-timeline-timespan-select";
		timespanBtn.title = "Visible date range";
		timespanBtn.textContent = formatTimelineTimespanShort(timespan);
		timespanBtn.addEventListener("click", (event) => {
			const menu = new Menu();
			for (const option of TIMELINE_TIMESPAN_OPTIONS) {
				menu.addItem((item) => {
					item.setTitle(option.label);
					item.setChecked(option.value === timespan);
					item.onClick(() => {
						options.onTimespanChange?.(option.value);
					});
				});
			}
			menu.showAtMouseEvent(event);
		});
		header.appendChild(timespanBtn);

		if (options.onRangeChange) {
			const todayBtn = document.createElement("button");
			todayBtn.type = "button";
			todayBtn.className = "nui-timeline-today-btn";
			todayBtn.textContent = "Today";
			todayBtn.title = "Start the visible range at today";
			if (
				startOfDay(layout.rangeStart).getTime() !==
				startOfDay(new Date()).getTime()
			) {
				todayBtn.classList.add("is-visible");
			}
			todayBtn.addEventListener("click", () => {
				const next = shiftRangeStartToDate(
					layout.rangeStart,
					layout.rangeEnd,
					new Date(),
				);
				options.onRangeChange?.(next.start, next.end);
			});
			header.appendChild(todayBtn);
		}
	}

	if (options.onRowSizeChange) {
		header.appendChild(
			createScrubControl({
				scrubId: "row-gap",
				labelClassName: "nui-timeline-row-gap-label",
				labelText: formatTimelineRowSize(rowSize),
				title: "Drag horizontally or vertically to change size",
			}),
		);
	}

	if (options.onCreateNote) {
		const addBtn = document.createElement("span");
		addBtn.className = "nui-timeline-add-btn";
		addBtn.textContent = "+";
		addBtn.setAttribute("role", "button");
		addBtn.setAttribute("tabindex", "0");
		addBtn.title = "New note for today";
		addBtn.setAttribute("aria-label", "New note for today");
		addBtn.addEventListener("click", (evt) => {
			evt.preventDefault();
			evt.stopPropagation();
			options.onCreateNote?.();
		});
		header.appendChild(addBtn);
	}

	topbar.appendChild(header);

	container.appendChild(topbar);

	const scrollEl = el("div", "nui-timeline-scroll");
	const chart = el("div", "nui-timeline-chart");
	applyTimelineRowSizeStyles(chart, rowSize);
	chart.style.setProperty("--nui-track-height", `${TIMELINE_TRACK_HEIGHT}px`);
	chart.style.setProperty("--nui-axis-height", `${AXIS_HEIGHT}px`);

	const axisRow = el("div", "nui-timeline-axis-row");
	const monthAxis = el("div", "nui-timeline-month-axis");
	const weekdayAxis = el("div", "nui-timeline-weekday-axis");
	const axis = el("div", "nui-timeline-axis");
	if (options.onRangeChange) {
		axis.title =
			"←/→ step one day · Drag axis to pan · Horizontal scroll to pan · Cmd/Ctrl + vertical scroll to zoom";
	}

	axisRow.appendChild(monthAxis);
	axisRow.appendChild(axis);
	axisRow.appendChild(weekdayAxis);
	chart.appendChild(axisRow);

	const body = el("div", "nui-timeline-body");

	const grid = el("div", "nui-timeline-grid");
	body.appendChild(grid);

	if (layout.todayOffset !== null) {
		const todayLine = el("div", "nui-timeline-today");
		todayLine.style.left = `${layout.todayOffset}%`;
		todayLine.title = "Today";
		body.appendChild(todayLine);
	}

	if (layout.rows.length === 0) {
		body.appendChild(
			el("div", "nui-timeline-empty", "No projects in this date range."),
		);
	}

	const selectedIds = options.selectedIds ?? new Set<string>();
	const groupedItems = options.groupedItems ?? items;
	const itemsById = new Map(groupedItems.map((item) => [item.id, item]));
	const collapsedSuperprojectIds = options.collapsedSuperprojectIds ?? new Set();
	const showProjectLabels = hasMultipleProjectFolders(items);

	for (const row of layout.rows) {
		const rowEl = el("div", "nui-timeline-row");
		rowEl.dataset.itemId = row.item.id;
		rowEl.dataset.start = formatIsoDate(row.item.start);
		rowEl.dataset.end = formatIsoDate(row.item.end);
		const superprojectId = superprojectIdForGroupedItem(row.item.id, groupedItems);
		if (superprojectId) {
			rowEl.classList.add("nui-timeline-row-subproject");
			rowEl.dataset.superprojectId = superprojectId;
		}
		if (selectedIds.has(row.item.id)) {
			rowEl.classList.add("is-selected");
		}

		const track = el("div", "nui-timeline-track");
		const startDateEl = el(
			"span",
			"nui-timeline-date nui-timeline-date-start",
			formatDisplayDate(row.item.start),
		);
		const endDateEl = el(
			"span",
			"nui-timeline-date nui-timeline-date-end",
			formatDisplayDate(row.item.end),
		);
		const bar = el("div", "nui-timeline-bar");
		if (options.editable) {
			bar.classList.add("nui-timeline-bar-editable");
		}
		if (selectedIds.has(row.item.id)) {
			bar.classList.add("is-selected");
		}
		bar.title = `${formatDisplayDate(row.item.start)} → ${formatDisplayDate(row.item.end)}`;

		const titleEl = el("span", "nui-timeline-bar-title");
		let superprojectToggle: HTMLSpanElement | null = null;
		if (isSuperprojectItem(row.item.id)) {
			titleEl.classList.add("nui-timeline-bar-title-superproject");
			if (
				superprojectHasSubprojects(row.item.id, groupedItems) &&
				options.onToggleSuperprojectCollapse
			) {
				const collapsed = collapsedSuperprojectIds.has(row.item.id);
				superprojectToggle = document.createElement("span");
				superprojectToggle.className = "nui-timeline-superproject-toggle";
				superprojectToggle.classList.toggle("is-collapsed", collapsed);
				superprojectToggle.setAttribute("role", "button");
				superprojectToggle.tabIndex = 0;
				superprojectToggle.setAttribute(
					"aria-label",
					collapsed ? "Expand subprojects" : "Collapse subprojects",
				);
				superprojectToggle.title = collapsed
					? "Expand subprojects"
					: "Collapse subprojects";
				const toggleCollapse = (event: Event) => {
					event.preventDefault();
					event.stopPropagation();
					options.onToggleSuperprojectCollapse?.(row.item.id);
				};
				superprojectToggle.addEventListener("pointerdown", (event) => {
					event.preventDefault();
					event.stopPropagation();
				});
				superprojectToggle.addEventListener("click", toggleCollapse);
				superprojectToggle.addEventListener("keydown", (event) => {
					if (event.key !== "Enter" && event.key !== " ") return;
					toggleCollapse(event);
				});
				titleEl.classList.add("nui-timeline-bar-title-has-toggle");
			}
		}
		const titleTextEl = el(
			"span",
			"nui-timeline-bar-title-text",
			row.item.title,
		);
		if (superprojectToggle) {
			titleEl.appendChild(superprojectToggle);
		}
		titleEl.appendChild(titleTextEl);
		if (options.app) {
			const file = options.app.vault.getAbstractFileByPath(row.item.id);
			if (file instanceof TFile) {
				bindTimelineTitleRename(
					options.app,
					titleTextEl,
					file,
					options.onItemRenamed,
				);
			}
		}
		if (showProjectLabels && row.item.projectLabel) {
			const projectEl = el(
				"span",
				"nui-timeline-bar-project",
				row.item.projectLabel,
			);
			titleEl.appendChild(projectEl);
		}
		titleEl.title = row.item.id;
		const lineEl = el("span", "nui-timeline-bar-line");
		bar.appendChild(lineEl);

		applyBarGeometry(
			{ bar, startDateEl, endDateEl, titleEl },
			layout.rangeStart,
			layout.totalDays,
			row.item.start,
			row.item.end,
		);

		if (options.editable) {
			const startHandle = el("div", "nui-timeline-handle nui-timeline-handle-start");
			const endHandle = el("div", "nui-timeline-handle nui-timeline-handle-end");
			bar.appendChild(startHandle);
			bar.appendChild(endHandle);

			if (options.onDatesChange) {
				const dragArgs = {
					rangeStart: layout.rangeStart,
					totalDays: layout.totalDays,
					track,
					bar,
					body,
					selectedIds,
					itemsById,
					titleEl,
					startDateEl,
					endDateEl,
					item: row.item,
					onChange: options.onDatesChange,
				};
				attachBarDrag({ ...dragArgs, handle: startHandle, edge: "start" });
				attachBarDrag({ ...dragArgs, handle: endHandle, edge: "end" });
			}
		}

		if (options.onItemClick) {
			titleEl.classList.add("nui-timeline-bar-title-clickable");
		}
		if (options.onMoveItemsToProjectFolder && !isSuperprojectItem(row.item.id)) {
			titleEl.classList.add("nui-timeline-bar-title-draggable");
		}

		track.appendChild(titleEl);
		track.appendChild(startDateEl);
		track.appendChild(bar);
		track.appendChild(endDateEl);
		rowEl.appendChild(track);

		if (layoutMode === "full-tasks" && options.app) {
			const rowTasks = options.tasksByFilePath?.get(row.item.id) ?? [];
			if (rowTasks.length > 0) {
				rowEl.classList.add("nui-timeline-row--with-tasks");
				const tasksEl = el("div", "nui-timeline-row-tasks");
				const listEl = el("div", "nui-task-list-items");
				renderInlineTaskRows(listEl, options.app, rowTasks, options.onTaskToggle);
				tasksEl.appendChild(listEl);
				rowEl.appendChild(tasksEl);
			}
		}

		body.appendChild(rowEl);
	}

	chart.appendChild(body);
	scrollEl.appendChild(chart);
	container.appendChild(scrollEl);

	attachTimelineViewport(scrollEl, {
		rowSize,
		rangeStart: layout.rangeStart,
		rangeEnd: layout.rangeEnd,
		onRowSizeChange: options.onRowSizeChange,
		onRangePreview: options.onRangePreview,
		onRangeChange: options.onRangeChange,
	});

	syncTimelineAxis(container, layout.rangeStart, layout.rangeEnd);
	requestAnimationFrame(() => {
		syncTimelineAxis(container, layout.rangeStart, layout.rangeEnd);
	});

	attachTimelineSelection({
		scrollEl,
		rangeStart: layout.rangeStart,
		totalDays: layout.totalDays,
		selectedIds,
		onSelectionChange: (ids) => {
			options.onSelectionChange?.(ids);
		},
		onItemClick: options.onItemClick,
		onDatesChange: options.onDatesChange,
		onDeleteItems: options.onDeleteItems,
		onDuplicateItems: options.onDuplicateItems,
		onTurnIntoProjectFolder: options.onTurnIntoProjectFolder,
		onMoveItemsToProjectFolder: options.onMoveItemsToProjectFolder,
		onMoveOutOfProjectFolder: options.onMoveOutOfProjectFolder,
		canMoveOutOfProjectFolder: options.canMoveOutOfProjectFolder,
		onRenameItem: options.onRenameItem,
		onCreateNoteAtDate: options.onCreateNoteAtDate,
		editable: options.editable,
		itemsById,
	});
}

