import { daysBetween, startOfDay } from "../parse/dates";

/** Left position (0–100) for the today accent line, or null if today is out of range. */
export function computeTodayLineOffsetPercent(
	rangeStart: Date,
	totalDays: number,
	now: Date = new Date(),
): number | null {
	const todayStart = startOfDay(now);
	const todayOffsetDays = daysBetween(rangeStart, todayStart);
	if (todayOffsetDays < 0 || todayOffsetDays > totalDays) return null;

	const dayStartPercent = (todayOffsetDays / totalDays) * 100;
	const dayWidthPercent = (1 / totalDays) * 100;
	const hourSlot = now.getHours();
	return dayStartPercent + (hourSlot / 24) * dayWidthPercent;
}
