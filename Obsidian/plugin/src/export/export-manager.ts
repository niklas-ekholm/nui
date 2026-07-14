
import { Notice, Platform, Plugin } from "obsidian";
import { FolderIndexManager } from "../navigation/folder-index";
import { pickFolder } from "./electron-dialog";
import { runExportFolder } from "./export-folder";
import {
	ExportPreset,
	ExportSettings,
	mergeExportSettings,
	presetCommandName,
} from "./types";

export class ExportManager {
	private registeredPresetIds = new Set<string>();

	constructor(
		private plugin: Plugin,
		private getSettings: () => ExportSettings,
		private getFolderIndexManager: () => FolderIndexManager | null,
	) {}

	onload(): void {
		if (!Platform.isDesktopApp) {
			return;
		}

		this.plugin.addCommand({
			id: "export-folder",
			name: "Export folder",
			callback: () => {
				void this.exportCurrentFolderWithDialog();
			},
		});

		this.syncPresetCommands();
	}

	onSettingsChanged(): void {
		this.syncPresetCommands();
	}

	private syncPresetCommands(): void {
		const presets = this.getSettings().presets;
		const nextIds = new Set(presets.map((preset) => preset.id));

		for (const presetId of this.registeredPresetIds) {
			if (!nextIds.has(presetId)) {
				this.plugin.removeCommand(`export-preset-${presetId}`);
				this.registeredPresetIds.delete(presetId);
			}
		}

		for (const preset of presets) {
			if (!this.isValidPreset(preset)) {
				continue;
			}

			const commandId = `export-preset-${preset.id}`;
			if (this.registeredPresetIds.has(preset.id)) {
				this.plugin.removeCommand(commandId);
			}

			this.plugin.addCommand({
				id: commandId,
				name: presetCommandName(preset),
				callback: () => {
					void runExportFolder(
						this.plugin.app,
						preset.sourceFolder,
						preset.destinationFolder,
						{ onlyPublishMarked: preset.onlyPublishMarked },
					);
				},
			});
			this.registeredPresetIds.add(preset.id);
		}
	}

	private async exportCurrentFolderWithDialog(): Promise<void> {
		const sourceFolderPath =
			this.getFolderIndexManager()?.resolveTargetFolderPath();
		if (!sourceFolderPath) {
			new Notice(
				"No folder context. Click a folder in the file explorer or open a note first.",
			);
			return;
		}

		const destinationPath = await pickFolder({
			title: "Choose export destination",
			buttonLabel: "Export here",
		});
		if (!destinationPath) {
			return;
		}

		await runExportFolder(
			this.plugin.app,
			sourceFolderPath,
			destinationPath,
			{ onlyPublishMarked: true },
		);
	}

	private isValidPreset(preset: ExportPreset): boolean {
		return Boolean(preset.sourceFolder && preset.destinationFolder);
	}
}

export function loadExportSettings(
	loaded:
		| Partial<{ export?: Partial<ExportSettings>; publish?: Partial<ExportSettings> }>
		| null
		| undefined,
): ExportSettings {
	return mergeExportSettings(loaded?.export ?? loaded?.publish ?? null);
}
