import { MarkdownView, type Plugin } from "obsidian";
import {
	applySpanColor,
	clearSpanColor,
	getSpanColorFromSelection,
} from "./apply-span-color";
import { openNoteTextColorPicker } from "./note-text-color";
import { openTextColorPicker } from "./text-color-picker-modal";
import { textColorMarkupExtension } from "./text-color-markup-deco";

export function registerTextColorMenu(plugin: Plugin): void {
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

						openNoteTextColorPicker(plugin.app, file);
					});
			});
		}),
	);
}

export function registerNoteTextColorCommand(plugin: Plugin): void {
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

			openNoteTextColorPicker(plugin.app, view.file);
			return true;
		},
	});
}
