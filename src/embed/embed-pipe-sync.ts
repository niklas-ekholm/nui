import type { App, EmbedCache } from "obsidian";
import { MarkdownView } from "obsidian";
import { findHostFileForElement } from "../navigation/folder-index";
import { applyParsedEmbedPipes } from "./apply-embed-pipes";
import { parseEmbedLinkText, type ParsedEmbedPipes } from "./parse-embed-pipes";
import { syncPaneWidthInElement } from "./sync-pane-width";
import type { TimelineLayoutMode } from "../timeline/types";

const EMBED_SELECTOR =
	".internal-embed, .block-language-base.bases-embed";

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

function embedsForHost(app: App, hostPath: string): EmbedCache[] {
	const file = app.vault.getFileByPath(hostPath);
	if (!file) return [];
	return app.metadataCache.getFileCache(file)?.embeds ?? [];
}

function matchEmbedByIndex(
	embedEl: HTMLElement,
	scope: ParentNode,
	embeds: EmbedCache[],
): EmbedCache | null {
	const embedEls = Array.from(
		scope.querySelectorAll<HTMLElement>(EMBED_SELECTOR),
	);
	const index = embedEls.indexOf(embedEl);
	if (index < 0 || index >= embeds.length) return null;
	return embeds[index];
}

function resolveParsedPipes(
	app: App,
	hostPath: string,
	embedEl: HTMLElement,
	scope: ParentNode,
): ParsedEmbedPipes {
	const embeds = embedsForHost(app, hostPath);
	const matched = matchEmbedByIndex(embedEl, scope, embeds);
	if (matched?.original) return parseEmbedLinkText(matched.original);

	const domOriginal = readEmbedOriginalFromDom(embedEl);
	if (domOriginal) return parseEmbedLinkText(domOriginal);

	return { rawTokens: [] };
}

function findTimelineEmbedRoot(anchorEl: HTMLElement): HTMLElement | null {
	return anchorEl.closest<HTMLElement>(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
}

export function resolveTimelineEmbedPipes(
	app: App,
	anchorEl: HTMLElement,
): ParsedEmbedPipes | null {
	const embed = findTimelineEmbedRoot(anchorEl);
	if (!embed) return null;

	const hostFile = findHostFileForElement(app, anchorEl);
	if (!hostFile) return null;

	const scope =
		embed.closest(
			".markdown-reading-view, .markdown-preview-view, .markdown-rendered, .markdown-source-view",
		) ?? embed.parentElement ??
		document.body;

	return resolveParsedPipes(app, hostFile.path, embed, scope);
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
	const parsed = resolveTimelineEmbedPipes(app, anchorEl);
	if (parsed?.timelineLayout === "compact") return true;
	if (parsed?.timelineCompact === true) return true;

	const embed = findTimelineEmbedRoot(anchorEl);
	return embed?.hasAttribute("data-nui-embed-compact") ?? false;
}

export function resolveTimelineLayoutFromEmbed(
	app: App,
	anchorEl: HTMLElement,
): TimelineLayoutMode | null {
	const parsed = resolveTimelineEmbedPipes(app, anchorEl);
	if (parsed?.timelineLayout) return parsed.timelineLayout;

	const embed = findTimelineEmbedRoot(anchorEl);
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
