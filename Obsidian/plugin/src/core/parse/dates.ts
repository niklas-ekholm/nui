
const START_KEYS = ["start", "date", "Start Date", "startDate", "start date"];
const END_KEYS = ["end", "dueDate", "End Date", "endDate", "end date"];

export function parseIsoDate(value: unknown): Date | null {
	if (typeof value !== "string" || !value.trim()) return null;

	const parsed = new Date(`${value.trim()}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}

function pickField(
	frontmatter: Record<string, unknown>,
	keys: string[],
): unknown {
	for (const key of keys) {
		if (key in frontmatter) return frontmatter[key];
	}

	const normalized = new Map(
		Object.entries(frontmatter).map(([k, v]) => [k.toLowerCase(), v]),
	);
	for (const key of keys) {
		const value = normalized.get(key.toLowerCase());
		if (value !== undefined) return value;
	}

	return undefined;
}

export function readStartDate(
	frontmatter: Record<string, unknown>,
): Date | null {
	return parseIsoDate(pickField(frontmatter, START_KEYS));
}

export function readEndDate(frontmatter: Record<string, unknown>): Date | null {
	return parseIsoDate(pickField(frontmatter, END_KEYS));
}

export function formatIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function formatDisplayDate(date: Date): string {
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${day}.${month}`;
}

export function formatMonthName(date: Date): string {
	return date.toLocaleString(undefined, { month: "long" });
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeekMonday(date: Date): Date {
	const d = startOfDay(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	return addDays(d, diff);
}

export function centerRangeOnToday(
	start: Date,
	end: Date,
	today: Date = new Date(),
): { start: Date; end: Date } {
	const span = Math.max(1, daysBetween(start, end));
	const todayDay = startOfDay(today);
	const nextStart = addDays(todayDay, -Math.floor(span / 2));
	return { start: nextStart, end: addDays(nextStart, span) };
}

export function centerRangeOnDate(
	anchor: Date,
	spanDays: number,
): { start: Date; end: Date } {
	const span = Math.max(1, spanDays);
	const anchorDay = startOfDay(anchor);
	const nextStart = addDays(anchorDay, -Math.floor(span / 2));
	return { start: nextStart, end: addDays(nextStart, span) };
}

export function shiftRangeStartToDate(
	start: Date,
	end: Date,
	newStart: Date,
): { start: Date; end: Date } {
	const span = Math.max(1, daysBetween(start, end));
	const nextStart = startOfDay(newStart);
	return { start: nextStart, end: addDays(nextStart, span) };
}

export function rangeMidpoint(start: Date, end: Date): Date {
	const span = Math.max(1, daysBetween(start, end));
	return addDays(start, Math.floor(span / 2));
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

export function daysBetween(start: Date, end: Date): number {
	const msPerDay = 24 * 60 * 60 * 1000;
	return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function dateRangesOverlap(
	rangeAStart: Date,
	rangeAEnd: Date,
	rangeBStart: Date,
	rangeBEnd: Date,
): boolean {
	return rangeAEnd >= rangeBStart && rangeAStart <= rangeBEnd;
}

export function isNoteActiveOnDate(
	frontmatter: Record<string, unknown>,
	day: Date = new Date(),
): boolean {
	const start = readStartDate(frontmatter);
	const end = readEndDate(frontmatter);

	if (!start && !end) return true;

	if (!start) return false;

	const dayStart = startOfDay(day);
	const safeEnd = end ?? start;
	const normalizedEnd =
		safeEnd.getTime() < start.getTime() ? start : safeEnd;
	return dateRangesOverlap(start, normalizedEnd, dayStart, dayStart);
}

