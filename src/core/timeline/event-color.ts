import { App, TFile } from "obsidian";
import { normalizeHexColor } from "../../editor/text-color-utils";
import { getFolderIndexPathFromFolderPath } from "../../navigation/folder-index-path";
import { parentFolderPathFromItemPath } from "./project-label";

/** Empty for the vault root: an item there has no ancestor folder to inherit from. */
function folderIndexPath(folderPath: string): string {
	return folderPath ? getFolderIndexPathFromFolderPath(folderPath) : "";
}

function readColorFromIndexPath(app: App, indexPath: string): string | undefined {
	if (!indexPath) return undefined;

	const file = app.vault.getAbstractFileByPath(indexPath);
	if (!(file instanceof TFile)) return undefined;

	return (
		normalizeHexColor(
			app.metadataCache.getFileCache(file)?.frontmatter?.color,
		) ?? undefined
	);
}

/**
 * Event color: note's own `color`, else nearest ancestor folder-index `color`
 * (so a parent folder color applies to all nested events).
 */
export function resolveInheritedEventColor(
	app: App,
	itemPath: string,
	ownColor?: string,
): string | undefined {
	if (ownColor) {
		return ownColor;
	}

	let folderPath = parentFolderPathFromItemPath(itemPath);
	while (folderPath) {
		const color = readColorFromIndexPath(app, folderIndexPath(folderPath));
		if (color) {
			return color;
		}

		const slash = folderPath.lastIndexOf("/");
		if (slash < 0) break;
		folderPath = folderPath.slice(0, slash);
	}

	return undefined;
}
