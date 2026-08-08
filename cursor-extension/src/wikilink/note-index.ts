import * as vscode from "vscode";
import {
	buildNoteIndexSnapshot,
	type NoteIndexSnapshot,
} from "./resolve-wikilink";

const EXCLUDE = "**/{node_modules,.git,dist}/**";

export class NoteIndex implements vscode.Disposable {
	private snapshot: NoteIndexSnapshot = {
		byName: new Map(),
		byPath: new Map(),
	};

	private readonly watcher: vscode.FileSystemWatcher;
	private debounceTimer: ReturnType<typeof setTimeout> | undefined;

	constructor() {
		void this.rebuild();
		this.watcher = vscode.workspace.createFileSystemWatcher("**/*.md");
		const schedule = (): void => {
			this.scheduleRebuild();
		};
		this.watcher.onDidCreate(schedule);
		this.watcher.onDidDelete(schedule);
		this.watcher.onDidChange(schedule);
	}

	getSnapshot(): NoteIndexSnapshot {
		return this.snapshot;
	}

	dispose(): void {
		this.watcher.dispose();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}

	private scheduleRebuild(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			void this.rebuild();
		}, 300);
	}

	private async rebuild(): Promise<void> {
		const files = await vscode.workspace.findFiles("**/*.md", EXCLUDE);
		const entries: Array<{ uriFsPath: string; workspaceRoot: string }> = [];

		for (const uri of files) {
			const folder = vscode.workspace.getWorkspaceFolder(uri);
			if (!folder) {
				continue;
			}
			entries.push({
				uriFsPath: uri.fsPath,
				workspaceRoot: folder.uri.fsPath,
			});
		}

		this.snapshot = buildNoteIndexSnapshot(entries);
		void vscode.commands.executeCommand("markdown.preview.refresh");
	}
}
