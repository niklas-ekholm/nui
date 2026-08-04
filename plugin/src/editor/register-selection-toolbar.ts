import { EditorState, StateField } from "@codemirror/state";
import {
	EditorView,
	showTooltip,
	type Tooltip,
	type TooltipView,
} from "@codemirror/view";
import {
	MarkdownView,
	setIcon,
	type App,
	type Editor,
	type Plugin,
} from "obsidian";
import {
	applySpanColor,
	clearSpanColor,
	getSpanColorFromSelection,
} from "./apply-span-color";
import {
	headingLevelAt,
	nextHeadingLevel,
} from "./selection-toolbar-heading";
import { openTextColorPicker } from "./text-color-picker-modal";
import { DEFAULT_TEXT_COLOR } from "./text-color-utils";

export { headingLevelAt, nextHeadingLevel } from "./selection-toolbar-heading";

type CommandsApp = App & {
	commands: { executeCommandById(id: string): boolean };
};

type ToolbarHost = Plugin & {
	settings: { editor: { textColor: boolean } };
};

type ActionDef =
	| {
			kind: "command";
			id: string;
			icon: string;
			label: string;
	  }
	| {
			kind: "heading";
			label: string;
	  }
	| {
			kind: "color";
			label: string;
	  };

const ACTIONS: ActionDef[] = [
	{ kind: "heading", label: "Heading" },
	{ kind: "command", id: "editor:toggle-bold", icon: "lucide-bold", label: "Bold" },
	{
		kind: "command",
		id: "editor:toggle-italics",
		icon: "lucide-italic",
		label: "Italic",
	},
	{
		kind: "command",
		id: "editor:toggle-strikethrough",
		icon: "lucide-strikethrough",
		label: "Strikethrough",
	},
	{
		kind: "command",
		id: "editor:insert-wikilink",
		icon: "bracket-glyph",
		label: "Wikilink",
	},
	{
		kind: "command",
		id: "editor:insert-link",
		icon: "lucide-link",
		label: "Link",
	},
	{
		kind: "command",
		id: "editor:toggle-numbered-list",
		icon: "lucide-list-ordered",
		label: "Numbered list",
	},
	{
		kind: "command",
		id: "editor:toggle-bullet-list",
		icon: "lucide-list",
		label: "Bullet list",
	},
	{
		kind: "command",
		id: "editor:toggle-blockquote",
		icon: "lucide-quote",
		label: "Blockquote",
	},
	{
		kind: "command",
		id: "editor:toggle-code",
		icon: "lucide-code-2",
		label: "Inline code",
	},
	{
		kind: "command",
		id: "editor:insert-codeblock",
		icon: "lucide-code",
		label: "Code block",
	},
	{
		kind: "command",
		id: "editor:toggle-highlight",
		icon: "lucide-highlighter",
		label: "Highlight",
	},
	{ kind: "color", label: "Text colour" },
];

function executeCommand(app: App, id: string): void {
	(app as CommandsApp).commands.executeCommandById(id);
}

function editorForView(app: App, view: EditorView): Editor | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const md = leaf.view;
		if (!(md instanceof MarkdownView)) continue;
		const cm = (md.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm === view) {
			return md.editor;
		}
	}
	const active = app.workspace.getActiveViewOfType(MarkdownView);
	if (active) {
		const cm = (active.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm === view) {
			return active.editor;
		}
	}
	return null;
}

function preservePointer(el: HTMLElement): void {
	el.addEventListener("pointerdown", (event) => {
		event.preventDefault();
	});
	el.addEventListener("mousedown", (event) => {
		event.preventDefault();
	});
}

function buildToolbar(
	view: EditorView,
	app: App,
	includeColor: boolean,
): HTMLElement {
	const root = document.createElement("div");
	root.className = "nui-selection-toolbar";
	root.setAttribute("role", "toolbar");

	const level = headingLevelAt(view.state, view.state.selection.main.head);

	for (const action of ACTIONS) {
		if (action.kind === "color" && !includeColor) {
			continue;
		}

		if (action.kind === "command") {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "nui-selection-toolbar-btn clickable-icon";
			button.setAttribute("aria-label", action.label);
			setIcon(button, action.icon);
			preservePointer(button);
			button.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();
				executeCommand(app, action.id);
				view.focus();
			});
			root.appendChild(button);
			continue;
		}

		if (action.kind === "heading") {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "nui-selection-toolbar-btn clickable-icon";
			button.setAttribute(
				"aria-label",
				level === 0 ? "Heading" : `Heading ${level} — cycle level`,
			);
			setIcon(button, "heading-glyph");
			if (level > 0) {
				const badge = document.createElement("span");
				badge.className = "nui-selection-toolbar-heading-level";
				badge.textContent = `H${level}`;
				button.appendChild(badge);
			}
			preservePointer(button);
			button.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();
				const current = headingLevelAt(
					view.state,
					view.state.selection.main.head,
				);
				executeCommand(
					app,
					`editor:set-heading-${nextHeadingLevel(current)}`,
				);
				view.focus();
			});
			root.appendChild(button);
			continue;
		}

		const editor = editorForView(app, view);
		const currentColor = editor
			? getSpanColorFromSelection(editor)
			: DEFAULT_TEXT_COLOR;
		const button = document.createElement("button");
		button.type = "button";
		button.className =
			"nui-selection-toolbar-btn nui-selection-toolbar-swatch clickable-icon";
		button.setAttribute("aria-label", action.label);
		const swatch = document.createElement("span");
		swatch.className = "nui-selection-toolbar-swatch-fill";
		swatch.style.backgroundColor = currentColor;
		button.appendChild(swatch);
		preservePointer(button);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			const ed = editorForView(app, view);
			if (!ed || !ed.somethingSelected()) {
				return;
			}
			const from = ed.getCursor("from");
			const to = ed.getCursor("to");
			openTextColorPicker(app, {
				mode: "span",
				initialColor: getSpanColorFromSelection(ed),
				onApply: (color) => {
					ed.setSelection(from, to);
					applySpanColor(ed, color);
					view.focus();
				},
				onClear: () => {
					ed.setSelection(from, to);
					clearSpanColor(ed);
					view.focus();
				},
			});
		});
		root.appendChild(button);
	}

	return root;
}

function selectionTooltips(
	state: EditorState,
	app: App,
	includeColor: boolean,
): readonly Tooltip[] {
	const range = state.selection.main;
	if (range.empty || state.selection.ranges.length !== 1) {
		return [];
	}

	return [
		{
			pos: range.from,
			end: range.to,
			above: true,
			strictSide: false,
			arrow: false,
			create: (view): TooltipView => {
				const dom = buildToolbar(view, app, includeColor);
				dom.style.backgroundColor = "#ffffff";
				dom.style.border = "1px solid #ececec";
				return {
					dom,
					mount: () => {
						const tip = dom.parentElement;
						if (!tip) return;
						tip.style.setProperty("background", "#ffffff", "important");
						tip.style.setProperty("background-color", "#ffffff", "important");
						tip.style.setProperty("border", "none", "important");
						tip.style.setProperty("box-shadow", "none", "important");
						tip.style.setProperty("padding", "0", "important");
					},
				};
			},
		},
	];
}

function selectionToolbarField(
	app: App,
	includeColor: boolean,
): StateField<readonly Tooltip[]> {
	return StateField.define<readonly Tooltip[]>({
		create(state) {
			return selectionTooltips(state, app, includeColor);
		},
		update(tooltips, tr) {
			if (!tr.docChanged && !tr.selection) {
				return tooltips;
			}
			return selectionTooltips(tr.state, app, includeColor);
		},
		provide: (field) =>
			showTooltip.computeN([field], (state) => state.field(field)),
	});
}

export function registerSelectionToolbar(plugin: ToolbarHost): void {
	plugin.registerEditorExtension(
		selectionToolbarField(plugin.app, plugin.settings.editor.textColor),
	);
}
