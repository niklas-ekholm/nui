import type {
	AppearanceSettings,
	WorkspaceSettings,
} from "../settings/nui-settings";

/**
 * `styles.css` is loaded whenever the plugin is enabled, so any rule that
 * touches a vanilla Obsidian selector has to be scoped to a body class the
 * plugin only sets when the matching setting is on. Without that, turning a
 * feature off would leave its styling behind.
 */
const BODY_CLASSES = {
	showPanelEdges: "nui-show-panel-edges",
	hideEmbedEditButtons: "nui-hide-embed-edit-buttons",
	fadeBasesChrome: "nui-fade-bases-chrome",
	mobileSourceToggle: "nui-mobile-source-toggle",
} as const;

export function applyBodyClasses(
	appearance: AppearanceSettings,
	workspace: WorkspaceSettings,
): void {
	const { classList } = document.body;
	classList.toggle(BODY_CLASSES.showPanelEdges, appearance.showPanelEdges);
	classList.toggle(
		BODY_CLASSES.hideEmbedEditButtons,
		appearance.hideEmbedEditButtons,
	);
	classList.toggle(BODY_CLASSES.fadeBasesChrome, appearance.fadeBasesChrome);
	classList.toggle(
		BODY_CLASSES.mobileSourceToggle,
		workspace.mobileSourceToggle,
	);
}

/** Leave no trace on unload. */
export function clearBodyClasses(): void {
	for (const cls of Object.values(BODY_CLASSES)) {
		document.body.classList.remove(cls);
	}
}
