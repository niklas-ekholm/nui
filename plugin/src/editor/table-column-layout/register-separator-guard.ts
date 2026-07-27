import { MarkdownView, type Editor, type Plugin, type TFile } from "obsidian";
import {
	type CanonicalStore,
	restoreSeparatorsInContent,
	seedCanonicalStore,
} from "./separator-canonical";

const canonicalByFile = new Map<string, CanonicalStore>();
const fixingEditors = new WeakSet<Editor>();

export function getSeparatorCanonicalStore(path: string): CanonicalStore {
	let store = canonicalByFile.get(path);
	if (!store) {
		store = new Map();
		canonicalByFile.set(path, store);
	}
	return store;
}

export function setSeparatorCanonicalStore(
	path: string,
	store: CanonicalStore,
): void {
	canonicalByFile.set(path, new Map(store));
}

function fixEditorSeparators(editor: Editor, file: TFile): boolean {
	try {
		const store = getSeparatorCanonicalStore(file.path);
		const content = editor.getValue();
		const { replacements, canonical } = restoreSeparatorsInContent(
			content,
			store,
		);
		setSeparatorCanonicalStore(file.path, canonical);

		if (replacements.length === 0) {
			return false;
		}

		fixingEditors.add(editor);
		try {
			for (const replacement of replacements) {
				const line = editor.getLine(replacement.line);
				if (line === replacement.text) {
					continue;
				}
				editor.replaceRange(
					replacement.text,
					{ line: replacement.line, ch: 0 },
					{ line: replacement.line, ch: line.length },
				);
			}
		} finally {
			fixingEditors.delete(editor);
		}

		return true;
	} catch {
		return false;
	}
}

function canFixMarkdownView(view: MarkdownView): view is MarkdownView & {
	file: TFile;
} {
	return Boolean(view.file && view.editor);
}

function fixMarkdownView(view: MarkdownView): void {
	if (!canFixMarkdownView(view)) {
		return;
	}
	fixEditorSeparators(view.editor, view.file);
}

function seedFileFromContent(path: string, content: string): void {
	try {
		const lines = content.split("\n");
		const fakeDoc = {
			toString: () => content,
			line: (n: number) => {
				const text = lines[n - 1] ?? "";
				const from =
					lines.slice(0, n - 1).join("\n").length + (n > 1 ? 1 : 0);
				return { text, from, to: from + text.length, number: n };
			},
		} as Parameters<typeof seedCanonicalStore>[0];
		const store = getSeparatorCanonicalStore(path);
		setSeparatorCanonicalStore(path, seedCanonicalStore(fakeDoc, store));
	} catch {
		// ignore seed failures
	}
}

export function registerSeparatorGuard(plugin: Plugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on("editor-change", (editor, info) => {
			if (fixingEditors.has(editor)) {
				return;
			}
			const file = info.file;
			if (!file) {
				return;
			}
			fixEditorSeparators(editor, file);
		}),
	);

	plugin.registerEvent(
		plugin.app.workspace.on("file-open", (file) => {
			if (!file) {
				return;
			}
			void plugin.app.vault.cachedRead(file).then((content) => {
				seedFileFromContent(file.path, content);
			});
		}),
	);

	plugin.app.workspace.onLayoutReady(() => {
		for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView) || !view.file) {
				continue;
			}
			void plugin.app.vault.cachedRead(view.file).then((content) => {
				seedFileFromContent(view.file!.path, content);
			});
		}
	});

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", () => {
			requestAnimationFrame(() => {
				const leaf = plugin.app.workspace.activeLeaf;
				if (!leaf) {
					return;
				}
				const view = leaf.view;
				if (view instanceof MarkdownView) {
					fixMarkdownView(view);
				}
			});
		}),
	);
}
