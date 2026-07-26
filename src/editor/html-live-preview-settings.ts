export type HtmlLivePreviewSettings = {
	alwaysRenderHtmlInLivePreview: boolean;
};

export const DEFAULT_HTML_LIVE_PREVIEW_SETTINGS: HtmlLivePreviewSettings = {
	alwaysRenderHtmlInLivePreview: true,
};

export function mergeHtmlLivePreviewSettings(
	loaded: Partial<HtmlLivePreviewSettings> | null | undefined,
): HtmlLivePreviewSettings {
	return {
		alwaysRenderHtmlInLivePreview:
			loaded?.alwaysRenderHtmlInLivePreview ??
			DEFAULT_HTML_LIVE_PREVIEW_SETTINGS.alwaysRenderHtmlInLivePreview,
	};
}
