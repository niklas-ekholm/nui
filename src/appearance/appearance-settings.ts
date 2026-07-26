export type AppearanceSettings = {
	showPanelEdges: boolean;
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
	showPanelEdges: false,
};

export function mergeAppearanceSettings(
	loaded: Partial<AppearanceSettings> | null | undefined,
): AppearanceSettings {
	return {
		showPanelEdges:
			loaded?.showPanelEdges ?? DEFAULT_APPEARANCE_SETTINGS.showPanelEdges,
	};
}

const PANEL_EDGES_BODY_CLASS = "nui-show-panel-edges";

export function applyPanelEdgesSetting(settings: AppearanceSettings): void {
	document.body.classList.toggle(
		PANEL_EDGES_BODY_CLASS,
		settings.showPanelEdges,
	);
}
