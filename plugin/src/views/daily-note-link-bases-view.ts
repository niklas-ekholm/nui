import { App, BasesView, BasesViewConfig, Keymap, QueryController } from "obsidian";
import { renderCards } from "../cards/render-cards";
import { fileAsEntry } from "../cards/file-as-entry";
import { resolveImageProperty } from "../cards/resolve-image";
import {
	openOrCreateDailyNote,
	readDailyNotesSettings,
	resolveDailyNotePath,
} from "../bases/daily-note-path";
import { addDays, startOfDay } from "../core/parse/dates";
import { clearEmbeddedBasesChrome, syncEmbeddedBasesChrome } from "../bases/embedded-bases-chrome";
import { syncBasesViewTopbar } from "../bases/bases-view-topbar";
import { clearMountedBasesTitle, createNuiBasesContainer } from "../bases/bases-view-title";
import {
	DAILY_NOTE_LINK_BASES_VIEW_TYPE,
	mergeAspectRatio,
	mergeCardSize,
	mergeImageFit,
} from "../layouts/types";

/** Same arrow glyph as List: Navigation / List: Folders chips. */
const DEFAULT_LIST_PREFIX = "→";

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

function readDayOffset(config: BasesViewConfig): number {
	const raw = config.get("dayOffset");
	if (typeof raw === "number" && Number.isFinite(raw)) {
		return Math.trunc(raw);
	}
	if (typeof raw === "string" && raw.trim() !== "") {
		const parsed = Number(raw);
		if (Number.isFinite(parsed)) {
			return Math.trunc(parsed);
		}
	}
	return 0;
}

function readLabel(config: BasesViewConfig): string | null {
	const raw = config.get("label");
	if (typeof raw !== "string") return null;
	const trimmed = raw.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function defaultLabelForOffset(offset: number): string {
	if (offset === 0) return "Today";
	if (offset === -1) return "Yesterday";
	if (offset === 1) return "Tomorrow";
	if (offset > 1) return `In ${offset} days`;
	return `${Math.abs(offset)} days ago`;
}

function resolveLinkFolderPath(
	app: App,
	config: BasesViewConfig,
): string | null {
	return readLinkFolder(config) ?? (readDailyNotesSettings(app).folder || null);
}

function resolveTargetDate(dayOffset: number): Date {
	return addDays(startOfDay(new Date()), dayOffset);
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
		const dayOffset = readDayOffset(this.config);
		const label =
			readLabel(this.config) ?? defaultLabelForOffset(dayOffset);
		const listPrefix = readListPrefixOverride(this.config) ?? DEFAULT_LIST_PREFIX;
		const hideLabel = readHideLabel(this.config);
		const targetDate = resolveTargetDate(dayOffset);
		const dailyResolved = resolveDailyNotePath(
			this.app,
			targetDate,
			linkFolder ?? undefined,
		);
		const signature = [
			this.type,
			dailyResolved.path,
			dailyResolved.dateKey,
			linkFolder ?? "",
			listPrefix,
			label,
			dayOffset,
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
			entries: [fileAsEntry(this.app, dailyResolved.path, label)],
			order,
			config: this.config,
			titleMode: "list-folders",
			cardSize,
			imageProperty,
			imageAspectRatio,
			imageFit,
			listPrefix,
			hideTitleText: hideLabel,
			openEntry: (_entry, evt) => {
				void openOrCreateDailyNote(
					this.app,
					targetDate,
					Keymap.isModEvent(evt) === true,
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
