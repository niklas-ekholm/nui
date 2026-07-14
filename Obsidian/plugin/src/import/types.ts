
export interface ImportPreset {
	id: string;
	name: string;
	sourceFolder: string;
	destinationFolder: string;
	onlyPublishMarked: boolean;
}

export interface ImportSettings {
	presets: ImportPreset[];
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
	presets: [],
};

export function mergeImportSettings(
	loaded: Partial<ImportSettings> | null | undefined,
): ImportSettings {
	if (!loaded?.presets?.length) {
		return { ...DEFAULT_IMPORT_SETTINGS };
	}

	return {
		presets: loaded.presets
			.filter(
				(preset): preset is ImportPreset =>
					typeof preset?.id === "string" &&
					typeof preset?.sourceFolder === "string" &&
					typeof preset?.destinationFolder === "string",
			)
			.map((preset) => ({
				id: preset.id,
				name: typeof preset.name === "string" ? preset.name.trim() : "",
				sourceFolder: preset.sourceFolder.trim(),
				destinationFolder: preset.destinationFolder.replace(/^\/+|\/+$/g, ""),
				onlyPublishMarked: preset.onlyPublishMarked !== false,
			})),
	};
}

export function presetCommandName(preset: ImportPreset): string {
	if (preset.name) {
		return preset.name;
	}
	const sourceName = folderDisplayName(preset.sourceFolder);
	const destinationName = folderDisplayName(preset.destinationFolder);
	return `Import ${sourceName} to ${destinationName}`;
}

function folderDisplayName(folderPath: string): string {
	const trimmed = folderPath.replace(/[\\/]+$/, "");
	const segments = trimmed.split(/[\\/]/);
	return segments[segments.length - 1] || trimmed;
}
