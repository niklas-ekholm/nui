
import { BasesEntry, BasesView, QueryController } from "obsidian";
import { renderCards, RenderCardsOptions } from "../cards/render-cards";
import { resolveImageProperty } from "../cards/resolve-image";
import { readEntryDate, sortEntriesByDate } from "../bases/entry-date";
import {
	CardImageFit,
	CardTitleMode,
	CARD_L_BASES_VIEW_TYPE,
	CARD_S_BASES_VIEW_TYPE,
	LIST_FILES_BASES_VIEW_TYPE,
	LIST_FILES_BY_DATE_BASES_VIEW_TYPE,
	LIST_FOLDERS_BASES_VIEW_TYPE,
	PICTURE_GALLERY_BASES_VIEW_TYPE,
	mergeAspectRatio,
	mergeCardSize,
	mergeImageFit,
} from "../layouts/types";
import { clearEmbeddedBasesChrome, syncEmbeddedBasesChrome } from "../bases/embedded-bases-chrome";
import {
	BasesViewAddAction,
	createBasesViewAddButton,
	createNoteInEmbedHostFolder,
	createSubfolderInEmbedHostFolder,
	syncBasesViewTopbar,
} from "../bases/bases-view-topbar";
import { createNuiBasesContainer, mountBasesTitle } from "../bases/bases-view-title";
import { filterNavVisibleFolderEntries } from "../navigation/hub-nav";

abstract class BaseCardsBasesView extends BasesView {
	protected containerEl: HTMLElement;
	protected renderedSignature = "";

	constructor(
		controller: QueryController,
		parentEl: HTMLElement,
		private readonly titleMode: CardTitleMode,
		private readonly defaultCardSize: number,
		private readonly defaultImageFit: CardImageFit,
	) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-cards-bases-root",
		);
	}

	onDataUpdated(): void {
		const cardSize = mergeCardSize(
			this.config.get("cardSize"),
			this.defaultCardSize,
		);
		const imageProperty = resolveImageProperty(
			this.config,
			this.titleMode === "none" ? "file.file" : undefined,
		);
		const imageAspectRatio = mergeAspectRatio(
			this.config.get("imageAspectRatio"),
		);
		const imageFit = mergeImageFit(
			this.config.get("imageFit"),
			this.defaultImageFit,
		);
		const order = this.config.getOrder();
		const entries = this.prepareEntries(this.data.data);
		const signature = [
			this.type,
			cardSize,
			imageProperty ?? "",
			imageAspectRatio,
			imageFit,
			order.join(","),
			this.config.getSort().map((sort) => `${sort.property}:${sort.direction}`).join(","),
			this.config.getAsPropertyId("dateField") ?? "",
			entries
				.map(
					(entry) =>
						`${entry.file.path}:${readEntryDate(entry, this.config)?.getTime() ?? ""}`,
				)
				.join("\n"),
		].join("|");

		this.syncChrome();

		if (signature === this.renderedSignature) return;
		this.renderedSignature = signature;

		renderCards(this.getCardsRenderEl(), {
			app: this.app,
			entries,
			order,
			config: this.config,
			titleMode: this.titleMode,
			cardSize,
			imageProperty,
			imageAspectRatio,
			imageFit,
			...this.getExtraRenderOptions(),
		});

		this.syncChrome();
	}

	protected getCardsRenderEl(): HTMLElement {
		return this.containerEl;
	}

	protected getTopbarAddAction(): BasesViewAddAction | null {
		return this.getAddAction();
	}

	protected syncChrome(): void {
		mountBasesTitle(this.app, this.containerEl, {
			viewName: this.config.name,
		});
		syncEmbeddedBasesChrome(this, this.containerEl, []);
		syncBasesViewTopbar(this.containerEl, {
			addAction: this.getTopbarAddAction(),
		});
	}

	protected prepareEntries(entries: BasesEntry[]): BasesEntry[] {
		return entries;
	}

	protected getExtraRenderOptions(): Partial<RenderCardsOptions> {
		return {};
	}

	protected getAddAction(): BasesViewAddAction | null {
		return null;
	}

	onunload(): void {
		clearEmbeddedBasesChrome(this.containerEl);
	}
}

export class PictureGalleryBasesView extends BaseCardsBasesView {
	readonly type = PICTURE_GALLERY_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "none", 100, "contain");
	}
}

export class CardSBasesView extends BaseCardsBasesView {
	readonly type = CARD_S_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "card-s", 180, "cover");
	}
}

export class CardLBasesView extends BaseCardsBasesView {
	readonly type = CARD_L_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "card-l", 180, "cover");
	}
}

export class ListFilesBasesView extends BaseCardsBasesView {
	readonly type = LIST_FILES_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "list-files", 180, "cover");
	}

	protected override getAddAction(): BasesViewAddAction {
		return {
			title: "New note",
			ariaLabel: "New note",
			onClick: (anchorEl) => {
				void this.addNote(anchorEl);
			},
		};
	}

	private async addNote(anchorEl: HTMLElement): Promise<void> {
		const created = await createNoteInEmbedHostFolder(
			this.app,
			this.containerEl,
			anchorEl,
		);
		if (created) {
			this.renderedSignature = "";
			this.onDataUpdated();
		}
	}
}

export class ListFilesByDateBasesView extends BaseCardsBasesView {
	readonly type = LIST_FILES_BY_DATE_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "list-files", 180, "cover");
	}

	protected override getExtraRenderOptions() {
		return {
			todayDivider: { dateFieldKey: "dateField" },
		};
	}

	protected override prepareEntries(entries: BasesEntry[]): BasesEntry[] {
		return sortEntriesByDate(entries, this.config);
	}

	protected override getAddAction(): BasesViewAddAction {
		return {
			title: "New note",
			ariaLabel: "New note",
			onClick: (anchorEl) => {
				void this.addNote(anchorEl);
			},
		};
	}

	private async addNote(anchorEl: HTMLElement): Promise<void> {
		const created = await createNoteInEmbedHostFolder(
			this.app,
			this.containerEl,
			anchorEl,
		);
		if (created) {
			this.renderedSignature = "";
			this.onDataUpdated();
		}
	}
}

export class ListFoldersBasesView extends BaseCardsBasesView {
	readonly type = LIST_FOLDERS_BASES_VIEW_TYPE;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller, parentEl, "list-folders", 180, "cover");
	}

	protected override prepareEntries(entries: BasesEntry[]): BasesEntry[] {
		return filterNavVisibleFolderEntries(this.app, entries);
	}

	protected override getCardsRenderEl(): HTMLElement {
		return this.getFoldersRowLinksEl();
	}

	protected override getTopbarAddAction(): null {
		return null;
	}

	private getFoldersRowLinksEl(): HTMLElement {
		let rowEl = this.containerEl.querySelector<HTMLElement>(
			":scope > .nui-folders-row",
		);
		if (!rowEl) {
			rowEl = this.containerEl.createDiv({ cls: "nui-folders-row" });
			const linksEl = rowEl.createDiv({ cls: "nui-folders-links" });
			const addSlot = rowEl.createDiv({ cls: "nui-folders-add-slot" });
			createBasesViewAddButton(addSlot, this.getAddAction()!, {
				className: "nui-week-tracker-3-add nui-folders-add",
			});
			return linksEl;
		}

		return (
			rowEl.querySelector<HTMLElement>(".nui-folders-links") ?? rowEl
		);
	}

	protected override getAddAction(): BasesViewAddAction {
		return {
			title: "New folder",
			ariaLabel: "New folder",
			onClick: (anchorEl) => {
				void this.addFolder(anchorEl);
			},
		};
	}

	private async addFolder(anchorEl: HTMLElement): Promise<void> {
		const created = await createSubfolderInEmbedHostFolder(
			this.app,
			this.containerEl,
			anchorEl,
		);
		if (created) {
			this.renderedSignature = "";
			this.onDataUpdated();
		}
	}
}

