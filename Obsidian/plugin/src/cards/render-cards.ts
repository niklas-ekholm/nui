
import {
	App,
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	Keymap,
	NullValue,
	Value,
} from "obsidian";
import { CardImageFit, CardTitleMode } from "../layouts/types";
import { startOfDay } from "../core/parse/dates";
import { readEntryDate } from "../bases/entry-date";
import { resolveCardImageSrc } from "./resolve-image";

export interface RenderCardsOptions {
	app: App;
	entries: BasesEntry[];
	order: BasesPropertyId[];
	config: BasesViewConfig;
	titleMode: CardTitleMode;
	cardSize: number;
	imageProperty: BasesPropertyId | null;
	imageAspectRatio: number;
	imageFit: CardImageFit;
	todayDivider?: {
		/**
		 * BasesViewConfig option key that points to the "date" property.
		 * Defaults to `dateField`.
		 */
		dateFieldKey?: string;
	};
	openEntry?: (entry: BasesEntry, evt: MouseEvent) => void;
	openPrefixClick?: (entry: BasesEntry, evt: MouseEvent) => void;
	listPrefix?: string;
	hideTitleText?: boolean;
}

export function renderCards(
	containerEl: HTMLElement,
	options: RenderCardsOptions,
): void {
	containerEl.empty();
	containerEl.addClass("nui-cards-bases-container");

	const grid = containerEl.createDiv({
		cls: `nui-cards nui-cards--${options.titleMode}`,
	});
	grid.style.setProperty("--nui-card-image-fit", options.imageFit);
	grid.style.setProperty("--nui-card-size", `${options.cardSize}px`);
	grid.style.setProperty(
		"--nui-card-image-ratio",
		String(options.imageAspectRatio),
	);

	if (options.entries.length === 0) {
		grid.createDiv({
			cls: "nui-cards-empty",
			text: "No results. Adjust the base filters or add notes.",
		});
		return;
	}

	const cardEls: HTMLElement[] = [];

	for (const entry of options.entries) {
		const cardEl = renderCard(grid, entry, options);
		cardEls.push(cardEl);
	}

	if (options.todayDivider) {
		renderTodayDivider(containerEl, options, cardEls);
	}
}

function renderCard(
	grid: HTMLElement,
	entry: BasesEntry,
	options: RenderCardsOptions,
): HTMLElement {
	const card = grid.createDiv({ cls: "nui-cards-item" });
	card.dataset.entryPath = entry.file.path;
	const imageSrc = resolveCardImageSrc(
		options.app,
		entry,
		options.imageProperty,
	);

	if (imageSrc) {
		const cover = card.createDiv({ cls: "nui-cards-cover" });
		cover.setCssStyles({
			backgroundImage: `url("${imageSrc.replace(/"/g, "%22")}")`,
			backgroundSize: options.imageFit,
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
		});
		cover.setAttr("role", "img");
		cover.setAttr("aria-label", entry.file.basename);
	}

	const body = card.createDiv({ cls: "nui-cards-body" });
	const title = entryTitle(entry);
	const hideTitleText = options.hideTitleText ?? false;
	const showTitle =
		options.titleMode !== "none" &&
		(title.length > 0 || hideTitleText);

	if (showTitle) {
		const isListLayout =
			options.titleMode === "list-files" ||
			options.titleMode === "list-folders";
		const titleStyle = titleStyleForMode(options.titleMode);
		const titleClasses = [
			"nui-cards-title",
			`nui-cards-title--${titleStyle}`,
		];
		if (hideTitleText) {
			titleClasses.push("nui-cards-title--prefix-only");
		}
		const titleEl = body.createSpan({ cls: titleClasses.join(" ") });
		const splitTitleLinks = Boolean(options.openPrefixClick);
		if (isListLayout) {
			const prefixEl = titleEl.createSpan({
				cls: splitTitleLinks
					? "nui-cards-title-symbol"
					: "nui-cards-title-arrow",
				text: options.listPrefix ?? "→",
			});
			if (splitTitleLinks) {
				prefixEl.addClass("nui-cards-title-symbol-link");
				attachTitleLinkClick(prefixEl, entry, options.openPrefixClick!);
			}
			if (!hideTitleText) {
				const textEl = titleEl.createSpan({
					cls: "nui-cards-title-text",
					text: title,
				});
				if (splitTitleLinks && options.openEntry) {
					textEl.addClass("nui-cards-title-text-link");
					attachTitleLinkClick(textEl, entry, options.openEntry);
				}
			}
		} else {
			titleEl.setText(title);
		}
		if (!splitTitleLinks) {
			attachTitleLinkClick(
				titleEl,
				entry,
				options.openEntry ??
					((_entry, evt) => {
						void options.app.workspace.openLinkText(
							_entry.file.path,
							"",
							Keymap.isModEvent(evt),
						);
					}),
			);
		}
	}

	for (const propertyId of options.order) {
		if (showTitle && propertyId === "file.name") continue;
		if (options.titleMode === "none" && propertyId.startsWith("file.")) continue;
		renderProperty(body, entry, propertyId, options);
	}

	if (!body.childElementCount) {
		body.remove();
	}

	card.onClickEvent((evt) => {
		if (evt.target instanceof HTMLElement && evt.target.closest(".nui-cards-title")) {
			return;
		}
		if (options.openEntry) {
			options.openEntry(entry, evt);
			return;
		}
		void options.app.workspace.openLinkText(entry.file.path, "");
	});
	card.addClass("nui-cards-item-clickable");

	return card;
}

function attachTitleLinkClick(
	el: HTMLElement,
	entry: BasesEntry,
	handler: (entry: BasesEntry, evt: MouseEvent) => void,
): void {
	el.onClickEvent((evt) => {
		if (evt.button !== 0 && evt.button !== 1) return;
		evt.preventDefault();
		evt.stopPropagation();
		handler(entry, evt);
	});
}

function entryTitle(entry: BasesEntry): string {
	const nameValue = entry.getValue("file.name");
	const title =
		nameValue && !(nameValue instanceof NullValue)
			? nameValue.toString().replace(/\.md$/i, "")
			: entry.file.basename;

	return title;
}

function titleStyleForMode(
	mode: CardTitleMode,
): "small" | "large" | "body" {
	switch (mode) {
		case "card-l":
		case "list-folders":
			return "large";
		case "list-files":
			return "body";
		case "card-s":
			return "small";
		default:
			return "small";
	}
}

function renderProperty(
	body: HTMLElement,
	entry: BasesEntry,
	propertyId: BasesPropertyId,
	options: RenderCardsOptions,
): void {
	const value = entry.getValue(propertyId);
	if (!value || value instanceof NullValue || !value.isTruthy()) return;

	const row = body.createDiv({ cls: "nui-cards-property" });
	row.dataset.property = propertyId;
	row.createSpan({
		cls: "nui-cards-property-value",
		text: formatPropertyValue(value),
	});
}

function formatPropertyValue(value: Value): string {
	const text = value.toString().trim();
	return text && text !== "[object Object]" ? text : "";
}

function renderTodayDivider(
	containerEl: HTMLElement,
	options: RenderCardsOptions,
	cardEls: HTMLElement[],
): void {
	// Only list views where the user can meaningfully infer a "today boundary".
	const dateFieldKey = options.todayDivider?.dateFieldKey ?? "dateField";

	const sortConfig = options.config.getSort();
	const direction = sortConfig[0]?.direction ?? "DESC";

	const today = startOfDay(new Date());

	// Find the first card that crosses "today" based on the configured direction.
	let boundaryIndex = -1;
	for (let i = 0; i < options.entries.length; i++) {
		const date = readEntryDate(options.entries[i], options.config, dateFieldKey);
		if (!date) continue;

		const crosses =
			direction === "DESC"
				? date.getTime() <= today.getTime()
				: date.getTime() >= today.getTime();

		if (crosses) {
			boundaryIndex = i;
			break;
		}
	}

	// If everything is on one side (e.g. all future), put the line after the last card.
	const lastCard = cardEls.at(-1);
	if (!lastCard) return;

	const targetTop =
		boundaryIndex >= 0 && boundaryIndex < cardEls.length
			? cardEls[boundaryIndex].offsetTop
			: lastCard.offsetTop + lastCard.offsetHeight;

	// Nudge the line upward so there is a small empty gap below it.
	// (The line is an overlay; this makes the cards under it feel less cramped.)
	const offsetPx = 12;
	const topPx = Math.max(0, targetTop - offsetPx);

	const existing = containerEl.querySelector<HTMLElement>(
		".nui-today-divider",
	);
	existing?.remove();

	const lineEl = containerEl.createDiv({ cls: "nui-today-divider" });
	lineEl.style.top = `${topPx}px`;
}

