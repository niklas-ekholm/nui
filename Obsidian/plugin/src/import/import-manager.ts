
import { Notice, Platform, Plugin } from "obsidian";
import { FolderIndexManager } from "../navigation/folder-index";
import { pickFolder } from "../export/electron-dialog";
import { runImportFolder } from "./import-folder";
import {
	ImportPreset,
	ImportSettings,
	mergeImportSettings,
	presetCommandName,
} from "./types";

export class ImportManager {
	private registeredPresetIds = new Set<string>();

	constructor(
		private plugin: Plugin,
		private getSettings: () => ImportSettings,
		private getFolderIndexManager: () => FolderIndexManager | null,
	) {}

	onload(): void {
		if (!Platform.isDesktopApp) {
			return;
		}

		this.plugin.addCommand({
			id: "import-folder",
			name: "Import folder",
			callback: () => {
				void this.importCurrentFolderWithDialog();
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
				this.plugin.removeCommand(`import-preset-${presetId}`);
				this.registeredPresetIds.delete(presetId);
			}
		}

		for (const preset of presets) {
			if (!this.isValidPreset(preset)) {
				continue;
			}

			const commandId = `import-preset-${preset.id}`;
			if (this.registeredPresetIds.has(preset.id)) {
				this.plugin.removeCommand(commandId);
			}

			this.plugin.addCommand({
				id: commandId,
				name: presetCommandName(preset),
				callback: () => {
					void runImportFolder(
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

	private async importCurrentFolderWithDialog(): Promise<void> {
		const destinationFolderPath =
			this.getFolderIndexManager()?.resolveTargetFolderPath();
		if (!destinationFolderPath) {
			new Notice(
				"No folder context. Click a folder in the file explorer or open a note first.",
			);
			return;
		}

		const sourcePath = await pickFolder({
			title: "Choose import source",
			buttonLabel: "Import from here",
		});
		if (!sourcePath) {
			return;
		}

		await runImportFolder(
			this.plugin.app,
			sourcePath,
			destinationFolderPath,
			{ onlyPublishMarked: true },
		);
	}

	private isValidPreset(preset: ImportPreset): boolean {
		return Boolean(preset.sourceFolder && preset.destinationFolder);
	}
}

export function loadImportSettings(
	loaded: Partial<{ import?: Partial<ImportSettings> }> | null | undefined,
): ImportSettings {
	return mergeImportSettings(loaded?.import ?? null);
}
