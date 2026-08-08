import { EditorState, StateEffect, StateField, type Extension } from "@codemirror/state";
import {
	EditorView,
	ViewPlugin,
	showTooltip,
	type Tooltip,
	type TooltipView,
	type ViewUpdate,
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
import { isRawSourceView } from "./metadata-dom-utils";
import {
	headingLevelAt,
	nextHeadingLevel,
} from "./selection-toolbar-heading";
import { toolbarAnchorPos } from "./selection-toolbar-anchor";
import { openTextColorPicker } from "./text-color-picker-modal";
import { getColorPickerHistory } from "./color-picker-history";
import type { ColorPickerHistoryHost } from "../shared/host";
import { DEFAULT_TEXT_COLOR } from "./text-color-utils";

export { headingLevelAt, nextHeadingLevel } from "./selection-toolbar-heading";

const showSelectionToolbarEffect = StateEffect.define<boolean>();

const showSelectionToolbarField = StateField.define<boolean>({
	create: () => false,
	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(showSelectionToolbarEffect)) {
				return effect.value;
			}
		}
		return value;
	},
});

function markdownViewForEditorView(
	app: App,
	view: EditorView,
): MarkdownView | null {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const md = leaf.view;
		if (!(md instanceof MarkdownView)) continue;
		const cm = (md.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm === view) {
			return md;
		}
	}
	const active = app.workspace.getActiveViewOfType(MarkdownView);
	if (active) {
		const cm = (active.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm === view) {
			return active;
		}
	}
	return null;
}

function shouldShowSelectionToolbar(app: App, view: EditorView): boolean {
	const mdView = markdownViewForEditorView(app, view);
	if (!mdView || isRawSourceView(mdView)) {
		return false;
	}
	return mdView.getMode() === "source";
}

function syncSelectionToolbarMode(app: App, view: EditorView): void {
	const next = shouldShowSelectionToolbar(app, view);
	if (next === view.state.field(showSelectionToolbarField)) {
		return;
	}
	view.dispatch({ effects: showSelectionToolbarEffect.of(next) });
}

function syncAllSelectionToolbarModes(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const md = leaf.view;
		if (!(md instanceof MarkdownView)) continue;
		const cm = (md.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm) {
			syncSelectionToolbarMode(app, cm);
		}
	}
}

function selectionToolbarModeTracker(app: App): Extension {
	return ViewPlugin.fromClass(
		class {
			private showToolbar = false;
			private observer: MutationObserver | null = null;

			constructor(view: EditorView) {
				this.sync(view);
				const sourceViewEl = view.dom.closest(".markdown-source-view");
				if (sourceViewEl) {
					this.observer = new MutationObserver(() => this.sync(view));
					this.observer.observe(sourceViewEl, {
						attributes: true,
						attributeFilter: ["class"],
					});
				}
			}

			update(update: ViewUpdate) {
				this.sync(update.view);
			}

			private sync(view: EditorView) {
				const next = shouldShowSelectionToolbar(app, view);
				if (next === this.showToolbar) {
					return;
				}
				this.showToolbar = next;
				syncSelectionToolbarMode(app, view);
			}

			destroy() {
				this.observer?.disconnect();
			}
		},
	);
}

type MarkdownViewSetState = MarkdownView["setState"];

function installMarkdownViewStateHook(
	plugin: Plugin,
	onStateChange: (view: MarkdownView) => void,
): void {
	const proto = MarkdownView.prototype as MarkdownView & {
		setState: MarkdownViewSetState;
	};
	const original = proto.setState;
	proto.setState = async function (state, result) {
		await original.call(this, state, result);
		onStateChange(this);
	};
	plugin.register(() => {
		proto.setState = original;
	});
}

type CommandsApp = App & {
	commands: { executeCommandById(id: string): boolean };
};

type ToolbarHost = ColorPickerHistoryHost & {
	settings: { editor: { textColor: boolean; recentColors: string[] } };
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
	plugin: ToolbarHost,
	includeColor: boolean,
): HTMLElement {
	const app = plugin.app;
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
				history: getColorPickerHistory(plugin),
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
	plugin: ToolbarHost,
	includeColor: boolean,
): readonly Tooltip[] {
	const app = plugin.app;
	const range = state.selection.main;
	if (range.empty || state.selection.ranges.length !== 1) {
		return [];
	}

	return [
		{
			pos: toolbarAnchorPos(state, range.from, range.to),
			end: range.to,
			above: true,
			strictSide: false,
			arrow: false,
			create: (view): TooltipView => {
				if (!shouldShowSelectionToolbar(app, view)) {
					return { dom: document.createElement("div") };
				}
				const dom = buildToolbar(view, plugin, includeColor);
				return {
					dom,
					mount: () => {
						/* CM tooltips are often portaled to `body`; strip light-theme wrapper chrome. */
						const tip = dom.parentElement;
						if (!tip) return;
						tip.style.setProperty("background", "transparent", "important");
						tip.style.setProperty(
							"background-color",
							"transparent",
							"important",
						);
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
	plugin: ToolbarHost,
	includeColor: boolean,
): StateField<readonly Tooltip[]> {
	return StateField.define<readonly Tooltip[]>({
		create(state) {
			if (!state.field(showSelectionToolbarField)) {
				return [];
			}
			return selectionTooltips(state, plugin, includeColor);
		},
		update(tooltips, tr) {
			if (!tr.state.field(showSelectionToolbarField)) {
				return [];
			}
			const modeChanged = tr.effects.some((effect) =>
				effect.is(showSelectionToolbarEffect),
			);
			if (!tr.docChanged && !tr.selection && !modeChanged) {
				return tooltips;
			}
			return selectionTooltips(tr.state, plugin, includeColor);
		},
		provide: (field) =>
			showTooltip.computeN([field, showSelectionToolbarField], (state) =>
				state.field(showSelectionToolbarField)
					? state.field(field)
					: [],
			),
	});
}

export function registerSelectionToolbar(plugin: ToolbarHost): void {
	const app = plugin.app;
	const includeColor = plugin.settings.editor.textColor;

	installMarkdownViewStateHook(plugin, (view) => {
		const cm = (view.editor as { cm?: EditorView } | undefined)?.cm;
		if (cm) {
			syncSelectionToolbarMode(app, cm);
		}
	});

	plugin.registerEvent(
		app.workspace.on("active-leaf-change", () =>
			syncAllSelectionToolbarModes(app),
		),
	);
	plugin.registerEvent(
		app.workspace.on("layout-change", () =>
			syncAllSelectionToolbarModes(app),
		),
	);

	plugin.registerEditorExtension([
		showSelectionToolbarField,
		selectionToolbarModeTracker(app),
		selectionToolbarField(plugin, includeColor),
	]);
}
