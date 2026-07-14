
export type CardTitleMode =
	| "none"
	| "card-s"
	| "card-l"
	| "list-files"
	| "list-folders";
export type CardImageFit = "cover" | "contain";

export const PICTURE_GALLERY_BASES_VIEW_TYPE = "nui-picture-gallery";
export const CARD_S_BASES_VIEW_TYPE = "nui-card-s";
export const CARD_L_BASES_VIEW_TYPE = "nui-card-l";
export const LIST_FILES_BASES_VIEW_TYPE = "nui-list-files";
export const LIST_FILES_BY_DATE_BASES_VIEW_TYPE = "nui-list-files-by-date";
export const LIST_FOLDERS_BASES_VIEW_TYPE = "nui-list-folders";
export const NAVIGATION_BASES_VIEW_TYPE = "nui-navigation";
export const DAILY_NOTE_LINK_BASES_VIEW_TYPE = "nui-daily-note-link";
export const TASK_LIST_BASES_VIEW_TYPE = "nui-task-list";
export const YEAR_TRACKER_BASES_VIEW_TYPE = "nui-year-tracker";
export const WEEK_TRACKER_3_BASES_VIEW_TYPE = "nui-week-tracker-3";

export function mergeCardSize(value: unknown, fallback: number): number {
	const size = Number(value);
	if (!Number.isFinite(size)) return fallback;
	return Math.min(400, Math.max(80, Math.round(size)));
}

export function mergeAspectRatio(value: unknown, fallback = 1): number {
	const ratio = Number(value);
	if (!Number.isFinite(ratio)) return fallback;
	return Math.min(2, Math.max(0.5, ratio));
}

export function mergeImageFit(value: unknown, fallback: CardImageFit): CardImageFit {
	if (value === "contain") return "contain";
	if (value === "cover" || value === "") return "cover";
	if (typeof value === "string") {
		const fit = value.trim().toLowerCase();
		if (fit === "contain") return "contain";
		if (fit === "cover") return "cover";
	}
	return fallback;
}

export function mergeShowCompleted(value: unknown, fallback = false): boolean {
	if (value === true) return true;
	if (value === false) return false;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true" || normalized === "yes") return true;
		if (normalized === "false" || normalized === "no") return false;
	}
	return fallback;
}

export type TaskProjectScope = "all" | "ongoing";

export function mergeTaskProjectScope(
	value: unknown,
	fallback: TaskProjectScope = "all",
): TaskProjectScope {
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "ongoing") return "ongoing";
		if (normalized === "all") return "all";
	}
	return fallback;
}

