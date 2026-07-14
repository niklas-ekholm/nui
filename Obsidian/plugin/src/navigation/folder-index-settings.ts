
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { displayExportSettings } from "../export/export-settings-tab";
import { ExportSettings } from "../export/types";
import { displayImportSettings } from "../import/import-settings-tab";
import { ImportSettings } from "../import/types";
import { FolderIndexSettings } from "./types";

export class FolderIndexSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private getSettings: () => FolderIndexSettings,
		private updateSettings: (partial: Partial<FolderIndexSettings>) => void,
		private getExportSettings: () => ExportSettings,
		private updateExportSettings: (settings: ExportSettings) => void,
		private getImportSettings: () => ImportSettings,
		private updateImportSettings: (settings: ImportSettings) => void,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Folder index" });

		new Setting(containerEl)
			.setName("Open index on folder click")
			.setDesc(
				"Click a folder title in the file explorer or a folder segment in the note header breadcrumb to open its folder index note (FolderName.md). Use the chevron to expand or collapse folders in the sidebar.",
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
				"Hide FolderName.md entries from the sidebar file list when they match the folder name.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.getSettings().hideIndexInExplorer)
					.onChange((value) => {
						this.updateSettings({ hideIndexInExplorer: value });
					}),
			);

		displayExportSettings(
			containerEl,
			this.app,
			this.getExportSettings,
			this.updateExportSettings,
		);

		displayImportSettings(
			containerEl,
			this.app,
			this.getImportSettings,
			this.updateImportSettings,
		);
	}
}

