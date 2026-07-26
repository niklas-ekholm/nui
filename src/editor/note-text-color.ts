import { MarkdownView, type App, type Plugin, type TFile } from "obsidian";
import {
	removeFrontmatterField,
	setFrontmatterField,
} from "../core/mutate/set-frontmatter-field";
import {
	DEFAULT_TEXT_COLOR,
	formatHexColorForYaml,
	normalizeHexColor,
} from "./text-color-utils";
import { openTextColorPicker } from "./text-color-picker-modal";

const NOTE_COLOR_FIELD = "color";

export function readNoteColor(app: App, file: TFile): string | null {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	return normalizeHexColor(frontmatter?.[NOTE_COLOR_FIELD]);
}

export async function setNoteColor(
	app: App,
	file: TFile,
	color: string | null,
): Promise<void> {
	await app.vault.process(file, (content) => {
		if (color === null) {
			return removeFrontmatterField(content, NOTE_COLOR_FIELD);
		}

		const yamlValue = formatHexColorForYaml(color);
		if (!yamlValue) {
			return content;
		}

		return setFrontmatterField(content, NOTE_COLOR_FIELD, yamlValue);
	});
}

export async function setPropertyColor(
	app: App,
	file: TFile,
	key: string,
	color: string | null,
): Promise<void> {
	await app.vault.process(file, (content) => {
		if (color === null) {
			return removeFrontmatterField(content, key);
		}

		const yamlValue = formatHexColorForYaml(color);
		if (!yamlValue) {
			return content;
		}

		return setFrontmatterField(content, key, yamlValue);
	});
}

function syncNoteTextColorInView(view: MarkdownView, color: string | null): void {
	const targets = view.containerEl.querySelectorAll<HTMLElement>(
		".markdown-reading-view, .markdown-source-view.mod-cm6",
	);

	for (const el of Array.from(targets)) {
		if (color) {
			el.dataset.nuiNoteColor = color;
			el.style.setProperty("--nui-note-text-color", color);
		} else {
			delete el.dataset.nuiNoteColor;
			el.style.removeProperty("--nui-note-text-color");
		}
	}
}

function syncNoteTextColorForFile(app: App, file: TFile): void {
	const color = readNoteColor(app, file);

	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (view instanceof MarkdownView && view.file?.path === file.path) {
			syncNoteTextColorInView(view, color);
		}
	}
}

function syncAllOpenNoteTextColors(app: App): void {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView) || !view.file) {
			continue;
		}

		syncNoteTextColorInView(view, readNoteColor(app, view.file));
	}
}

export function registerNoteTextColorSync(plugin: Plugin): void {
	let syncTimer: number | null = null;

	const scheduleSync = (): void => {
		if (syncTimer !== null) {
			window.clearTimeout(syncTimer);
		}

		syncTimer = window.setTimeout(() => {
			syncTimer = null;
			requestAnimationFrame(() => {
				syncAllOpenNoteTextColors(plugin.app);
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
			syncNoteTextColorForFile(plugin.app, file);
		}),
	);

	scheduleSync();
}

export function openNoteTextColorPicker(
	app: App,
	file: TFile,
): void {
	openTextColorPicker(app, {
		mode: "note",
		initialColor: readNoteColor(app, file) ?? DEFAULT_TEXT_COLOR,
		onApply: async (color) => {
			await setNoteColor(app, file, color);
		},
		onClear: async () => {
			await setNoteColor(app, file, null);
		},
	});
}
