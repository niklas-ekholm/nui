import type { App } from "obsidian";
import { TFile } from "obsidian";
import { findBasesFileForElement } from "../bases/bases-view-title";
import { findHostFileForElement } from "../navigation/folder-index";
import { parseResponsibilityForBaseEmbed } from "./parse-responsibility-embed";
import { parseEmbedLinkText } from "./parse-embed-pipes";

function readEmbedPathFromDom(embedRoot: HTMLElement): string | null {
	for (const attr of ["src", "data-src", "alt"]) {
		const value = embedRoot.getAttribute(attr)?.trim();
		if (!value) continue;
		return value.split("#")[0]?.split("|")[0]?.trim() ?? null;
	}
	return null;
}

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

	const host = findHostFileForElement(app, anchorEl);
	if (!host) return null;

	const embed = findBasesEmbedRoot(anchorEl);
	if (!embed) return null;

	const domPath = readEmbedPathFromDom(embed);
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

/** @deprecated Prefer resolveEmbedResponsibilityFromEmbedAsync */
export function resolveEmbedResponsibilityFromEmbed(
	app: App,
	anchorEl: HTMLElement,
	viewName?: string,
): string | null {
	const embed = findBasesEmbedRoot(anchorEl);
	const attr = embed?.getAttribute("data-nui-embed-responsibility")?.trim();
	if (attr) return attr;

	const hostFile = findHostFileForElement(app, anchorEl);
	if (!hostFile) return null;

	const baseFile = resolveBaseFile(app, anchorEl, viewName);
	if (!baseFile) return null;

	const cache = app.metadataCache.getFileCache(hostFile);
	for (const embedCache of cache?.embeds ?? []) {
		if (!embedCache.link.endsWith(".base")) continue;
		if (resolveBasePathFromEmbedLink(app, embedCache.link, hostFile.path) !== baseFile.path) {
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

export async function resolveEmbedResponsibilityFromEmbedAsync(
	app: App,
	anchorEl: HTMLElement,
	viewName?: string,
): Promise<string | null> {
	const cached = resolveEmbedResponsibilityFromEmbed(app, anchorEl, viewName);
	if (cached) return cached;

	const hostFile = findHostFileForElement(app, anchorEl);
	if (!hostFile) return null;

	const baseFile = resolveBaseFile(app, anchorEl, viewName);
	if (!baseFile) return null;

	const source = await app.vault.cachedRead(hostFile);
	return parseResponsibilityForBaseEmbed(source, baseFile.path, (link) =>
		resolveBasePathFromEmbedLink(app, link, hostFile.path),
	);
}
