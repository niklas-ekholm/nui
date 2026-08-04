import { App, Notice, Platform, PluginSettingTab, Setting } from "obsidian";
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
		this.displayHotkeys(containerEl);
	}

	/**
	 * Every command this plugin ships is bindable under Settings → Hotkeys. Two
	 * of them also carry a default binding, and those two are gathered here
	 * rather than in the feature sections they belong to, so that "which keys
	 * does NUI take?" has one answer in one place.
	 */
	private hotkeyDefaults(): {
		name: string;
		combo: string;
		get: () => boolean;
		set: (value: boolean) => void;
		inert?: string;
	}[] {
		return [
			{
				name: "Go to parent folder",
				combo: "Mod+Escape",
				get: () => this.settings.folderIndex.goToParentHotkey,
				set: (value) => (this.settings.folderIndex.goToParentHotkey = value),
				// The command drives the folder-index manager, which only exists
				// when that feature is on. Binding the key regardless would be a
				// dead key, so say so rather than quietly turning the feature on.
				inert: this.settings.folderIndex.enabled
					? undefined
					: "Stays inert until “Open hub note on folder click” is on, above.",
			},
			{
				name: "Show or hide chrome",
				combo: "Mod+Alt+`",
				get: () => this.settings.appearance.hideChromeHotkey,
				set: (value) => (this.settings.appearance.hideChromeHotkey = value),
			},
		];
	}

	private displayHotkeys(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Hotkeys").setHeading();

		const defaults = this.hotkeyDefaults();
		const allOn = defaults.every((row) => row.get());
		const allOff = defaults.every((row) => !row.get());

		// A default binding is handed to Obsidian when the command is registered,
		// which happens once at load. Flipping a toggle here changes nothing the
		// user can feel until then, and the buttons look like they act at once —
		// so say it out loud rather than leaving it as trailing description text.
		const announceReload = () => {
			if (!Platform.isDesktopApp) return;
			new Notice(
				"Hotkey setting saved. Reload Obsidian for it to take effect — Cmd/Ctrl+P, “Reload app without saving”.",
				8000,
			);
		};

		const setAll = (value: boolean) => {
			for (const row of defaults) row.set(value);
			this.save();
			announceReload();
			this.display();
		};

		new Setting(containerEl)
			.setDesc(
				`Every NUI command is bindable under Settings → Hotkeys — search for “NUI”. The ${defaults.length} below also ship a default binding, and this turns them on together. ` +
					(Platform.isDesktopApp
						? RELOAD_NOTE
						: "Default bindings apply on desktop only."),
			)
			.addButton((button) =>
				button
					.setButtonText("Turn all on")
					.setCta()
					.setDisabled(allOn)
					.onClick(() => setAll(true)),
			)
			.addButton((button) =>
				button
					.setButtonText("Turn all off")
					.setDisabled(allOff)
					.onClick(() => setAll(false)),
			);

		for (const row of defaults) {
			const desc = [`Binds ${row.combo}.`, row.inert, RELOAD_NOTE]
				.filter((part): part is string => Boolean(part))
				.join(" ");
			new Setting(containerEl)
				.setName(row.name)
				.setDesc(desc)
				.addToggle((toggle) =>
					toggle.setValue(row.get()).onChange((value) => {
						row.set(value);
						this.save();
						announceReload();
						this.display();
					}),
				);
		}
	}

	private displayFolderIndex(containerEl: HTMLElement): void {
		new Setting(containerEl).setName("Folder index").setHeading();

		new Setting(containerEl)
			.setName("Open hub note on folder click")
			.setDesc(
				"Clicking a folder in the file explorer, or a folder in the note header breadcrumb, opens that folder's hub note, FolderName.md. If it doesn't exist yet, clicking creates it. The chevron still expands and collapses.",
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
			desc: `Adds commands for adding cursors, selecting the next or all matches, placing cursors at line ends, and copying a line up or down. They ship without hotkeys. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.multiCursorCommands,
			set: (value) => (this.settings.editor.multiCursorCommands = value),
		});

		this.toggle(containerEl, {
			name: "Text colour",
			desc: `Adds a colour picker to the editor context menu and a command to colour the current note. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.textColor,
			set: (value) => (this.settings.editor.textColor = value),
		});

		if (Platform.isDesktopApp) {
			this.toggle(containerEl, {
				name: "Selection formatting toolbar",
				desc: `Shows a floating formatting toolbar when text is selected (desktop only; mobile uses the system toolbar). ${RELOAD_NOTE}`,
				get: () => this.settings.editor.selectionToolbar,
				set: (value) => (this.settings.editor.selectionToolbar = value),
			});
		}

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

		if (this.settings.editor.collapsibleProperties) {
			this.toggle(containerEl, {
				name: "Collapse properties",
				desc: "When on, note properties stay folded away. The button beside the note title toggles this.",
				get: () => this.settings.editor.collapseProperties,
				set: (value) => {
					this.settings.editor.collapseProperties = value;
					this.plugin.refreshCollapsibleProperties?.();
				},
			});
		}

		this.toggle(containerEl, {
			name: "Nested properties",
			desc: `Shows nested YAML frontmatter as a collapsible tree in the Properties block. ${RELOAD_NOTE}`,
			get: () => this.settings.editor.nestedProperties,
			set: (value) => {
				this.settings.editor.nestedProperties = value;
				this.plugin.refreshNestedProperties?.();
			},
		});

		if (this.settings.editor.nestedProperties) {
			this.toggle(containerEl, {
				name: "Collapse nested properties",
				desc: "When on, nested property branches start collapsed.",
				get: () => this.settings.editor.nestedPropertiesDefaultCollapsed,
				set: (value) => {
					this.settings.editor.nestedPropertiesDefaultCollapsed = value;
					this.plugin.refreshNestedProperties?.();
				},
			});
		}

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
						this.plugin.applyAppearance();
					}),
			);
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
