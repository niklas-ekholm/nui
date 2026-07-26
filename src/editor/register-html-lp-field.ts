import { Compartment, type Extension } from "@codemirror/state";
import type { Plugin } from "obsidian";
import type { HtmlLivePreviewSettings } from "./html-live-preview-settings";
import {
	createHtmlLpExtension,
	dispatchHtmlLpRefresh,
} from "./nui-html-lp-field";

const htmlLpCompartment = new Compartment();

export function registerHtmlLpField(
	plugin: Plugin,
	getSettings: () => HtmlLivePreviewSettings,
): void {
	const configure = (): Extension =>
		getSettings().alwaysRenderHtmlInLivePreview
			? createHtmlLpExtension(
					() => getSettings().alwaysRenderHtmlInLivePreview,
				)
			: [];

	plugin.registerEditorExtension(htmlLpCompartment.of(configure()));

	plugin.registerHtmlLpRefresh = () => {
		const cmExtension = configure();
		plugin.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view;
			if (!("editor" in view) || typeof view.editor !== "object") {
				return;
			}

			const editor = view.editor as {
				cm?: { dispatch: (spec: { effects: unknown }) => void };
			};
			editor.cm?.dispatch({
				effects: htmlLpCompartment.reconfigure(cmExtension),
			});
		});
		dispatchHtmlLpRefresh(plugin.app);
	};
}

declare module "obsidian" {
	interface Plugin {
		registerHtmlLpRefresh?: () => void;
	}
}
