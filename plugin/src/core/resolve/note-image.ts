import { App, TFile } from "obsidian";

const IMAGE_EXT = /^(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

export function isImageExtension(extension: string): boolean {
	return IMAGE_EXT.test(extension);
}

export function normalizeImagePath(path: string): string | null {
	const normalized = path.replace(/^\[\[|\]\]$/g, "").split("|")[0]?.trim();
	return normalized || null;
}

export function resolveNoteImageSrc(
	app: App,
	raw: string,
	sourcePath: string,
): string | null {
	const text = raw.trim();
	if (!text) return null;
	if (/^https?:\/\//i.test(text)) return text;

	const normalized = normalizeImagePath(text);
	if (!normalized) return null;

	const dest = app.metadataCache.getFirstLinkpathDest(normalized, sourcePath);
	if (dest instanceof TFile && isImageExtension(dest.extension)) {
		return app.vault.getResourcePath(dest);
	}

	const file = app.vault.getAbstractFileByPath(normalized);
	if (file instanceof TFile && isImageExtension(file.extension)) {
		return app.vault.getResourcePath(file);
	}

	return null;
}
