import type { App } from "obsidian";
import { TFile } from "obsidian";
import { findBasesFileForElement } from "../bases/bases-view-title";
import { findHostFileWithFallback } from "../navigation/folder-index";
import { readEmbedLinkFromDom } from "./embed-dom";
import {
	parseResponsibilityForBaseEmbed,
	parseEmbedLinkText,
} from "./parse-embed-pipes";

function resolveBasePathFromEmbedLink(
	app: App,
	link: string,
	hostPath: string,
): string | null {
	const path = link.split("#")[0]?.split("|")[0]?.trim();
	if (!path) return null;

	const file =
		app.vault.getFileByPath(path) ??
		app.metadataCache.getFirstLinkpathDest(path, hostPath);
	return file?.path ?? null;
}

function resolveBaseFile(
	app: App,
	anchorEl: HTMLElement,
	viewName?: string,
): TFile | null {
	const fromFinder = findBasesFileForElement(app, anchorEl, viewName);
	if (fromFinder) return fromFinder;

	const host = findHostFileWithFallback(app, anchorEl);
	if (!host) return null;

	const embed = findBasesEmbedRoot(anchorEl);
	if (!embed) return null;

	const domPath = readEmbedLinkFromDom(embed);
	if (!domPath) return null;

	const file =
		app.vault.getFileByPath(domPath) ??
		app.metadataCache.getFirstLinkpathDest(domPath, host.path);
	return file instanceof TFile && file.extension === "base" ? file : null;
}

function findBasesEmbedRoot(anchorEl: HTMLElement): HTMLElement | null {
	return anchorEl.closest<HTMLElement>(
		".internal-embed.bases-embed, .block-language-base.bases-embed, .bases-embed",
	);
}

/** Responsibility pipes come only from the host note — never reused embed DOM. */
function resolveResponsibilityFromHostMetadata(
	app: App,
	hostFile: TFile,
	baseFile: TFile,
): string | null {
	const cache = app.metadataCache.getFileCache(hostFile);
	for (const embedCache of cache?.embeds ?? []) {
		if (!embedCache.link.endsWith(".base")) continue;
		if (
			resolveBasePathFromEmbedLink(app, embedCache.link, hostFile.path) !==
			baseFile.path
		) {
			continue;
		}

		for (const candidate of [embedCache.original, embedCache.link]) {
			if (!candidate?.includes("|")) continue;
			const parsed = parseEmbedLinkText(candidate);
			if (parsed.responsibility) return parsed.responsibility;
		}
	}

	return null;
}

/** @deprecated Prefer resolveEmbedResponsibilityFromEmbedAsync */
export function resolveEmbedResponsibilityFromEmbed(
	app: App,
	anchorEl: HTMLElement,
	viewName?: string,
): string | null {
	const hostFile = findHostFileWithFallback(app, anchorEl);
	if (!hostFile) return null;

	const baseFile = resolveBaseFile(app, anchorEl, viewName);
	if (!baseFile) return null;

	return resolveResponsibilityFromHostMetadata(app, hostFile, baseFile);
}

export async function resolveEmbedResponsibilityFromEmbedAsync(
	app: App,
	anchorEl: HTMLElement,
	viewName?: string,
): Promise<string | null> {
	const hostFile = findHostFileWithFallback(app, anchorEl);
	if (!hostFile) return null;

	const baseFile = resolveBaseFile(app, anchorEl, viewName);
	if (!baseFile) return null;

	const fromMetadata = resolveResponsibilityFromHostMetadata(
		app,
		hostFile,
		baseFile,
	);
	if (fromMetadata) return fromMetadata;

	const source = await app.vault.cachedRead(hostFile);
	return parseResponsibilityForBaseEmbed(source, baseFile.path, (link) =>
		resolveBasePathFromEmbedLink(app, link, hostFile.path),
	);
}
