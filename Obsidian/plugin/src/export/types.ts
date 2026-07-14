
export interface ExportPreset {
	id: string;
	name: string;
	sourceFolder: string;
	destinationFolder: string;
	onlyPublishMarked: boolean;
}

export interface ExportSettings {
	presets: ExportPreset[];
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
	presets: [],
};

export function mergeExportSettings(
	loaded: Partial<ExportSettings> | null | undefined,
): ExportSettings {
	if (!loaded?.presets?.length) {
		return { ...DEFAULT_EXPORT_SETTINGS };
	}

	return {
		presets: loaded.presets
			.filter(
				(preset): preset is ExportPreset =>
					typeof preset?.id === "string" &&
					typeof preset?.sourceFolder === "string" &&
					typeof preset?.destinationFolder === "string",
			)
			.map((preset) => ({
				id: preset.id,
				name: typeof preset.name === "string" ? preset.name.trim() : "",
				sourceFolder: preset.sourceFolder.replace(/^\/+|\/+$/g, ""),
				destinationFolder: preset.destinationFolder.trim(),
				onlyPublishMarked: preset.onlyPublishMarked !== false,
			})),
	};
}

export function presetCommandName(preset: ExportPreset): string {
	if (preset.name) {
		return preset.name;
	}
	const sourceName = folderDisplayName(preset.sourceFolder);
	const destinationName = folderDisplayName(preset.destinationFolder);
	return `Export ${sourceName} to ${destinationName}`;
}

function folderDisplayName(folderPath: string): string {
	const trimmed = folderPath.replace(/[\\/]+$/, "");
	const segments = trimmed.split(/[\\/]/);
	return segments[segments.length - 1] || trimmed;
}
