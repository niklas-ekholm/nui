
import { App, Notice, Setting } from "obsidian";
import { getVaultBasePath, pickFolder } from "./electron-dialog";
import {
	ExportPreset,
	ExportSettings,
	presetCommandName,
} from "./types";

export function displayExportSettings(
	containerEl: HTMLElement,
	app: App,
	getSettings: () => ExportSettings,
	updateSettings: (settings: ExportSettings) => void,
): void {
	containerEl.createEl("h2", { text: "Export" });

	containerEl.createEl("p", {
		cls: "setting-item-description",
		text: "Configure one-click export presets.",
	});

	const presetsContainer = containerEl.createDiv("nui-export-presets");

	const renderPresets = () => {
		presetsContainer.empty();
		const presets = getSettings().presets;

		for (const preset of presets) {
			renderPresetSetting(
				presetsContainer,
				app,
				preset,
				getSettings,
				updateSettings,
				renderPresets,
			);
		}

		new Setting(presetsContainer)
			.addButton((button) =>
				button
					.setButtonText("Add preset")
					.setCta()
					.onClick(() => {
						const nextPreset: ExportPreset = {
							id: crypto.randomUUID(),
							name: "",
							sourceFolder: "",
							destinationFolder: "",
							onlyPublishMarked: true,
						};
						updateSettings({
							presets: [...getSettings().presets, nextPreset],
						});
						renderPresets();
					}),
			);
	};

	renderPresets();
}

function renderPresetSetting(
	containerEl: HTMLElement,
	app: App,
	preset: ExportPreset,
	getSettings: () => ExportSettings,
	updateSettings: (settings: ExportSettings) => void,
	rerender: () => void,
): void {
	const currentPreset = () => getPreset(getSettings, preset.id);

	containerEl.createEl("h3", { text: presetCommandName(currentPreset()) });

	new Setting(containerEl)
		.setName("Command name")
		.setDesc("Name shown in the command palette. Leave empty to use the default.")
		.addText((text) => {
			text.setPlaceholder(presetCommandName(currentPreset()))
				.setValue(currentPreset().name)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						name: value.trim(),
					});
				});
		});

	new Setting(containerEl)
		.setName("Source folder")
		.setDesc("Vault-relative folder to export from.")
		.addText((text) => {
			text.setPlaceholder("index/media/Content")
				.setValue(currentPreset().sourceFolder)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						sourceFolder: value.replace(/^\/+|\/+$/g, ""),
					});
				});
		})
		.addButton((button) =>
			button
				.setButtonText("Browse")
				.onClick(async () => {
					const vaultBasePath = getVaultBasePath(app.vault.adapter);
					const defaultPath = currentPreset().sourceFolder
						? pathJoin(vaultBasePath, currentPreset().sourceFolder)
						: vaultBasePath ?? undefined;
					const picked = await pickFolder({
						title: "Choose source folder",
						defaultPath,
						buttonLabel: "Choose source",
					});
					if (!picked || !vaultBasePath) {
						if (!vaultBasePath) {
							new Notice("Could not resolve vault path.");
						}
						return;
					}

					const relative = toVaultRelativePath(vaultBasePath, picked);
					if (!relative) {
						new Notice("Choose a folder inside the vault.");
						return;
					}

					updatePreset(getSettings, updateSettings, preset.id, {
						sourceFolder: relative,
					});
					rerender();
				}),
		);

	new Setting(containerEl)
		.setName("Destination folder")
		.setDesc("Filesystem folder to export into.")
		.addText((text) => {
			text.setPlaceholder("/Users/you/Sites/media/content")
				.setValue(currentPreset().destinationFolder)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						destinationFolder: value.trim(),
					});
				});
		})
		.addButton((button) =>
			button
				.setButtonText("Browse")
				.onClick(async () => {
					const picked = await pickFolder({
						title: "Choose destination folder",
						defaultPath: currentPreset().destinationFolder || undefined,
						buttonLabel: "Choose destination",
					});
					if (!picked) {
						return;
					}

					updatePreset(getSettings, updateSettings, preset.id, {
						destinationFolder: picked,
					});
					rerender();
				}),
		);

	new Setting(containerEl)
		.setName("Export only notes with property publish: true")
		.addToggle((toggle) =>
			toggle
				.setValue(currentPreset().onlyPublishMarked)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						onlyPublishMarked: value,
					});
				}),
		);

	new Setting(containerEl).addButton((button) =>
		button
			.setButtonText("Remove preset")
			.setWarning()
			.onClick(() => {
				updateSettings({
					presets: getSettings().presets.filter(
						(entry) => entry.id !== preset.id,
					),
				});
				rerender();
			}),
	);
}

function getPreset(
	getSettings: () => ExportSettings,
	presetId: string,
): ExportPreset {
	return (
		getSettings().presets.find((preset) => preset.id === presetId) ?? {
			id: presetId,
			name: "",
			sourceFolder: "",
			destinationFolder: "",
			onlyPublishMarked: true,
		}
	);
}

function updatePreset(
	getSettings: () => ExportSettings,
	updateSettings: (settings: ExportSettings) => void,
	presetId: string,
	partial: Partial<ExportPreset>,
): void {
	updateSettings({
		presets: getSettings().presets.map((preset) =>
			preset.id === presetId ? { ...preset, ...partial } : preset,
		),
	});
}

function pathJoin(basePath: string | null, relativePath: string): string | undefined {
	if (!basePath) {
		return undefined;
	}

	return `${basePath.replace(/[\\/]+$/, "")}/${relativePath.replace(/^\/+/, "")}`;
}

function toVaultRelativePath(
	vaultBasePath: string,
	absolutePath: string,
): string | null {
	const normalizedBase = vaultBasePath.replace(/[\\/]+$/, "");
	const normalizedAbsolute = absolutePath.replace(/[\\/]+$/, "");

	if (
		normalizedAbsolute === normalizedBase ||
		normalizedAbsolute.startsWith(`${normalizedBase}/`) ||
		normalizedAbsolute.startsWith(`${normalizedBase}\\`)
	) {
		return normalizedAbsolute
			.slice(normalizedBase.length)
			.replace(/^[/\\]+/, "")
			.replace(/\\/g, "/");
	}

	return null;
}
