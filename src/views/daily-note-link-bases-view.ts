
import { App, BasesView, BasesViewConfig, Keymap, QueryController } from "obsidian";
import { renderCards } from "../cards/render-cards";
import { fileAsEntry } from "../cards/file-as-entry";
import { resolveImageProperty } from "../cards/resolve-image";
import {
	openOrCreateDailyNote,
	readDailyNotesSettings,
	resolveDailyNotePath,
} from "../bases/daily-note-path";
import {
	folderBasename,
	resolveFolderIndexPath,
} from "../bases/folder-index-path";
import { clearEmbeddedBasesChrome, syncEmbeddedBasesChrome } from "../bases/embedded-bases-chrome";
import { syncBasesViewTopbar } from "../bases/bases-view-topbar";
import { clearMountedBasesTitle, createNuiBasesContainer } from "../bases/bases-view-title";
import {
	DAILY_NOTE_LINK_BASES_VIEW_TYPE,
	mergeAspectRatio,
	mergeCardSize,
	mergeImageFit,
} from "../layouts/types";

function readLinkFolder(config: BasesViewConfig): string | null {
	const raw = config.get("linkFolder");
	if (typeof raw !== "string") return null;
	const trimmed = raw.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function readListPrefixOverride(config: BasesViewConfig): string | undefined {
	const raw = config.get("listPrefix");
	if (typeof raw !== "string") return undefined;
	const trimmed = raw.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function readHideLabel(config: BasesViewConfig): boolean {
	const raw = config.get("hideLabel");
	if (raw === true) return true;
	if (raw === false) return false;
	if (typeof raw === "string") {
		const normalized = raw.trim().toLowerCase();
		if (normalized === "true" || normalized === "yes") return true;
		if (normalized === "false" || normalized === "no") return false;
	}
	return false;
}

function resolveLinkFolderPath(
	app: App,
	config: BasesViewConfig,
): string | null {
	return readLinkFolder(config) ?? (readDailyNotesSettings(app).folder || null);
}

function resolveListPrefix(
	config: BasesViewConfig,
	linkFolder: string,
): string {
	return readListPrefixOverride(config) ?? folderBasename(linkFolder);
}

export class DailyNoteLinkBasesView extends BasesView {
	readonly type = DAILY_NOTE_LINK_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-daily-note-link-root",
		);
	}

	onDataUpdated(): void {
		const cardSize = mergeCardSize(this.config.get("cardSize"), 180);
		const imageProperty = resolveImageProperty(this.config);
		const imageAspectRatio = mergeAspectRatio(
			this.config.get("imageAspectRatio"),
		);
		const imageFit = mergeImageFit(this.config.get("imageFit"), "cover");
		const order = this.config.getOrder();
		const linkFolder = resolveLinkFolderPath(this.app, this.config);
		const listPrefix = linkFolder
			? resolveListPrefix(this.config, linkFolder)
			: undefined;
		const hideLabel = readHideLabel(this.config);
		const dailyResolved = resolveDailyNotePath(
			this.app,
			new Date(),
			linkFolder ?? undefined,
		);
		const folderResolved = linkFolder
			? resolveFolderIndexPath(this.app, linkFolder)
			: null;
		const signature = [
			this.type,
			dailyResolved.path,
			dailyResolved.dateKey,
			folderResolved?.path ?? "",
			linkFolder ?? "",
			listPrefix ?? "",
			hideLabel,
			cardSize,
			imageProperty ?? "",
			imageAspectRatio,
			imageFit,
			order.join(","),
		].join("|");

		this.syncChrome();

		if (signature === this.renderedSignature) return;
		this.renderedSignature = signature;

		this.containerEl.empty();

		const sectionEl = this.containerEl.createDiv({
			cls: "nui-navigation-section nui-navigation-section--folders",
		});
		const rowEl = sectionEl.createDiv({ cls: "nui-navigation-folders-row" });
		const linksEl = rowEl.createDiv({ cls: "nui-navigation-folders-links" });

		renderCards(linksEl, {
			app: this.app,
			entries: [
				fileAsEntry(this.app, dailyResolved.path, dailyResolved.basename),
			],
			order,
			config: this.config,
			titleMode: "list-folders",
			cardSize,
			imageProperty,
			imageAspectRatio,
			imageFit,
			listPrefix,
			hideTitleText: hideLabel,
			openPrefixClick: folderResolved
				? (_entry, evt) => {
						void this.app.workspace.openLinkText(
							folderResolved.path,
							"",
							Keymap.isModEvent(evt),
						);
					}
				: undefined,
			openEntry: (_entry, evt) => {
				const modEvent = Keymap.isModEvent(evt);
				void openOrCreateDailyNote(
					this.app,
					new Date(),
					modEvent === true,
					linkFolder ?? undefined,
				);
			},
		});

		this.syncChrome();
	}

	private syncChrome(): void {
		clearMountedBasesTitle(this.containerEl);
		syncEmbeddedBasesChrome(this, this.containerEl, []);
		syncBasesViewTopbar(this.containerEl, {});
	}

	onunload(): void {
		clearEmbeddedBasesChrome(this.containerEl);
	}
}
