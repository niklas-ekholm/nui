import type { ColorPickerHistoryHost } from "../shared/host";
import { normalizeHexColor } from "./text-color-utils.ts";

export const RECENT_COLOR_LIMIT = 10;

export type ColorPickerHistory = {
	recentColors: readonly string[];
	rememberColor: (color: string) => void | Promise<void>;
};

export type { ColorPickerHistoryHost } from "../shared/host";

export function mergeRecentColors(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const seen = new Set<string>();
	const colors: string[] = [];
	for (const entry of value) {
		const normalized = normalizeHexColor(entry);
		if (!normalized || seen.has(normalized)) {
			continue;
		}
		seen.add(normalized);
		colors.push(normalized);
		if (colors.length >= RECENT_COLOR_LIMIT) {
			break;
		}
	}

	return colors;
}

export function pushRecentColor(colors: string[], color: string): string[] {
	const normalized = normalizeHexColor(color);
	if (!normalized) {
		return colors;
	}

	return [
		normalized,
		...colors.filter((entry) => entry !== normalized),
	].slice(0, RECENT_COLOR_LIMIT);
}

export function getColorPickerHistory(
	host: ColorPickerHistoryHost,
): ColorPickerHistory {
	return {
		recentColors: host.settings.editor.recentColors,
		rememberColor: async (color) => {
			host.settings.editor.recentColors = pushRecentColor(
				host.settings.editor.recentColors,
				color,
			);
			await host.saveSettings();
		},
	};
}
