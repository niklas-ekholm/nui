
import { App, Notice, Setting } from "obsidian";
import { getVaultBasePath, pickFolder } from "../export/electron-dialog";
import {
	ImportPreset,
	ImportSettings,
	presetCommandName,
} from "./types";

export function displayImportSettings(
	containerEl: HTMLElement,
	app: App,
	getSettings: () => ImportSettings,
	updateSettings: (settings: ImportSettings) => void,
): void {
	containerEl.createEl("h2", { text: "Import" });

	containerEl.createEl("p", {
		cls: "setting-item-description",
		text: "Configure one-click import presets.",
	});

	const presetsContainer = containerEl.createDiv("nui-import-presets");

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
						const nextPreset: ImportPreset = {
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
	preset: ImportPreset,
	getSettings: () => ImportSettings,
	updateSettings: (settings: ImportSettings) => void,
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
		.setDesc("Filesystem folder to import from.")
		.addText((text) => {
			text.setPlaceholder("/Users/you/Sites/media/content")
				.setValue(currentPreset().sourceFolder)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						sourceFolder: value.trim(),
					});
				});
		})
		.addButton((button) =>
			button
				.setButtonText("Browse")
				.onClick(async () => {
					const picked = await pickFolder({
						title: "Choose source folder",
						defaultPath: currentPreset().sourceFolder || undefined,
						buttonLabel: "Choose source",
					});
					if (!picked) {
						return;
					}

					updatePreset(getSettings, updateSettings, preset.id, {
						sourceFolder: picked,
					});
					rerender();
				}),
		);

	new Setting(containerEl)
		.setName("Destination folder")
		.setDesc("Vault-relative folder to import into.")
		.addText((text) => {
			text.setPlaceholder("index/media/Content")
				.setValue(currentPreset().destinationFolder)
				.onChange((value) => {
					updatePreset(getSettings, updateSettings, preset.id, {
						destinationFolder: value.replace(/^\/+|\/+$/g, ""),
					});
				});
		})
		.addButton((button) =>
			button
				.setButtonText("Browse")
				.onClick(async () => {
					const vaultBasePath = getVaultBasePath(app.vault.adapter);
					const defaultPath = currentPreset().destinationFolder
						? pathJoin(vaultBasePath, currentPreset().destinationFolder)
						: vaultBasePath ?? undefined;
					const picked = await pickFolder({
						title: "Choose destination folder",
						defaultPath,
						buttonLabel: "Choose destination",
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
						destinationFolder: relative,
					});
					rerender();
				}),
		);

	new Setting(containerEl)
		.setName("Import only notes with property publish: true")
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
	getSettings: () => ImportSettings,
	presetId: string,
): ImportPreset {
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
	getSettings: () => ImportSettings,
	updateSettings: (settings: ImportSettings) => void,
	presetId: string,
	partial: Partial<ImportPreset>,
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
