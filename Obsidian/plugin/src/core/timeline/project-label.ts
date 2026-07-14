
import { App, TFile } from "obsidian";
import { TimelineItem } from "../models/timeline-item";

export function parentFolderPathFromItemPath(filePath: string): string {
	const slash = filePath.lastIndexOf("/");
	return slash <= 0 ? "" : filePath.slice(0, slash);
}

function folderIndexPath(folderPath: string): string {
	if (!folderPath) {
		return "";
	}
	const folderName = folderPath.slice(folderPath.lastIndexOf("/") + 1);
	return `${folderPath}/${folderName}.md`;
}

function readProjectLabelFromIndexPath(
	app: App,
	indexPath: string,
): string | undefined {
	if (!indexPath) return undefined;

	const file = app.vault.getAbstractFileByPath(indexPath);
	if (!(file instanceof TFile)) return undefined;

	const raw = app.metadataCache.getFileCache(file)?.frontmatter?.projectLabel;
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		return trimmed || undefined;
	}
	if (typeof raw === "number") {
		return String(raw);
	}

	return undefined;
}

export function resolveProjectRootFolderFromPath(
	app: App,
	itemPath: string,
): string | undefined {
	let folderPath = parentFolderPathFromItemPath(itemPath);

	while (folderPath) {
		const label = readProjectLabelFromIndexPath(
			app,
			folderIndexPath(folderPath),
		);
		if (label) return folderPath;

		const slash = folderPath.lastIndexOf("/");
		if (slash < 0) break;
		folderPath = folderPath.slice(0, slash);
	}

	return undefined;
}

export function resolveProjectLabelFromIndexNotes(
	app: App,
	itemPath: string,
): string | undefined {
	const folderPath = resolveProjectRootFolderFromPath(app, itemPath);
	if (!folderPath) return undefined;
	return readProjectLabelFromIndexPath(app, folderIndexPath(folderPath));
}

export function resolveProjectLabelForItem(
	app: App,
	item: TimelineItem,
): string | undefined {
	return (
		resolveProjectLabelFromIndexNotes(app, item.id) ?? item.project ?? undefined
	);
}

export function hasMultipleProjectFolders(items: TimelineItem[]): boolean {
	const folders = new Set<string>();
	for (const item of items) {
		const folder = parentFolderPathFromItemPath(item.id);
		if (folder) folders.add(folder);
	}
	return folders.size > 1;
}

