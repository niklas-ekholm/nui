/**
 * The seam between feature areas.
 *
 * Bases views need four things from the folder-index area and a handful of
 * fields from the plugin object. Routing them through here — rather than
 * importing the 687-line folder-index manager, or casting the plugin to an
 * inline anonymous type — keeps the views independent of how navigation is
 * implemented, and keeps a later split possible.
 */

import type { Plugin } from "obsidian";
import type { TimelineTimespan } from "../timeline/types";

export {
	findHostFileForElement,
	openFileInWorkspace,
} from "../navigation/folder-index";

export {
	getFolderIndexPath,
	isFolderIndexPath,
} from "../navigation/folder-index-path";

/** The one folder-index capability views use, without the manager behind it. */
export interface FolderIndexOpener {
	openFolderIndex(folderPath: string): Promise<boolean>;
}

/** Plugin fields shared by features that persist editor UI state. */
export type ColorPickerHistoryHost = Plugin & {
	settings: { editor: { recentColors: string[] } };
	saveSettings(): Promise<void>;
};

/** Plugin fields the timeline view reads and writes. */
export interface TimelineHostPlugin extends ColorPickerHistoryHost {
	timelineRowSize: number;
	timelineTimespan: TimelineTimespan;
	timelineRangeStart?: string;
	timelineRangeEnd?: string;
	timelineShowFolderContents: boolean;
	saveTimelineSettings: () => Promise<void>;
}

/** Plugin fields the tracker views read. */
export interface TrackerHostPlugin extends Plugin {
	folderIndexManager: FolderIndexOpener | null;
	habitsRoot: string;
}
