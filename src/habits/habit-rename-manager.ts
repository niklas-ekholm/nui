
import { Plugin, TFile, TFolder } from "obsidian";
import {
	DEFAULT_CALENDAR_FOLDER,
	isHabitBundleRename,
} from "./habit-bundle";
import {
	isHabitHubIndexRename,
	showHabitRenameError,
	syncHabitRename,
} from "./rename-habit";
import { refreshAllTrackerViews } from "./tracker-registry";

let activeManager: HabitRenameManager | null = null;

export function isHabitRenameSyncing(): boolean {
	return activeManager?.isSyncing() ?? false;
}

export class HabitRenameManager {
	private syncing = false;

	constructor(private plugin: Plugin) {}

	onload(): void {
		// Module-level singleton so isHabitRenameSyncing() can be called from
		// free functions that have no handle on the plugin instance.
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		activeManager = this;
		this.registerRenameHandler();
	}

	onunload(): void {
		if (activeManager === this) {
			activeManager = null;
		}
	}

	isSyncing(): boolean {
		return this.syncing;
	}

	private registerRenameHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				if (this.syncing) {
					return;
				}

				if (file instanceof TFolder) {
					void this.handleFolderRename(file, oldPath);
				} else if (file instanceof TFile) {
					void this.handleIndexRename(file, oldPath);
				}
			}),
		);
	}

	private async handleFolderRename(
		folder: TFolder,
		oldPath: string,
	): Promise<void> {
		if (
			!isHabitBundleRename(
				this.plugin.app.vault,
				folder,
				DEFAULT_CALENDAR_FOLDER,
			)
		) {
			return;
		}

		const oldName = oldPath.split("/").pop();
		const newName = folder.name;
		if (!oldName || !newName || oldName === newName) {
			return;
		}

		await this.runSync({
			oldName,
			newName,
			folder,
			trigger: "folder",
		});
	}

	private async handleIndexRename(
		file: TFile,
		oldPath: string,
	): Promise<void> {
		if (!isHabitHubIndexRename(file, oldPath, DEFAULT_CALENDAR_FOLDER)) {
			return;
		}

		const parent = file.parent;
		if (!(parent instanceof TFolder)) {
			return;
		}

		const oldName = oldPath.split("/").pop()?.replace(/\.md$/, "");
		const newName = file.basename;
		if (!oldName || !newName || oldName === newName) {
			return;
		}

		await this.runSync({
			oldName,
			newName,
			folder: parent,
			trigger: "index",
		});
	}

	private async runSync(
		options: Parameters<typeof syncHabitRename>[1],
	): Promise<void> {
		this.syncing = true;
		try {
			await syncHabitRename(this.plugin.app, options);
		} catch (error) {
			showHabitRenameError(error);
		} finally {
			this.syncing = false;
			refreshAllTrackerViews();
		}
	}
}

