import type { App, EmbedCache } from "obsidian";
import { MarkdownView } from "obsidian";
import { findHostFileForElement } from "../navigation/folder-index";
import { applyParsedEmbedPipes } from "./apply-embed-pipes";
import { findBaseEmbedWrapperForAnchor } from "./find-embed-for-anchor";
import { notifyEmbedPipeViews } from "./embed-pipe-events";
import { parseEmbedLinkText, type ParsedEmbedPipes } from "./parse-embed-pipes";
import { syncPaneWidthInElement } from "./sync-pane-width";
import type { TimelineLayoutMode } from "../timeline/types";
import {
	resolveEmbedResponsibilityFromEmbed,
	resolveEmbedResponsibilityFromEmbedAsync,
} from "./resolve-embed-responsibility";

export {
	resolveEmbedResponsibilityFromEmbed,
	resolveEmbedResponsibilityFromEmbedAsync,
};

export function resolveTimelineResponsibilityFromEmbed(
	app: App,
	anchorEl: HTMLElement,
): string | null {
	return resolveEmbedResponsibilityFromEmbed(app, anchorEl);
}

const EMBED_SELECTOR =
	".internal-embed.bases-embed, .block-language-base.bases-embed, .internal-embed";

const TIMELINE_EMBED_SELECTOR =
	".nui-timeline, .nui-timeline-bases-root, .nui-timeline-bases-container";

function isTimelineEmbedEl(embedEl: HTMLElement): boolean {
	return !!embedEl.querySelector(TIMELINE_EMBED_SELECTOR);
}

function readEmbedOriginalFromDom(embedEl: HTMLElement): string | null {
	for (const attr of ["alt", "src", "data-src"]) {
		const value = embedEl.getAttribute(attr)?.trim();
		if (value?.includes("|")) return value;
	}
	return null;
}

function baseEmbedsForHost(app: App, hostPath: string): EmbedCache[] {
	const file = app.vault.getFileByPath(hostPath);
	if (!file) return [];
	return (app.metadataCache.getFileCache(file)?.embeds ?? []).filter((entry) =>
		entry.link.endsWith(".base"),
	);
}

function matchEmbedByIndex(
	embedEl: HTMLElement,
	scope: ParentNode,
	embeds: EmbedCache[],
): EmbedCache | null {
	const embedEls = Array.from(
		scope.querySelectorAll<HTMLElement>(EMBED_SELECTOR),
	).filter(
		(el) =>
			el.classList.contains("bases-embed") ||
			!!el.querySelector(TIMELINE_EMBED_SELECTOR) ||
			!!el.querySelector(".nui-task-list-bases-root"),
	);
	const index = embedEls.indexOf(embedEl);
	if (index < 0 || index >= embeds.length) return null;
	return embeds[index];
}

function resolveParsedPipes(
	app: App,
	hostPath: string,
	anchorEl: HTMLElement,
	scope: ParentNode,
): ParsedEmbedPipes {
	const embeds = baseEmbedsForHost(app, hostPath);
	const embedEl =
		findBaseEmbedWrapperForAnchor(anchorEl, scope) ??
		anchorEl.closest<HTMLElement>(EMBED_SELECTOR);

	if (embedEl) {
		const matched = matchEmbedByIndex(embedEl, scope, embeds);
		if (matched?.original) return parseEmbedLinkText(matched.original);

		const domOriginal = readEmbedOriginalFromDom(embedEl);
		if (domOriginal) return parseEmbedLinkText(domOriginal);
	}

	return { rawTokens: [] };
}

function findBasesEmbedRoot(anchorEl: HTMLElement): HTMLElement | null {
	return anchorEl.closest<HTMLElement>(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
}

export function resolveEmbedPipes(
	app: App,
	anchorEl: HTMLElement,
): ParsedEmbedPipes | null {
	const hostFile = findHostFileForElement(app, anchorEl);
	if (!hostFile) return null;

	const scope =
		anchorEl.closest(
			".markdown-reading-view, .markdown-preview-view, .markdown-rendered, .markdown-source-view",
		) ?? anchorEl.parentElement ??
		document.body;

	return resolveParsedPipes(app, hostFile.path, anchorEl, scope);
}

/** @deprecated Use resolveEmbedPipes */
export function resolveTimelineEmbedPipes(
	app: App,
	anchorEl: HTMLElement,
): ParsedEmbedPipes | null {
	return resolveEmbedPipes(app, anchorEl);
}

export function syncEmbedPipesInElement(
	app: App,
	hostPath: string,
	root: HTMLElement,
): void {
	const scope =
		root.closest(
			".markdown-reading-view, .markdown-preview-view, .markdown-rendered, .markdown-source-view",
		) ?? root;

	for (const embedEl of Array.from(
		scope.querySelectorAll<HTMLElement>(EMBED_SELECTOR),
	).filter(
		(el) =>
			el.classList.contains("bases-embed") ||
			!!el.querySelector(TIMELINE_EMBED_SELECTOR) ||
			!!el.querySelector(".nui-task-list-bases-root"),
	)) {
		const parsed = resolveParsedPipes(app, hostPath, embedEl, scope);
		applyParsedEmbedPipes(embedEl, parsed, {
			defaultWide: isTimelineEmbedEl(embedEl),
		});
	}

	for (const block of Array.from(
		scope.querySelectorAll<HTMLElement>(".cm-embed-block"),
	)) {
		if (block.querySelector("[data-nui-embed-wide]")) {
			block.setAttribute("data-nui-embed-wide-host", "");
		} else {
			block.removeAttribute("data-nui-embed-wide-host");
		}
	}

	syncPaneWidthInElement(root);
	notifyEmbedPipeViews(scope);
}

export function syncEmbedPipesInActiveLeaf(app: App): void {
	const leaf = app.workspace.activeLeaf;
	if (!leaf) return;
	const view = leaf.view;
	if (!(view instanceof MarkdownView) || !view.file) return;

	syncEmbedPipesInElement(app, view.file.path, view.containerEl);
}

export function isTimelineEmbedCompact(
	app: App,
	anchorEl: HTMLElement,
): boolean {
	const parsed = resolveEmbedPipes(app, anchorEl);
	if (parsed?.timelineLayout === "compact") return true;
	if (parsed?.timelineCompact === true) return true;

	const embed = findBasesEmbedRoot(anchorEl);
	return embed?.hasAttribute("data-nui-embed-compact") ?? false;
}

export function resolveTimelineLayoutFromEmbed(
	app: App,
	anchorEl: HTMLElement,
): TimelineLayoutMode | null {
	const parsed = resolveEmbedPipes(app, anchorEl);
	if (parsed?.timelineLayout) return parsed.timelineLayout;

	const embed = findBasesEmbedRoot(anchorEl);
	const attr = embed?.getAttribute("data-nui-embed-timeline-layout");
	if (
		attr === "compact" ||
		attr === "full" ||
		attr === "full-tasks"
	) {
		return attr;
	}

	return null;
}
