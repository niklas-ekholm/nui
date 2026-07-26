
import {
	App,
	BasesEntry,
	BasesPropertyId,
	BasesViewConfig,
	FileValue,
	ImageValue,
	LinkValue,
	TFile,
	UrlValue,
	Value,
} from "obsidian";
import {
	isImageExtension,
	normalizeImagePath,
	resolveNoteImageSrc,
} from "../core/resolve/note-image";

export function resolveImageProperty(
	config: BasesViewConfig,
	fallback?: BasesPropertyId,
): BasesPropertyId | null {
	const fromConfig = config.getAsPropertyId("image");
	if (fromConfig) return fromConfig;

	const raw = config.get("image");
	if (typeof raw === "string" && raw.trim()) {
		return raw.trim() as BasesPropertyId;
	}

	return fallback ?? null;
}

export function resolveCardImageSrc(
	app: App,
	entry: BasesEntry,
	imageProperty: BasesPropertyId | null,
): string | null {
	if (!imageProperty) return null;

	if (imageProperty === "file.file") {
		if (isImageExtension(entry.file.extension)) {
			return app.vault.getResourcePath(entry.file);
		}
		const fileValue = entry.getValue("file.file");
		if (fileValue) {
			return valueToImageSrc(app, fileValue, entry.file.path);
		}
		return null;
	}

	const value = entry.getValue(imageProperty);
	if (!value) return null;

	return valueToImageSrc(app, value, entry.file.path);
}

function valueToImageSrc(
	app: App,
	value: Value,
	sourcePath: string,
): string | null {
	if (value instanceof ImageValue || value instanceof FileValue) {
		const normalized = normalizeImagePath(value.toString());
		if (!normalized) return null;
		return resolveNoteImageSrc(app, normalized, sourcePath);
	}

	if (value instanceof LinkValue) {
		const dest = app.metadataCache.getFirstLinkpathDest(
			value.toString(),
			sourcePath,
		);
		if (dest instanceof TFile && isImageExtension(dest.extension)) {
			return app.vault.getResourcePath(dest);
		}
		return null;
	}

	if (value instanceof UrlValue) {
		const url = value.toString().trim();
		return url || null;
	}

	const text = value.toString().trim();
	if (!text) return null;
	return resolveNoteImageSrc(app, text, sourcePath);
}
