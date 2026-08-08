import { MarkdownView } from "obsidian";
import type { ColorPickerHistoryHost } from "../shared/host";
import {
	applySpanColor,
	clearSpanColor,
	getSpanColorFromSelection,
} from "./apply-span-color";
import { getColorPickerHistory } from "./color-picker-history";
import { openNoteTextColorPicker } from "./note-text-color";
import { openTextColorPicker } from "./text-color-picker-modal";
import { textColorMarkupExtension } from "./text-color-markup-deco";

export function registerTextColorMenu(plugin: ColorPickerHistoryHost): void {
	plugin.registerEditorExtension(textColorMarkupExtension);

	plugin.registerEvent(
		plugin.app.workspace.on("editor-menu", (menu, editor, view) => {
			if (!(view instanceof MarkdownView)) {
				return;
			}

			menu.addItem((item) => {
				item
					.setTitle("Text Color")
					.setIcon("palette")
					.onClick(() => {
						if (editor.somethingSelected()) {
							openTextColorPicker(plugin.app, {
								mode: "span",
								initialColor: getSpanColorFromSelection(editor),
								history: getColorPickerHistory(plugin),
								onApply: (color) => {
									applySpanColor(editor, color);
								},
								onClear: () => {
									clearSpanColor(editor);
								},
							});
							return;
						}

						const file = view.file;
						if (!file) {
							return;
						}

						openNoteTextColorPicker(plugin, file);
					});
			});
		}),
	);
}

export function registerNoteTextColorCommand(plugin: ColorPickerHistoryHost): void {
	plugin.addCommand({
		id: "set-note-text-color",
		name: "Set note text color",
		editorCheckCallback: (checking, editor, view) => {
			if (!(view instanceof MarkdownView) || !view.file) {
				return false;
			}

			if (checking) {
				return true;
			}

			openNoteTextColorPicker(plugin, view.file);
			return true;
		},
	});
}
