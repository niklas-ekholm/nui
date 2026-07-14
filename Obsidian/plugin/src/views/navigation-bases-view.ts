
import { BasesView, QueryController } from "obsidian";
import { renderCards } from "../cards/render-cards";
import { resolveImageProperty } from "../cards/resolve-image";
import { partitionNavigationEntries } from "../bases/navigation-entries";
import { clearEmbeddedBasesChrome, syncEmbeddedBasesChrome } from "../bases/embedded-bases-chrome";
import {
	BasesViewAddAction,
	createBasesViewAddButton,
	createSubfolderInEmbedHostFolder,
	resolveEmbedHostFolderPath,
	syncBasesViewTopbar,
} from "../bases/bases-view-topbar";
import { clearMountedBasesTitle, createNuiBasesContainer } from "../bases/bases-view-title";
import {
	NAVIGATION_BASES_VIEW_TYPE,
	mergeAspectRatio,
	mergeCardSize,
	mergeImageFit,
} from "../layouts/types";

export class NavigationBasesView extends BasesView {
	readonly type = NAVIGATION_BASES_VIEW_TYPE;
	private containerEl: HTMLElement;
	private renderedSignature = "";

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = createNuiBasesContainer(
			this.app,
			parentEl,
			"nui-text-scope nui-navigation-bases-root",
		);
	}

	onDataUpdated(): void {
		const folderCardSize = mergeCardSize(this.config.get("cardSize"), 180);
		const imageProperty = resolveImageProperty(this.config);
		const imageAspectRatio = mergeAspectRatio(
			this.config.get("imageAspectRatio"),
		);
		const imageFit = mergeImageFit(this.config.get("imageFit"), "cover");
		const order = this.config.getOrder();
		const hostFolderPath = resolveEmbedHostFolderPath(
			this.app,
			this.containerEl,
		);
		const { folders, files } = partitionNavigationEntries(
			this.app,
			this.data.data,
			hostFolderPath,
		);
		const signature = [
			this.type,
			hostFolderPath ?? "",
			folderCardSize,
			imageProperty ?? "",
			imageAspectRatio,
			imageFit,
			order.join(","),
			this.config
				.getSort()
				.map((sort) => `${sort.property}:${sort.direction}`)
				.join(","),
			folders.map((entry) => entry.file.path).join("\n"),
			files.map((entry) => entry.file.path).join("\n"),
		].join("|");

		this.syncChrome();

		if (signature === this.renderedSignature) return;
		this.renderedSignature = signature;

		this.containerEl.empty();
		this.containerEl.addClass("nui-navigation");

		const renderOptions = {
			app: this.app,
			order,
			config: this.config,
			imageProperty,
			imageAspectRatio,
			imageFit,
		};

		if (folders.length > 0) {
			const foldersEl = this.containerEl.createDiv({
				cls: "nui-navigation-section nui-navigation-section--folders",
			});
			const { linksEl } = this.createFoldersRow(foldersEl);
			renderCards(linksEl, {
				...renderOptions,
				entries: folders,
				titleMode: "list-folders",
				cardSize: folderCardSize,
			});
		} else {
			this.createFoldersRow(this.containerEl.createDiv({
				cls: "nui-navigation-section nui-navigation-section--folders nui-navigation-section--folders-empty",
			}));
		}

		if (files.length > 0) {
			const filesEl = this.containerEl.createDiv({
				cls: "nui-navigation-section nui-navigation-section--files",
			});
			renderCards(filesEl, {
				...renderOptions,
				entries: files,
				titleMode: "list-files",
				cardSize: folderCardSize,
			});
		}

		this.syncChrome();
	}

	private createFoldersRow(sectionEl: HTMLElement): {
		linksEl: HTMLElement;
	} {
		const rowEl = sectionEl.createDiv({ cls: "nui-navigation-folders-row" });
		const linksEl = rowEl.createDiv({ cls: "nui-navigation-folders-links" });
		const addSlot = rowEl.createDiv({ cls: "nui-navigation-add-slot" });
		createBasesViewAddButton(addSlot, this.getAddAction(), {
			className: "nui-week-tracker-3-add nui-navigation-add",
		});
		return { linksEl };
	}

	private getAddAction(): BasesViewAddAction {
		return {
			title: "New folder",
			ariaLabel: "New folder",
			onClick: (anchorEl) => {
				void this.addFolder(anchorEl);
			},
		};
	}

	private syncChrome(): void {
		clearMountedBasesTitle(this.containerEl);
		syncEmbeddedBasesChrome(this, this.containerEl, []);
		syncBasesViewTopbar(this.containerEl, {});
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

	onunload(): void {
		clearEmbeddedBasesChrome(this.containerEl);
	}
}

