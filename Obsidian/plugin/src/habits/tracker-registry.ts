
import type { WeekTracker3BasesView } from "../views/week-tracker-3-bases-view";
import type { YearTrackerBasesView } from "../views/year-tracker-bases-view";

const weekTrackerViews = new Set<WeekTracker3BasesView>();
const yearTrackerViews = new Set<YearTrackerBasesView>();

export function registerWeekTrackerView(view: WeekTracker3BasesView): void {
	weekTrackerViews.add(view);
}

export function unregisterWeekTrackerView(view: WeekTracker3BasesView): void {
	weekTrackerViews.delete(view);
}

export function registerYearTrackerView(view: YearTrackerBasesView): void {
	yearTrackerViews.add(view);
}

export function unregisterYearTrackerView(view: YearTrackerBasesView): void {
	yearTrackerViews.delete(view);
}

export function refreshAllTrackerViews(): void {
	for (const view of weekTrackerViews) {
		view.refreshAfterHabitChange();
	}
	for (const view of yearTrackerViews) {
		view.refreshAfterHabitChange();
	}
}

/** @deprecated Use refreshAllTrackerViews */
export function refreshWeekTrackerViews(): void {
	refreshAllTrackerViews();
}

