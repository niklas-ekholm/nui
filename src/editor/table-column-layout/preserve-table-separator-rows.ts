import {
	Annotation,
	EditorState,
	Prec,
	StateEffect,
	StateField,
	type Extension,
	type Transaction,
} from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { App } from "obsidian";
import { MarkdownView } from "obsidian";
import {
	buildSeparatorFixes,
	type CanonicalStore,
} from "./separator-canonical";

export const preserveSepAnnotation = Annotation.define<boolean>();

const setCanonicalEffect = StateEffect.define<CanonicalStore>();

const canonicalField = StateField.define<CanonicalStore>({
	create(state) {
		try {
			const store: CanonicalStore = new Map();
			return buildSeparatorFixes(state.doc, store).canonical;
		} catch {
			return new Map();
		}
	},
	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setCanonicalEffect)) {
				return effect.value;
			}
		}
		return value;
	},
});

function getFilePathForState(state: EditorState, app: App): string | null {
	try {
		for (const leaf of app.workspace.getLeavesOfType("markdown")) {
			const markdownView = leaf.view;
			if (!(markdownView instanceof MarkdownView)) {
				continue;
			}
			const cm = (markdownView.editor as { cm?: EditorView }).cm;
			if (cm?.state === state) {
				return markdownView.file?.path ?? null;
			}
		}
	} catch {
		return null;
	}
	return null;
}

function getFilePathForView(view: EditorView, app: App): string | null {
	return getFilePathForState(view.state, app);
}

function isPreserveTransaction(tr: Transaction): boolean {
	return tr.annotation(preserveSepAnnotation) === true;
}

function isPreserveUpdate(update: ViewUpdate): boolean {
	return update.transactions.some(isPreserveTransaction);
}

function transactionFilterExtension(
	app: App,
	getFileStore: (path: string) => CanonicalStore,
	setFileStore: (path: string, store: CanonicalStore) => void,
): Extension {
	return EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged || isPreserveTransaction(tr)) {
			return tr;
		}

		try {
			const filePath = getFilePathForState(tr.startState, app);
			const startStore =
				filePath !== null
					? getFileStore(filePath)
					: tr.startState.field(canonicalField);
			const { changes, canonical } = buildSeparatorFixes(
				tr.newDoc,
				startStore,
				tr,
			);

			if (filePath !== null) {
				setFileStore(filePath, canonical);
			}

			if (changes.length === 0) {
				return tr;
			}

			return [
				tr,
				tr.state.update({
					changes,
					annotations: preserveSepAnnotation.of(true),
					effects: setCanonicalEffect.of(canonical),
				}),
			];
		} catch {
			return tr;
		}
	});
}

function enforceInView(
	view: EditorView,
	app: App,
	getFileStore: (path: string) => CanonicalStore,
	setFileStore: (path: string, store: CanonicalStore) => void,
): void {
	try {
		const filePath = getFilePathForView(view, app);
		const startStore =
			filePath !== null
				? getFileStore(filePath)
				: view.state.field(canonicalField, false) ?? new Map();
		const { changes, canonical } = buildSeparatorFixes(
			view.state.doc,
			startStore,
		);

		if (filePath !== null) {
			setFileStore(filePath, canonical);
		}

		if (changes.length === 0) {
			return;
		}

		view.dispatch({
			changes,
			annotations: preserveSepAnnotation.of(true),
			effects: setCanonicalEffect.of(canonical),
		});
	} catch {
		// ignore — never block editor updates
	}
}

function viewPluginExtension(
	app: App,
	getFileStore: (path: string) => CanonicalStore,
	setFileStore: (path: string, store: CanonicalStore) => void,
): Extension {
	return ViewPlugin.fromClass(
		class {
			constructor(private view: EditorView) {
				queueMicrotask(() => {
					enforceInView(this.view, app, getFileStore, setFileStore);
				});
			}

			update(update: ViewUpdate): void {
				if (!update.docChanged || isPreserveUpdate(update)) {
					return;
				}

				queueMicrotask(() => {
					enforceInView(this.view, app, getFileStore, setFileStore);
				});
			}
		},
	);
}

export function createPreserveTableSeparatorRowsExtension(
	app: App,
	getFileStore: (path: string) => CanonicalStore,
	setFileStore: (path: string, store: CanonicalStore) => void,
): Extension {
	return Prec.highest([
		canonicalField,
		transactionFilterExtension(app, getFileStore, setFileStore),
		viewPluginExtension(app, getFileStore, setFileStore),
	]);
}
