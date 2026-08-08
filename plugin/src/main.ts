
import { Notice, Platform, Plugin, TFile } from "obsidian";
import { IS_MINI } from "./build-flags";
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
import { registerBasesViews } from "./views/register-bases-views";
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
		// MiniNUI ships everything but the Bases views.
		if (!IS_MINI) registerBasesViews(this);

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
			IS_MINI
				? "MiniNUI is installed. Folder-index navigation and the other opinionated features are off until you turn them on in Settings → NUI."
				: "NUI is installed. Its Bases views are ready to use; folder-index navigation and the other opinionated features are off until you turn them on in Settings → NUI.",
			10000,
		);
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

