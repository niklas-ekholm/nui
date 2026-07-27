import { App, PluginSettingTab, Setting } from "obsidian";
import type NuiPlugin from "../main";
import { NuiSettings } from "./nui-settings";

/** Changing a gated registration only takes effect on the next plugin load. */
const RELOAD_NOTE = "Takes effect after reloading Obsidian.";

export class NuiSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: NuiPlugin,
	) {
		super(app, plugin);
	}

	private get settings(): NuiSettings {
		return this.plugin.settings;
	}

	private save(): void {
		void this.plugin.saveSettings();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.displayFolderIndex(containerEl);
		this.displayHabits(containerEl);
		this.displayEditor(containerEl);
		this.displayAppearance(containerEl);
		this.displayWorkspace(containerEl);
	}

	private displayFolderIndex(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Folder index").setHeading();

		new Setting(containerEl)
			.setName("Open hub note on folder click")
			.setDesc(
				"Clicking a folder in the file explorer, or a folder in the note header breadcrumb, opens that folder's hub note, FolderName.md. If it doesn't exist yet, clicking creates it. Folders inside a space marked okf_version in its hub note's frontmatter also get an index.md sidecar alongside the hub. The chevron still expands and collapses.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.folderIndex.enabled)
					.onChange((value) => {
						this.settings.folderIndex.enabled = value;
						this.save();
						this.display();
					}),
			);

		if (!this.settings.folderIndex.enabled) return;

		new Setting(containerEl)
			.setName("Hide hub notes in the file explorer")
			.setDesc("The folder itself becomes the way in.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.folderIndex.hideIndexInExplorer)
					.onChange((value) => {
						this.settings.folderIndex.hideIndexInExplorer = value;
						this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Hide AGENTS.md and CLAUDE.md")
			.setDesc(
				"Hide these two files at the vault root from the file explorer. They stay on disk.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.folderIndex.hideAgentStubs)
					.onChange((value) => {
						this.settings.folderIndex.hideAgentStubs = value;
						this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Bind Mod+Escape to go to parent folder")
			.setDesc(
				`The command is always available to bind yourself under Hotkeys. ${RELOAD_NOTE}`,
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.folderIndex.goToParentHotkey)
					.onChange((value) => {
						this.settings.folderIndex.goToParentHotkey = value;
						this.save();
					}),
			);
	}

	private displayHabits(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Habits").setHeading();

		new Setting(containerEl)
			.setName("Habits folder")
			.setDesc(
				"Where habit folders live. Shared by the year, month, and week trackers and the score chart.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Habits")
					.setValue(this.settings.habits.root)
					.onChange((value) => {
						this.settings.habits.root = value;
						this.save();
					}),
			);
	}

	private displayEditor(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Editor").setHeading();

		this.toggle(containerEl, {
			name: "Multi-cursor and copy line commands",
			desc: `Adds commands for adding cursors, selecting the next match, and copying a line up or down. They ship without hotkeys. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.multiCursorCommands,
			set: (value) => (this.settings.editor.multiCursorCommands = value),
		});

		this.toggle(containerEl, {
			name: "Text colour",
			desc: `Adds a colour picker to the editor context menu and a command to colour the current note. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.textColor,
			set: (value) => (this.settings.editor.textColor = value),
		});

		this.toggle(containerEl, {
			name: "Table column widths",
			desc: `Reads column widths from a table's separator row. Dormant unless the syntax is used. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.tableColumnLayout,
			set: (value) => (this.settings.editor.tableColumnLayout = value),
		});

		this.toggle(containerEl, {
			name: "Embed pipe syntax",
			desc: `Enables options after a pipe in an embed, as in ![[Base|wide]]. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.embedPipes,
			set: (value) => (this.settings.editor.embedPipes = value),
		});

		this.toggle(containerEl, {
			name: "Collapsible properties",
			desc: `Lets the properties block at the top of a note fold away. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.collapsibleProperties,
			set: (value) => (this.settings.editor.collapsibleProperties = value),
		});

		this.toggle(containerEl, {
			name: "HTML in Live Preview",
			desc: `Renders inline HTML in Live Preview. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.htmlLivePreview,
			set: (value) => (this.settings.editor.htmlLivePreview = value),
			rerender: true,
		});

		if (!this.settings.editor.htmlLivePreview) return;

		new Setting(containerEl)
			.setName("Keep HTML rendered under the cursor")
			.setDesc(
				"Keep colour span tags hidden and text coloured even when the cursor is inside them. Turn off for Obsidian's default HTML editing.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.editor.alwaysRenderHtmlInLivePreview)
					.onChange((value) => {
						this.settings.editor.alwaysRenderHtmlInLivePreview = value;
						this.save();
						this.plugin.refreshHtmlLivePreview();
					}),
			);
	}

	private displayAppearance(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Appearance").setHeading();

		new Setting(containerEl)
			.setName("Show panel edges")
			.setDesc(
				"Show a very faint border between panels — sidebars, tabs, and editor panes.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.appearance.showPanelEdges)
					.onChange((value) => {
						this.settings.appearance.showPanelEdges = value;
						this.save();
						this.plugin.applyAppearance();
					}),
			);

		this.toggle(containerEl, {
			name: "Wide notes",
			desc: `Lets a note opt into a wider layout with a wide property. ${RELOAD_NOTE}`,
			get: () => this.settings.appearance.noteWide,
			set: (value) => (this.settings.appearance.noteWide = value),
		});

		this.toggle(containerEl, {
			name: "Cover images",
			desc: `Lets a note show a cover image from a property. ${RELOAD_NOTE}`,
			get: () => this.settings.appearance.noteCoverImage,
			set: (value) => (this.settings.appearance.noteCoverImage = value),
		});

		new Setting(containerEl)
			.setName("Fade Bases toolbars until hovered")
			.setDesc(
				"Applies to every base, including views this plugin did not add.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.appearance.fadeBasesChrome)
					.onChange((value) => {
						this.settings.appearance.fadeBasesChrome = value;
						this.save();
					}),
			);

		new Setting(containerEl)
			.setName("Hide the edit button on embeds")
			.setDesc(
				"Hides Obsidian's “Edit this block” button on every embed, not only this plugin's views.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.appearance.hideEmbedEditButtons)
					.onChange((value) => {
						this.settings.appearance.hideEmbedEditButtons = value;
						this.save();
					}),
			);

		this.toggle(containerEl, {
			name: "Bind Mod+§ to show or hide chrome",
			desc: `The command is always available to bind yourself under Hotkeys. ${RELOAD_NOTE}`,
			get: () => this.settings.appearance.hideChromeHotkey,
			set: (value) => (this.settings.appearance.hideChromeHotkey = value),
		});
	}

	private displayWorkspace(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Workspace").setHeading();

		this.toggle(containerEl, {
			name: "Open graph links in the main pane",
			desc: `Clicking a node in a sidebar graph opens the note in the main pane instead of replacing the graph. Patches an Obsidian internal, so it is off by default. ${RELOAD_NOTE}`,
			get: () => this.settings.workspace.sidebarGraphNavigation,
			set: (value) => (this.settings.workspace.sidebarGraphNavigation = value),
		});

		this.toggle(containerEl, {
			name: "Source mode toggle on mobile",
			desc: `Repurposes the editing-mode button in the mobile toolbar to switch between source and live preview. Patches an Obsidian internal, so it is off by default. ${RELOAD_NOTE}`,
			get: () => this.settings.workspace.mobileSourceToggle,
			set: (value) => (this.settings.workspace.mobileSourceToggle = value),
		});
	}

	private toggle(
		containerEl: HTMLElement,
		options: {
			name: string;
			desc: string;
			get: () => boolean;
			set: (value: boolean) => void;
			rerender?: boolean;
		},
	): void {
		new Setting(containerEl)
			.setName(options.name)
			.setDesc(options.desc)
			.addToggle((toggle) =>
				toggle.setValue(options.get()).onChange((value) => {
					options.set(value);
					this.save();
					if (options.rerender) this.display();
				}),
			);
	}
}
