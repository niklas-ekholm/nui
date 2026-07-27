
import { App, TFile } from "obsidian";
import { formatIsoDate } from "../core/parse/dates";

export interface DailyNotesSettings {
	folder: string;
	format: string;
	template: string;
}

export interface ResolvedDailyNote {
	path: string;
	basename: string;
	dateKey: string;
	folder: string;
	template: string;
}

interface DailyNotesPluginInstance {
	options?: Partial<DailyNotesSettings>;
	createDailyNote?: (date: unknown) => Promise<TFile>;
	getDailyNote?: (date: unknown) => TFile | null;
}

type MomentLike = {
	format: (pattern: string) => string;
};

declare global {
	interface Window {
		moment?: (input?: Date) => MomentLike;
	}
}

const DEFAULT_FORMAT = "YYYY-MM-DD";

export function readDailyNotesSettings(app: App): DailyNotesSettings {
	const instance = getDailyNotesInstance(app);
	const options = instance?.options ?? {};

	return {
		folder: options.folder?.trim() ?? "",
		format: options.format?.trim() || DEFAULT_FORMAT,
		template: options.template?.trim() ?? "",
	};
}

export function resolveDailyNotePath(
	app: App,
	date: Date = new Date(),
	folderOverride?: string,
): ResolvedDailyNote {
	const settings = readDailyNotesSettings(app);
	const formatted = formatDailyNoteBasename(date, settings.format);
	const folder = (folderOverride?.trim() || settings.folder).replace(/\/+$/, "");
	const path = folder ? `${folder}/${formatted}.md` : `${formatted}.md`;
	// Display name matches TFile.basename (last segment), not nested format folders.
	const basename = formatted.includes("/")
		? (formatted.split("/").pop() ?? formatted)
		: formatted;

	return {
		path,
		basename,
		dateKey: formatIsoDate(date),
		folder,
		template: settings.template,
	};
}

export function formatDailyNoteBasename(date: Date, format: string): string {
	if (window.moment && format !== DEFAULT_FORMAT) {
		return window.moment(date).format(format);
	}
	return formatIsoDate(date);
}

export async function openOrCreateDailyNote(
	app: App,
	date: Date = new Date(),
	modEvent = false,
	folderOverride?: string,
): Promise<TFile | null> {
	const instance = getDailyNotesInstance(app);
	const usePluginApi =
		!folderOverride?.trim() && instance?.createDailyNote && window.moment;

	if (usePluginApi) {
		const momentDate = window.moment!(date);
		const existing = instance!.getDailyNote?.(momentDate) ?? null;
		const file = existing ?? (await instance!.createDailyNote!(momentDate));
		await app.workspace.openLinkText(file.path, "", modEvent);
		return file;
	}

	const resolved = resolveDailyNotePath(app, date, folderOverride);
	const existing = app.vault.getFileByPath(resolved.path);
	const file =
		existing instanceof TFile
			? existing
			: await createDailyNoteFallback(app, resolved);

	await app.workspace.openLinkText(file.path, "", modEvent);
	return file;
}

async function createDailyNoteFallback(
	app: App,
	resolved: ResolvedDailyNote,
): Promise<TFile> {
	let content = "";

	if (resolved.template) {
		const templateFile =
			app.vault.getFileByPath(resolved.template) ??
			app.metadataCache.getFirstLinkpathDest(resolved.template, "");
		if (templateFile instanceof TFile) {
			content = await app.vault.read(templateFile);
		}
	}

	return app.vault.create(resolved.path, content);
}

function getDailyNotesInstance(app: App): DailyNotesPluginInstance | null {
	const plugin = (
		app as App & {
			internalPlugins?: {
				getPluginById: (id: string) => {
					enabled?: boolean;
					instance?: DailyNotesPluginInstance;
				} | null;
			};
		}
	).internalPlugins?.getPluginById("daily-notes");
	if (!plugin?.enabled) return null;
	return plugin.instance ?? null;
}

