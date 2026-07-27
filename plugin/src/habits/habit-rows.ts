/**
 * Which habit rows a tracker shows, and which folder each row reads.
 *
 * Pure: the caller adapts Obsidian's folder tree into `HabitRowHost` (see
 * `habit-bundle.ts`). Kept separate because the path a row points at is easy to
 * get wrong and worth testing directly — `obsidian` ships no runtime JS, so a
 * test cannot reach anything that imports it.
 */

export interface HabitRow {
	/** Row label: the habit folder's own name. */
	name: string;
	/** The habit folder the row's day notes live in. */
	path: string;
}

export interface HabitRowFolder {
	name: string;
	path: string;
	/** A folder is a habit when it has a hub note; that is the whole contract. */
	isHabitBundle: boolean;
}

export interface HabitRowHost extends HabitRowFolder {
	childFolders: HabitRowFolder[];
	/** Whether day notes sit directly in the host, beside any child habits. */
	hasDirectDayNotes: boolean;
}

/**
 * A row per child habit, plus the host itself when the host is a habit whose
 * completions sit directly inside it.
 *
 * Every row carries the folder it reads. A row is usually a child of the host,
 * but the host row points at the host — joining the host path with the row name
 * would give `Habits/Running/Running`, which does not exist, and the row would
 * render with no completions at all.
 */
export function resolveHabitRows(host: HabitRowHost): HabitRow[] {
	const rows: HabitRow[] = host.childFolders
		.filter((child) => child.isHabitBundle)
		.map((child) => ({ name: child.name, path: child.path }));

	const hostIsOwnRow =
		host.isHabitBundle && (rows.length === 0 || host.hasDirectDayNotes);
	if (hostIsOwnRow && !rows.some((row) => row.name === host.name)) {
		rows.push({ name: host.name, path: host.path });
	}

	return rows.sort((a, b) => a.name.localeCompare(b.name));
}
