import {
	DEFAULT_TIMELINE_ROW_SIZE,
	DEFAULT_TIMELINE_TIMESPAN,
	mergeTimelineRowSize,
	mergeTimelineTimespan,
	TimelineTimespan,
} from "../timeline/types";

/**
 * One settings object for the whole plugin, one section per feature area.
 *
 * The rule for defaults: anything that overrides built-in Obsidian behaviour
 * starts off. Registering a Bases view or an unbound command changes nothing
 * until the user reaches for it, so those start on.
 */

export interface FolderIndexSettings {
	/** Off by default: this redefines what clicking a folder does. */
	enabled: boolean;
	hideIndexInExplorer: boolean;
	/** Hide root-level AGENTS.md / CLAUDE.md from the file explorer. */
	hideAgentStubs: boolean;
	/** Bind Mod+Escape to "Go to parent folder". Applies on reload. */
	goToParentHotkey: boolean;
}

export interface HabitSettings {
	/** Vault folder holding habit folders; shared by all four trackers. */
	root: string;
}

export interface TimelineSettings {
	rowSize: number;
	timespan: TimelineTimespan;
	rangeStart?: string;
	rangeEnd?: string;
}

/** The slice the Live Preview CodeMirror extension reads. */
export interface HtmlLivePreviewSettings {
	alwaysRenderHtmlInLivePreview: boolean;
}

export interface EditorSettings extends HtmlLivePreviewSettings {
	multiCursorCommands: boolean;
	textColor: boolean;
	tableColumnLayout: boolean;
	htmlLivePreview: boolean;
	collapsibleProperties: boolean;
	embedPipes: boolean;
}

export interface AppearanceSettings {
	showPanelEdges: boolean;
	noteWide: boolean;
	noteCoverImage: boolean;
	/**
	 * Hide Obsidian's "Edit this block" button on embeds. Off by default: it
	 * removes a built-in affordance from every embed, NUI's or not.
	 */
	hideEmbedEditButtons: boolean;
	/**
	 * Fade a Bases view's header and toolbar until hovered. Off by default:
	 * it applies to every base, including views this plugin did not add.
	 */
	fadeBasesChrome: boolean;
	/** Bind Mod+§ to "Show or hide chrome". Applies on reload. */
	hideChromeHotkey: boolean;
}

export interface WorkspaceSettings {
	/**
	 * Both patch an Obsidian prototype, so both start off.
	 * `sidebarGraphNavigation` patches WorkspaceLeaf.canNavigate;
	 * `mobileSourceToggle` patches MarkdownView.onOpen.
	 */
	sidebarGraphNavigation: boolean;
	mobileSourceToggle: boolean;
}

export interface NuiSettings {
	folderIndex: FolderIndexSettings;
	habits: HabitSettings;
	timeline: TimelineSettings;
	editor: EditorSettings;
	appearance: AppearanceSettings;
	workspace: WorkspaceSettings;
	/** Set once the first-run notice has been shown. */
	firstRunNoticeShown: boolean;
}

export const DEFAULT_SETTINGS: NuiSettings = {
	folderIndex: {
		enabled: false,
		hideIndexInExplorer: false,
		hideAgentStubs: false,
		goToParentHotkey: false,
	},
	habits: {
		root: "Habits",
	},
	timeline: {
		rowSize: DEFAULT_TIMELINE_ROW_SIZE,
		timespan: DEFAULT_TIMELINE_TIMESPAN,
		rangeStart: undefined,
		rangeEnd: undefined,
	},
	editor: {
		multiCursorCommands: true,
		textColor: true,
		tableColumnLayout: true,
		htmlLivePreview: true,
		alwaysRenderHtmlInLivePreview: true,
		collapsibleProperties: true,
		embedPipes: true,
	},
	appearance: {
		showPanelEdges: false,
		noteWide: true,
		noteCoverImage: true,
		hideEmbedEditButtons: false,
		fadeBasesChrome: false,
		hideChromeHotkey: false,
	},
	workspace: {
		sidebarGraphNavigation: false,
		mobileSourceToggle: false,
	},
	firstRunNoticeShown: false,
};

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function str(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalStr(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}

type Loaded = Record<string, unknown> | null | undefined;

function section(loaded: Loaded, key: string): Record<string, unknown> {
	const value = loaded?.[key];
	return typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: {};
}

export function mergeSettings(loaded: Loaded): NuiSettings {
	const folderIndex = section(loaded, "folderIndex");
	const habits = section(loaded, "habits");
	const timeline = section(loaded, "timeline");
	const editor = section(loaded, "editor");
	const appearance = section(loaded, "appearance");
	const workspace = section(loaded, "workspace");

	// Pre-0.1.0 vaults kept this one key at the top level of `editor`.
	const legacyHtmlLivePreview = section(loaded, "htmlLivePreview");

	const defaults = DEFAULT_SETTINGS;

	return {
		folderIndex: {
			enabled: bool(folderIndex.enabled, defaults.folderIndex.enabled),
			hideIndexInExplorer: bool(
				folderIndex.hideIndexInExplorer,
				defaults.folderIndex.hideIndexInExplorer,
			),
			hideAgentStubs: bool(
				folderIndex.hideAgentStubs,
				defaults.folderIndex.hideAgentStubs,
			),
			goToParentHotkey: bool(
				folderIndex.goToParentHotkey,
				defaults.folderIndex.goToParentHotkey,
			),
		},
		habits: {
			root: str(habits.root, defaults.habits.root),
		},
		timeline: {
			rowSize: mergeTimelineRowSize(
				timeline.rowSize,
				timeline.rowGap,
				timeline.rowHeight,
			),
			timespan: mergeTimelineTimespan(timeline.timespan),
			rangeStart: optionalStr(timeline.rangeStart),
			rangeEnd: optionalStr(timeline.rangeEnd),
		},
		editor: {
			multiCursorCommands: bool(
				editor.multiCursorCommands,
				defaults.editor.multiCursorCommands,
			),
			textColor: bool(editor.textColor, defaults.editor.textColor),
			tableColumnLayout: bool(
				editor.tableColumnLayout,
				defaults.editor.tableColumnLayout,
			),
			htmlLivePreview: bool(
				editor.htmlLivePreview,
				defaults.editor.htmlLivePreview,
			),
			alwaysRenderHtmlInLivePreview: bool(
				editor.alwaysRenderHtmlInLivePreview ??
					legacyHtmlLivePreview.alwaysRenderHtmlInLivePreview,
				defaults.editor.alwaysRenderHtmlInLivePreview,
			),
			collapsibleProperties: bool(
				editor.collapsibleProperties,
				defaults.editor.collapsibleProperties,
			),
			embedPipes: bool(editor.embedPipes, defaults.editor.embedPipes),
		},
		appearance: {
			showPanelEdges: bool(
				appearance.showPanelEdges,
				defaults.appearance.showPanelEdges,
			),
			noteWide: bool(appearance.noteWide, defaults.appearance.noteWide),
			noteCoverImage: bool(
				appearance.noteCoverImage,
				defaults.appearance.noteCoverImage,
			),
			hideEmbedEditButtons: bool(
				appearance.hideEmbedEditButtons,
				defaults.appearance.hideEmbedEditButtons,
			),
			fadeBasesChrome: bool(
				appearance.fadeBasesChrome,
				defaults.appearance.fadeBasesChrome,
			),
			hideChromeHotkey: bool(
				appearance.hideChromeHotkey,
				defaults.appearance.hideChromeHotkey,
			),
		},
		workspace: {
			sidebarGraphNavigation: bool(
				workspace.sidebarGraphNavigation,
				defaults.workspace.sidebarGraphNavigation,
			),
			mobileSourceToggle: bool(
				workspace.mobileSourceToggle,
				defaults.workspace.mobileSourceToggle,
			),
		},
		firstRunNoticeShown: bool(
			loaded?.firstRunNoticeShown,
			defaults.firstRunNoticeShown,
		),
	};
}
