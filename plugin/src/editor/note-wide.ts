import { MarkdownView, type App, type Plugin, type TFile } from "obsidian";

const NOTE_WIDE_FIELD = "wide";

export function readNoteWide(app: App, file: TFile): boolean {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	const raw = frontmatter?.[NOTE_WIDE_FIELD];
	if (raw === true) {
		return true;
	}

	if (typeof raw === "string") {
		return raw.trim().toLowerCase() === "true";
	}

	return false;
}

function syncNoteWideInView(view: MarkdownView, wide: boolean): void {
	const targets = view.containerEl.querySelectorAll<HTMLElement>(
		".markdown-reading-view, .markdown-source-view.mod-cm6",
	);

	for (const el of Array.from(targets)) {
		if (wide) {
			el.dataset.nuiNoteWide = "true";
		} else {
			delete el.dataset.nuiNoteWide;
		}
	}
}

function syncNoteWideForFile(app: App, file: TFile): void {
	const wide = readNoteWide(app, file);

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (view instanceof MarkdownView && view.file?.path === file.path) {
			syncNoteWideInView(view, wide);
		}
	}
}

function syncAllOpenNoteWides(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView) || !view.file) {
			continue;
		}

		syncNoteWideInView(view, readNoteWide(app, view.file));
	}
}

export function registerNoteWideSync(plugin: Plugin): void {
	let syncTimer: number | null = null;

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}

		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			requestAnimationFrame(() => {
				syncAllOpenNoteWides(plugin.app);
			});
		}, 0);
	};

	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", scheduleSync),
	);
	plugin.registerEvent(
		plugin.app.metadataCache.on("changed", (file) => {
			syncNoteWideForFile(plugin.app, file);
		}),
	);

	scheduleSync();
}
