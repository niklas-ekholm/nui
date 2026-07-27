
import { App, TFile, TFolder } from "obsidian";
import { getFolderIndexPath } from "./folder-index-path";

/**
 * Marks a folder's hub note as the root of an OKF-conformant space. Set once
 * on a space's root hub (e.g. `N-cyclopedia/N-cyclopedia.md`); every folder
 * beneath it inherits OKF status — see `isOkfSpaceFolder`.
 *
 * Deliberately not the vault root's own hub note unless the whole vault is
 * one OKF bundle: marking the root would cascade OKF status to every folder.
 */
const OKF_MARKER_KEY = "okf_version";

/**
 * True when `folder` or any ancestor's hub note declares `okf_version` in its
 * frontmatter. Mirrors the ancestor-walk in
 * `core/timeline/project-label.ts::resolveProjectRootFolderFromPath` — cheap,
 * in-memory `metadataCache` reads only, no disk I/O.
 */
export function isOkfSpaceFolder(app: App, folder: TFolder): boolean {
	let current: TFolder | null = folder;

	while (current) {
		const hubPath = getFolderIndexPath(current);
		const hub = app.vault.getAbstractFileByPath(hubPath);
		if (hub instanceof TFile) {
			const frontmatter = app.metadataCache.getFileCache(hub)?.frontmatter;
			if (frontmatter && frontmatter[OKF_MARKER_KEY] !== undefined) {
				return true;
			}
		}
		current = current.parent;
	}

	return false;
}
