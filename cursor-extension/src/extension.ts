import * as vscode from "vscode";
import {
	createWikilinkPlugin,
	type MarkdownIt,
} from "./wikilink/markdown-it-wikilink";
import { NoteIndex } from "./wikilink/note-index";

const MARKDOWN_PREVIEW_EDITOR = "vscode.markdown.preview.editor";

function isMarkdownUri(uri: vscode.Uri): boolean {
	return uri.fsPath.toLowerCase().endsWith(".md");
}

function getActiveMarkdownUri(): vscode.Uri | undefined {
	const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
	if (!tab?.input) {
		return undefined;
	}

	if (tab.input instanceof vscode.TabInputCustom) {
		if (tab.input.viewType !== MARKDOWN_PREVIEW_EDITOR) {
			return undefined;
		}
		return isMarkdownUri(tab.input.uri) ? tab.input.uri : undefined;
	}

	if (tab.input instanceof vscode.TabInputText) {
		return isMarkdownUri(tab.input.uri) ? tab.input.uri : undefined;
	}

	return undefined;
}

function isPreviewTab(tab: vscode.Tab): boolean {
	return (
		tab.input instanceof vscode.TabInputCustom &&
		tab.input.viewType === MARKDOWN_PREVIEW_EDITOR
	);
}

async function toggleMarkdownPreview(): Promise<void> {
	const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
	const uri = getActiveMarkdownUri();
	if (!tab || !uri) {
		return;
	}

	const viewColumn = tab.group.viewColumn;

	if (isPreviewTab(tab)) {
		await vscode.commands.executeCommand(
			"vscode.openWith",
			uri,
			"default",
			{ viewColumn },
		);
		return;
	}

	await vscode.commands.executeCommand("markdown.showPreviewToSide");
}

export function activate(context: vscode.ExtensionContext): {
	extendMarkdownIt: (md: MarkdownIt) => MarkdownIt;
} {
	const noteIndex = new NoteIndex();
	context.subscriptions.push(noteIndex);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"nui.toggleMarkdownPreview",
			() => void toggleMarkdownPreview(),
		),
	);

	return {
		extendMarkdownIt(md: MarkdownIt) {
			createWikilinkPlugin(noteIndex)(md);
			return md;
		},
	};
}

export function deactivate(): void {}
