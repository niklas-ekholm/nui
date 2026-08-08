import type NuiPlugin from "../main";
import { YearTrackerBasesView } from "./year-tracker-bases-view";
import { MonthTrackerBasesView } from "./month-tracker-bases-view";
import { WeekTracker3BasesView } from "./week-tracker-3-bases-view";
import { ScoreChartBasesView } from "./score-chart-bases-view";
import {
	TIMELINE_BASES_VIEW_TYPE,
	TimelineBasesView,
} from "./timeline-bases-view";
import {
	CardLBasesView,
	ListFoldersBasesView,
	ListFilesBasesView,
	ListFilesByDateBasesView,
	PictureGalleryBasesView,
	CardSBasesView,
} from "./card-list-bases-views";
import { NavigationBasesView } from "./navigation-bases-view";
import { DailyNoteLinkBasesView } from "./daily-note-link-bases-view";
import { TaskListBasesView } from "./task-list-bases-view";
import {
	CARD_L_BASES_VIEW_TYPE,
	CARD_S_BASES_VIEW_TYPE,
	LIST_FILES_BASES_VIEW_TYPE,
	LIST_FILES_BY_DATE_BASES_VIEW_TYPE,
	LIST_FOLDERS_BASES_VIEW_TYPE,
	NAVIGATION_BASES_VIEW_TYPE,
	DAILY_NOTE_LINK_BASES_VIEW_TYPE,
	PICTURE_GALLERY_BASES_VIEW_TYPE,
	TASK_LIST_BASES_VIEW_TYPE,
	WEEK_TRACKER_3_BASES_VIEW_TYPE,
	YEAR_TRACKER_BASES_VIEW_TYPE,
	MONTH_TRACKER_BASES_VIEW_TYPE,
	SCORE_CHART_BASES_VIEW_TYPE,
} from "../layouts/types";

/**
 * Registers the fourteen Bases views.
 *
 * This module is the whole of what MiniNUI leaves out: the mini build swaps it
 * for register-bases-views.mini.ts, a no-op, so none of the view code is
 * bundled there. Keep view registration here and nowhere else.
 */
export function registerBasesViews(plugin: NuiPlugin): void {
	registerTimelineBasesView(plugin);
	registerYearTrackerBasesView(plugin);
	registerMonthTrackerBasesView(plugin);
	registerWeekTracker3BasesView(plugin);
	registerScoreChartBasesView(plugin);
	registerCardAndListBasesViews(plugin);
	registerTaskListBasesView(plugin);
}

function registerCardAndListBasesViews(plugin: NuiPlugin) {
	const cardSizeOption = (defaultSize: number) => ({
		type: "slider" as const,
		key: "cardSize",
		displayName: "Card size",
		default: defaultSize,
		min: 80,
		max: 400,
		step: 10,
	});
	const imageOption = (defaultProp?: string) => ({
		type: "property" as const,
		key: "image",
		displayName: "Image",
		default: defaultProp ?? "",
	});
	const aspectRatioOption = () => ({
		type: "slider" as const,
		key: "imageAspectRatio",
		displayName: "Image aspect ratio",
		default: 1,
		min: 0.5,
		max: 2,
		step: 0.05,
	});
	const imageFitOption = (defaultFit: "cover" | "contain") => ({
		type: "dropdown" as const,
		key: "imageFit",
		displayName: "Image fit",
		default: defaultFit,
		options: {
			cover: "Cover",
			contain: "Contain",
		},
	});

	plugin.registerBasesView(PICTURE_GALLERY_BASES_VIEW_TYPE, {
		name: "Picture Gallery",
		icon: "image",
		factory: (controller, containerEl) =>
			new PictureGalleryBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(100),
			imageOption("file.file"),
			imageFitOption("contain"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(CARD_S_BASES_VIEW_TYPE, {
		name: "Card: S",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new CardSBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(CARD_L_BASES_VIEW_TYPE, {
		name: "Card: L",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new CardLBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(LIST_FILES_BASES_VIEW_TYPE, {
		name: "List: Files",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new ListFilesBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(LIST_FILES_BY_DATE_BASES_VIEW_TYPE, {
		name: "List: Files by Date",
		icon: "calendar",
		factory: (controller, containerEl) =>
			new ListFilesByDateBasesView(controller, containerEl),
		options: () => [
			{
				type: "property",
				key: "dateField",
				displayName: "Date",
				default: "note.date",
			},
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(LIST_FOLDERS_BASES_VIEW_TYPE, {
		name: "List: Folders",
		icon: "folder",
		factory: (controller, containerEl) =>
			new ListFoldersBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(NAVIGATION_BASES_VIEW_TYPE, {
		name: "List: Navigation",
		icon: "folder",
		factory: (controller, containerEl) =>
			new NavigationBasesView(controller, containerEl),
		options: () => [
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});

	plugin.registerBasesView(DAILY_NOTE_LINK_BASES_VIEW_TYPE, {
		name: "List: Daily Note Link",
		icon: "calendar",
		factory: (controller, containerEl) =>
			new DailyNoteLinkBasesView(controller, containerEl),
		options: () => [
			{
				type: "text",
				key: "linkFolder",
				displayName: "Link folder",
				default: "",
				placeholder: "Daily notes folder",
			},
			{
				type: "text",
				key: "label",
				displayName: "Label",
				default: "",
				placeholder: "Today",
			},
			{
				type: "text",
				key: "dayOffset",
				displayName: "Day offset",
				default: "0",
				placeholder: "0 = today, -1 = yesterday, 1 = tomorrow",
			},
			{
				type: "text",
				key: "listPrefix",
				displayName: "Symbol override",
				default: "",
				placeholder: "→",
			},
			{
				type: "toggle",
				key: "hideLabel",
				displayName: "Hide label",
				default: false,
			},
			cardSizeOption(180),
			imageOption(),
			imageFitOption("cover"),
			aspectRatioOption(),
		],
	});
}

function registerYearTrackerBasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(YEAR_TRACKER_BASES_VIEW_TYPE, {
		name: "Year Tracker",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new YearTrackerBasesView(controller, containerEl, plugin),
		options: () => [
			{
				type: "property",
				key: "dateField",
				displayName: "Date",
				default: "note.date",
			},
			{
				type: "text",
				key: "year",
				displayName: "Year",
				default: String(new Date().getFullYear()),
			},
			{
				type: "formula",
				key: "tag",
				displayName: "Tag",
				default: "",
				placeholder: "Habit name",
			},
		],
	});
}

function registerMonthTrackerBasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(MONTH_TRACKER_BASES_VIEW_TYPE, {
		name: "Month Tracker",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new MonthTrackerBasesView(controller, containerEl, plugin),
		options: () => [
			{
				type: "property",
				key: "dateField",
				displayName: "Date",
				default: "note.date",
			},
			{
				type: "text",
				key: "year",
				displayName: "Year",
				default: String(new Date().getFullYear()),
			},
		],
	});
}

function registerWeekTracker3BasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(WEEK_TRACKER_3_BASES_VIEW_TYPE, {
		name: "Week Tracker: 3",
		icon: "layout-grid",
		factory: (controller, containerEl) =>
			new WeekTracker3BasesView(controller, containerEl, plugin),
		options: () => [
			{
				type: "property",
				key: "dateField",
				displayName: "Date",
				default: "note.date",
			},
		],
	});
}

function registerScoreChartBasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(SCORE_CHART_BASES_VIEW_TYPE, {
		name: "Score Chart",
		icon: "line-chart",
		factory: (controller, containerEl) =>
			new ScoreChartBasesView(controller, containerEl),
		options: () => [
			{
				type: "property",
				key: "dateField",
				displayName: "Date",
				default: "note.date",
			},
		],
	});
}

function registerTaskListBasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(TASK_LIST_BASES_VIEW_TYPE, {
		name: "List: Tasks",
		icon: "check-square",
		factory: (controller, containerEl) =>
			new TaskListBasesView(controller, containerEl),
		options: () => [
			{
				type: "dropdown" as const,
				key: "showCompleted",
				displayName: "Tasks",
				default: "false",
				options: {
					false: "Open only",
					true: "Include completed",
				} as Record<string, string>,
			},
			{
				type: "dropdown" as const,
				key: "projectScope",
				displayName: "Projects",
				default: "all",
				options: {
					all: "All projects",
					ongoing: "Ongoing only",
				} as Record<string, string>,
			},
			{
				type: "text" as const,
				key: "timelineFolders",
				displayName: "Timeline folders",
				default: "",
				placeholder: "One folder path per line",
			},
		],
	});
}

function registerTimelineBasesView(plugin: NuiPlugin) {
	plugin.registerBasesView(TIMELINE_BASES_VIEW_TYPE, {
		name: "Timeline",
		icon: "gantt-chart",
		factory: (controller, containerEl) =>
			new TimelineBasesView(controller, containerEl, plugin),
		options: () => [
			{
				type: "property",
				key: "startField",
				displayName: "Start date",
				default: "note.Start Date",
			},
			{
				type: "property",
				key: "endField",
				displayName: "End date",
				default: "note.End Date",
			},
			{
				type: "property",
				key: "titleField",
				displayName: "Title",
				default: "note.title",
			},
			{
				type: "dropdown",
				key: "layout",
				displayName: "Layout",
				default: "full",
				options: {
					full: "Full",
					"full-tasks": "Full-Tasks",
					compact: "Compact",
				},
			},
			{
				type: "property",
				key: "projectField",
				displayName: "Project",
				default: "note.project",
			},
		],
	});
}
