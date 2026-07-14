
import { Notice, Platform, Plugin, TFile } from "obsidian";
import { turnIntoProjectFolder } from "./core/mutate/turn-into-project-folder";
import { formatIsoDate } from "./core/parse/dates";
import {
	addCursorOnAdjacentLine,
	addNextMatchToSelections,
	copyLine,
} from "./editor/cursors";
import { MobileSourceToggle } from "./editor/mobile-source-toggle";
import { FolderIndexSettingTab } from "./navigation/folder-index-settings";
import { FolderIndexManager } from "./navigation/folder-index";
import { HabitRenameManager } from "./habits/habit-rename-manager";
import { SidebarGraphNavigation } from "./navigation/sidebar-graph-navigation";
import {
	DEFAULT_FOLDER_INDEX_SETTINGS,
	FolderIndexSettings,
} from "./navigation/types";
import {
	isFolderIndexFile,
	mergeFolderIndexSettings,
	openFileInWorkspace,
} from "./navigation/folder-index";
import { YearTrackerBasesView } from "./views/year-tracker-bases-view";
import { WeekTracker3BasesView } from "./views/week-tracker-3-bases-view";
import {
	TIMELINE_BASES_VIEW_TYPE,
	TimelineBasesView,
} from "./views/timeline-bases-view";
import {
	CardLBasesView,
	ListFoldersBasesView,
	ListFilesBasesView,
	ListFilesByDateBasesView,
	PictureGalleryBasesView,
	CardSBasesView,
} from "./views/card-list-bases-views";
import { NavigationBasesView } from "./views/navigation-bases-view";
import { DailyNoteLinkBasesView } from "./views/daily-note-link-bases-view";
import { TaskListBasesView } from "./views/task-list-bases-view";
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
} from "./layouts/types";
import {
	DEFAULT_TIMELINE_ROW_SIZE,
	DEFAULT_TIMELINE_TIMESPAN,
	mergeTimelineRowSize,
	mergeTimelineTimespan,
	parseTimelineRange,
	TimelineTimespan,
} from "./timeline/types";
import {
	loadExportSettings,
	ExportManager,
} from "./export/export-manager";
import { ExportSettings } from "./export/types";
import {
	loadImportSettings,
	ImportManager,
} from "./import/import-manager";
import { ImportSettings } from "./import/types";

export default class NuiPlugin extends Plugin {
	folderIndexSettings: FolderIndexSettings = DEFAULT_FOLDER_INDEX_SETTINGS;
	exportSettings: ExportSettings = loadExportSettings(null);
	importSettings: ImportSettings = loadImportSettings(null);
	timelineRowSize: number = DEFAULT_TIMELINE_ROW_SIZE;
	timelineTimespan: TimelineTimespan = DEFAULT_TIMELINE_TIMESPAN;
	timelineRangeStart?: string;
	timelineRangeEnd?: string;
	folderIndexManager: FolderIndexManager | null = null;
	exportManager: ExportManager | null = null;
	importManager: ImportManager | null = null;
	habitRenameManager: HabitRenameManager | null = null;
	sidebarGraphNavigation: SidebarGraphNavigation | null = null;
	mobileSourceToggle: MobileSourceToggle | null = null;
	async onload() {
		await this.loadSettings();
		this.folderIndexManager = new FolderIndexManager(
			this,
			() => this.folderIndexSettings,
		);
		this.folderIndexManager.onload();
		this.exportManager = new ExportManager(
			this,
			() => this.exportSettings,
			() => this.folderIndexManager,
		);
		this.exportManager.onload();
		this.importManager = new ImportManager(
			this,
			() => this.importSettings,
			() => this.folderIndexManager,
		);
		this.importManager.onload();
		this.habitRenameManager = new HabitRenameManager(this);
		this.habitRenameManager.onload();
		this.sidebarGraphNavigation = new SidebarGraphNavigation(this);
		this.sidebarGraphNavigation.onload();
		this.mobileSourceToggle = new MobileSourceToggle(this);
		this.mobileSourceToggle.onload();
		this.registerTimelineBasesView();
		this.registerYearTrackerBasesView();
		this.registerWeekTracker3BasesView();
		this.registerCardAndListBasesViews();
		this.registerTaskListBasesView();
		if (Platform.isDesktopApp) {
			this.registerEditorCommands();
			this.registerFileExplorerMenuItems();
		}
		this.registerFolderIndexCommands();
		this.addSettingTab(
			new FolderIndexSettingTab(
				this.app,
				this,
				() => this.folderIndexSettings,
				(partial) => {
					this.folderIndexSettings = {
						...this.folderIndexSettings,
						...partial,
					};
					void this.saveSettings();
					this.folderIndexManager?.onSettingsChanged();
				},
				() => this.exportSettings,
				(settings) => {
					this.exportSettings = settings;
					void this.saveSettings();
					this.exportManager?.onSettingsChanged();
				},
				() => this.importSettings,
				(settings) => {
					this.importSettings = settings;
					void this.saveSettings();
					this.importManager?.onSettingsChanged();
				},
			),
		);
	}

	onunload() {
		this.folderIndexManager?.onunload();
		this.habitRenameManager?.onunload();
	}

	async loadSettings() {
		const loaded = await this.loadData();
		this.folderIndexSettings = mergeFolderIndexSettings(
			loaded?.folderIndex ?? null,
		);
		this.exportSettings = loadExportSettings(loaded);
		this.importSettings = loadImportSettings(loaded);
		this.timelineRowSize = mergeTimelineRowSize(
			loaded?.timeline?.rowSize,
			loaded?.timeline?.rowGap,
			loaded?.timeline?.rowHeight,
		);
		this.timelineTimespan = mergeTimelineTimespan(loaded?.timeline?.timespan);
		const storedRange = parseTimelineRange(
			loaded?.timeline?.rangeStart,
			loaded?.timeline?.rangeEnd,
		);
		if (storedRange) {
			this.timelineRangeStart = formatIsoDate(storedRange.start);
			this.timelineRangeEnd = formatIsoDate(storedRange.end);
		} else {
			this.timelineRangeStart = undefined;
			this.timelineRangeEnd = undefined;
		}
	}

	async saveSettings() {
		const existing = (await this.loadData()) ?? {};
		await this.saveData({
			...existing,
			folderIndex: this.folderIndexSettings,
			export: this.exportSettings,
			import: this.importSettings,
			timeline: {
				rowSize: this.timelineRowSize,
				timespan: this.timelineTimespan,
				rangeStart: this.timelineRangeStart,
				rangeEnd: this.timelineRangeEnd,
			},
		});
	}

	async saveTimelineSettings(): Promise<void> {
		await this.saveSettings();
	}

	private registerCardAndListBasesViews() {
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

		this.registerBasesView(PICTURE_GALLERY_BASES_VIEW_TYPE, {
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

		this.registerBasesView(CARD_S_BASES_VIEW_TYPE, {
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

		this.registerBasesView(CARD_L_BASES_VIEW_TYPE, {
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

		this.registerBasesView(LIST_FILES_BASES_VIEW_TYPE, {
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

		this.registerBasesView(LIST_FILES_BY_DATE_BASES_VIEW_TYPE, {
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

		this.registerBasesView(LIST_FOLDERS_BASES_VIEW_TYPE, {
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

		this.registerBasesView(NAVIGATION_BASES_VIEW_TYPE, {
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

		this.registerBasesView(DAILY_NOTE_LINK_BASES_VIEW_TYPE, {
			name: "List: Today Daily Note",
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
					key: "listPrefix",
					displayName: "Symbol override",
					default: "",
					placeholder: "Folder name",
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

	private registerYearTrackerBasesView() {
		this.registerBasesView(YEAR_TRACKER_BASES_VIEW_TYPE, {
			name: "Year Tracker",
			icon: "layout-grid",
			factory: (controller, containerEl) =>
				new YearTrackerBasesView(controller, containerEl, this),
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
					placeholder: "lenkki",
				},
				{
					type: "text",
					key: "calendarFolder",
					displayName: "Habits folder",
					default: "index/𓂀/Habits",
					placeholder: "index/𓂀/Habits",
				},
			],
		});
	}

	private registerWeekTracker3BasesView() {
		this.registerBasesView(WEEK_TRACKER_3_BASES_VIEW_TYPE, {
			name: "Week Tracker: 3",
			icon: "layout-grid",
			factory: (controller, containerEl) =>
				new WeekTracker3BasesView(controller, containerEl, this),
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

	private registerTaskListBasesView() {
		this.registerBasesView(TASK_LIST_BASES_VIEW_TYPE, {
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
					default:
						"index/HTS/HTS Projects\nindex/media\nindex/NUIdocs/4 Timeline",
					placeholder:
						"index/HTS/HTS Projects\nindex/media",
				},
			],
		});
	}

	private registerTimelineBasesView() {
		this.registerBasesView(TIMELINE_BASES_VIEW_TYPE, {
			name: "Timeline",
			icon: "gantt-chart",
			factory: (controller, containerEl) =>
				new TimelineBasesView(controller, containerEl, this),
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

	private registerEditorCommands() {
		this.addCommand({
			id: "add-cursor-above",
			name: "Add cursor on line above",
			editorCallback: (editor) => addCursorOnAdjacentLine(editor, "up"),
		});

		this.addCommand({
			id: "add-cursor-below",
			name: "Add cursor on line below",
			editorCallback: (editor) => addCursorOnAdjacentLine(editor, "down"),
		});

		this.addCommand({
			id: "add-next-match-to-selections",
			name: "Add next match to selections",
			editorCallback: (editor) => addNextMatchToSelections(editor),
		});

		this.addCommand({
			id: "copy-line-up",
			name: "Copy line up",
			editorCallback: (editor) => copyLine(editor, "up"),
		});

		this.addCommand({
			id: "copy-line-down",
			name: "Copy line down",
			editorCallback: (editor) => copyLine(editor, "down"),
		});
	}

	private registerFileExplorerMenuItems(): void {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file, source) => {
				if (source !== "file-explorer-context-menu") {
					return;
				}
				if (!(file instanceof TFile) || isFolderIndexFile(file)) {
					return;
				}

				menu.addItem((item) => {
					item
						.setTitle("Turn note into folder")
						.setIcon("folder")
						.onClick(() => {
							void this.turnActiveNoteIntoFolder(file);
						});
				});
			}),
		);
	}

	private registerFolderIndexCommands() {
		this.addCommand({
			id: "open-folder-index",
			name: "Open folder index",
			callback: () => {
				const folderPath = this.folderIndexManager?.resolveTargetFolderPath();
				if (folderPath === null || folderPath === undefined) {
					new Notice(
						"No folder context. Click a folder in the file explorer or open a note first.",
					);
					return;
				}
				void this.folderIndexManager?.openFolderIndex(folderPath);
			},
		});

		this.addCommand({
			id: "create-folder-index",
			name: "Create folder index",
			callback: () => {
				const folderPath = this.folderIndexManager?.resolveTargetFolderPath();
				if (folderPath === null || folderPath === undefined) {
					new Notice(
						"No folder context. Click a folder in the file explorer or open a note first.",
					);
					return;
				}
				void this.folderIndexManager?.createFolderIndex(folderPath);
			},
		});

		this.addCommand({
			id: "turn-note-into-folder",
			name: "Turn note into folder",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || isFolderIndexFile(file)) {
					return false;
				}

				if (checking) {
					return true;
				}

				void this.turnActiveNoteIntoFolder(file);
				return true;
			},
		});

		this.addCommand({
			id: "go-to-parent-folder",
			name: "Go to parent folder",
			...(Platform.isDesktopApp
				? { hotkeys: [{ modifiers: ["Mod"], key: "Escape" }] }
				: {}),
			checkCallback: (checking) => {
				const parentPath = this.folderIndexManager?.resolveParentFolderPath();
				if (parentPath === null || parentPath === undefined) {
					return false;
				}

				if (checking) {
					return true;
				}

				void this.folderIndexManager?.goToParentFolder();
				return true;
			},
		});
	}

	private async turnActiveNoteIntoFolder(file: TFile): Promise<void> {
		const indexFile = await turnIntoProjectFolder(this.app, file);
		if (indexFile) {
			await openFileInWorkspace(this.app, indexFile);
		}
	}
}

