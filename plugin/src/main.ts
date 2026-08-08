
import { Notice, Platform, Plugin, TFile } from "obsidian";
import {
	applyBodyClasses,
	clearBodyClasses,
} from "./appearance/appearance-settings";
import { toggleChromeHidden } from "./appearance/hide-chrome";
import { turnIntoProjectFolder } from "./core/mutate/turn-into-project-folder";
import {
	addCursorOnAdjacentLine,
	addCursorsToLineEnds,
	addNextMatchToSelections,
	copyLine,
	selectAllOccurrences,
} from "./editor/cursors";
import { registerCollapsibleProperties } from "./editor/collapsible-properties";
import { registerNestedProperties } from "./editor/nested-properties/register-nested-properties";
import { MobileSourceToggle } from "./editor/mobile-source-toggle";
import { registerNoteCoverImageSync } from "./editor/note-cover-image";
import { registerNoteTextColorSync } from "./editor/note-text-color";
import { registerNoteWideSync } from "./editor/note-wide";
import { registerTableColumnLayout } from "./editor/table-column-layout/register-table-column-layout";
import {
	registerNoteTextColorCommand,
	registerTextColorMenu,
} from "./editor/register-text-color-menu";
import { registerPropertyColorSwatch } from "./editor/register-property-color-swatch";
import { registerPropertyClear } from "./editor/register-property-clear";
import { registerSelectionToolbar } from "./editor/register-selection-toolbar";
import { registerCalloutPlainLp } from "./editor/register-callout-plain-lp";
import { registerCalloutLpIconDeco } from "./editor/register-callout-lp-icon-deco";
import { registerHtmlLpField } from "./editor/register-html-lp-field";
import { NuiSettingTab } from "./settings/settings-tab";
import {
	DEFAULT_SETTINGS,
	mergeSettings,
	NuiSettings,
} from "./settings/nui-settings";
import { FolderIndexManager } from "./navigation/folder-index";
import { setVaultRootName } from "./navigation/folder-index-path";
import { HabitRenameManager } from "./habits/habit-rename-manager";
import { SidebarGraphNavigation } from "./navigation/sidebar-graph-navigation";
import { isFolderIndexFile, openFileInWorkspace } from "./navigation/folder-index";
import { YearTrackerBasesView } from "./views/year-tracker-bases-view";
import { MonthTrackerBasesView } from "./views/month-tracker-bases-view";
import { WeekTracker3BasesView } from "./views/week-tracker-3-bases-view";
import { ScoreChartBasesView } from "./views/score-chart-bases-view";
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
	MONTH_TRACKER_BASES_VIEW_TYPE,
	SCORE_CHART_BASES_VIEW_TYPE,
} from "./layouts/types";
import { TimelineTimespan } from "./timeline/types";
import { registerEmbedPipeSync } from "./embed/register-embed-pipe-sync";
import { registerEmbedChromeStickLine } from "./embed/embed-chrome-stick-line";
import { registerEmbedSourceClick } from "./embed/register-embed-source-click";

export default class NuiPlugin extends Plugin {
	settings: NuiSettings = DEFAULT_SETTINGS;
	folderIndexManager: FolderIndexManager | null = null;
	habitRenameManager: HabitRenameManager | null = null;
	sidebarGraphNavigation: SidebarGraphNavigation | null = null;
	mobileSourceToggle: MobileSourceToggle | null = null;
	refreshCollapsibleProperties: (() => void) | null = null;
	refreshNestedProperties: (() => void) | null = null;

	/**
	 * Every opinionated feature is gated here, and anything that overrides
	 * built-in Obsidian behaviour is off by default. With every toggle off this
	 * registers the fourteen Bases views and nothing else — and a Bases view is
	 * inert until a user adds it to a base.
	 */
	async onload() {
		await this.loadSettings();
		const { editor, appearance, folderIndex, workspace } = this.settings;

		setVaultRootName(this.app.vault.getName());
		this.applyAppearance();
		this.registerBasesViews();

		if (folderIndex.enabled) {
			this.folderIndexManager = new FolderIndexManager(
				this,
				() => this.settings.folderIndex,
				() => this.settings.habits.root,
			);
			this.folderIndexManager.onload();
			this.registerFolderIndexCommands();
			if (Platform.isDesktopApp) {
				this.registerFileExplorerMenuItems();
			}
		}

		// Inert unless the vault has a habits folder with habit bundles in it.
		this.habitRenameManager = new HabitRenameManager(
			this,
			() => this.settings.habits.root,
		);
		this.habitRenameManager.onload();

		if (workspace.sidebarGraphNavigation) {
			this.sidebarGraphNavigation = new SidebarGraphNavigation(this);
			this.sidebarGraphNavigation.onload();
		}

		if (workspace.mobileSourceToggle) {
			this.mobileSourceToggle = new MobileSourceToggle(this);
			this.mobileSourceToggle.onload();
		}

		if (editor.embedPipes) {
			registerEmbedPipeSync(this);
			registerEmbedChromeStickLine(this);
		}
		registerEmbedSourceClick(this);
		registerCalloutPlainLp(this);
		registerCalloutLpIconDeco(this);
		if (editor.textColor) {
			registerNoteTextColorSync(this);
			registerTextColorMenu(this);
			registerPropertyColorSwatch(this);
			registerNoteTextColorCommand(this);
		}
		if (editor.selectionToolbar && Platform.isDesktopApp) {
			registerSelectionToolbar(this);
		}
		if (editor.collapsibleProperties) {
			this.refreshCollapsibleProperties = registerCollapsibleProperties(this);
		}
		registerPropertyClear(this);
		if (editor.nestedProperties) {
			this.refreshNestedProperties = registerNestedProperties(this);
		}
		if (editor.tableColumnLayout) registerTableColumnLayout(this);
		if (editor.htmlLivePreview) {
			registerHtmlLpField(this, () => ({
				alwaysRenderHtmlInLivePreview:
					this.settings.editor.alwaysRenderHtmlInLivePreview,
			}));
		}
		if (editor.multiCursorCommands && Platform.isDesktopApp) {
			this.registerEditorCommands();
		}

		if (appearance.noteCoverImage) registerNoteCoverImageSync(this);
		if (appearance.noteWide) registerNoteWideSync(this);
		this.registerHideChromeCommand();

		this.addSettingTab(new NuiSettingTab(this.app, this));
		this.showFirstRunNotice();
	}

	onunload() {
		this.folderIndexManager?.onunload();
		this.habitRenameManager?.onunload();
		clearBodyClasses();
	}

	/** Timeline view state, persisted alongside the rest of the settings. */
	get timelineRowSize(): number {
		return this.settings.timeline.rowSize;
	}
	set timelineRowSize(value: number) {
		this.settings.timeline.rowSize = value;
	}
	get timelineTimespan(): TimelineTimespan {
		return this.settings.timeline.timespan;
	}
	set timelineTimespan(value: TimelineTimespan) {
		this.settings.timeline.timespan = value;
	}
	get timelineRangeStart(): string | undefined {
		return this.settings.timeline.rangeStart;
	}
	set timelineRangeStart(value: string | undefined) {
		this.settings.timeline.rangeStart = value;
	}
	get timelineRangeEnd(): string | undefined {
		return this.settings.timeline.rangeEnd;
	}
	set timelineRangeEnd(value: string | undefined) {
		this.settings.timeline.rangeEnd = value;
	}

	/** The one habits root, shared by all four trackers. */
	get habitsRoot(): string {
		return this.settings.habits.root;
	}

	async loadSettings() {
		this.settings = mergeSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.folderIndexManager?.onSettingsChanged();
		this.applyAppearance();
	}

	async saveTimelineSettings(): Promise<void> {
		await this.saveSettings();
	}

	applyAppearance(): void {
		applyBodyClasses(this.settings.appearance, this.settings.workspace);
	}

	refreshHtmlLivePreview(): void {
		this.registerHtmlLpRefresh?.();
	}

	/**
	 * The folder-index model is the one feature a user is likely to be looking
	 * for and not find, because it is off until asked for.
	 */
	private showFirstRunNotice(): void {
		if (this.settings.firstRunNoticeShown) return;
		this.settings.firstRunNoticeShown = true;
		void this.saveSettings();
		new Notice(
			"NUI is installed. Its Bases views are ready to use; folder-index navigation and the other opinionated features are off until you turn them on in Settings → NUI.",
			10000,
		);
	}

	private registerBasesViews(): void {
		this.registerTimelineBasesView();
		this.registerYearTrackerBasesView();
		this.registerMonthTrackerBasesView();
		this.registerWeekTracker3BasesView();
		this.registerScoreChartBasesView();
		this.registerCardAndListBasesViews();
		this.registerTaskListBasesView();
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
					placeholder: "Habit name",
				},
			],
		});
	}

	private registerMonthTrackerBasesView() {
		this.registerBasesView(MONTH_TRACKER_BASES_VIEW_TYPE, {
			name: "Month Tracker",
			icon: "layout-grid",
			factory: (controller, containerEl) =>
				new MonthTrackerBasesView(controller, containerEl, this),
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

	private registerScoreChartBasesView() {
		this.registerBasesView(SCORE_CHART_BASES_VIEW_TYPE, {
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
					default: "",
					placeholder: "One folder path per line",
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
			id: "select-all-occurrences",
			name: "Select all occurrences of find match",
			editorCallback: (editor) => selectAllOccurrences(editor),
		});

		this.addCommand({
			id: "add-cursors-to-line-ends",
			name: "Cursor to line ends",
			editorCallback: (editor) => addCursorsToLineEnds(editor),
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
			// Mod+Escape is a common binding, so it is opt-in.
			...(Platform.isDesktopApp && this.settings.folderIndex.goToParentHotkey
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

	private registerHideChromeCommand() {
		this.addCommand({
			id: "toggle-hide-chrome",
			name: "Show or hide chrome",
			...(Platform.isDesktopApp && this.settings.appearance.hideChromeHotkey
				? { hotkeys: [{ modifiers: ["Alt", "Mod"], key: "`" }] }
				: {}),
			callback: () => toggleChromeHidden(),
		});
	}

	private async turnActiveNoteIntoFolder(file: TFile): Promise<void> {
		const indexFile = await turnIntoProjectFolder(this.app, file);
		if (indexFile) {
			await openFileInWorkspace(this.app, indexFile);
		}
	}
}

