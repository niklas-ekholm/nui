
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { AppearanceSettings } from "../appearance/appearance-settings";
import { HtmlLivePreviewSettings } from "../editor/html-live-preview-settings";
import { FolderIndexSettings } from "./types";

export class FolderIndexSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private getSettings: () => FolderIndexSettings,
		private updateSettings: (partial: Partial<FolderIndexSettings>) => void,
		private getHtmlLivePreviewSettings: () => HtmlLivePreviewSettings,
		private updateHtmlLivePreviewSettings: (
			partial: Partial<HtmlLivePreviewSettings>,
		) => void,
		private getAppearanceSettings: () => AppearanceSettings,
		private updateAppearanceSettings: (
			partial: Partial<AppearanceSettings>,
		) => void,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Appearance" });

		new Setting(containerEl)
			.setName("Show panel edges")
			.setDesc(
				"Show a very faint border between panels (sidebars, tabs, and editor panes).",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.getAppearanceSettings().showPanelEdges)
					.onChange((value) => {
						this.updateAppearanceSettings({ showPanelEdges: value });
					}),
			);

		containerEl.createEl("h2", { text: "Editor" });

		new Setting(containerEl)
			.setName("Always render HTML in Live Preview")
			.setDesc(
				"Keep color span tags hidden and text colored in Live Preview even when the cursor is inside them. Turn off to use Obsidian's default HTML editing behavior.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.getHtmlLivePreviewSettings().alwaysRenderHtmlInLivePreview,
					)
					.onChange((value) => {
						this.updateHtmlLivePreviewSettings({
							alwaysRenderHtmlInLivePreview: value,
						});
					}),
			);

		containerEl.createEl("h2", { text: "Folder index" });

		new Setting(containerEl)
			.setName("Open index on folder click")
			.setDesc(
				"Click a folder title in the file explorer or a folder segment in the note header breadcrumb to open its folder index note (index.md). Use the chevron to expand or collapse folders in the sidebar.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.getSettings().enabled)
					.onChange((value) => {
						this.updateSettings({ enabled: value });
					}),
			);

		new Setting(containerEl)
			.setName("Hide folder index files in file explorer")
			.setDesc(
				"Hide index.md entries from the sidebar file list.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.getSettings().hideIndexInExplorer)
					.onChange((value) => {
						this.updateSettings({ hideIndexInExplorer: value });
					}),
			);
	}
}

