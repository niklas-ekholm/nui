import assert from "node:assert/strict";
import test from "node:test";
import { resolveHabitRows, type HabitRowHost } from "./habit-rows.ts";

function host(overrides: Partial<HabitRowHost> & Pick<HabitRowHost, "name" | "path">) {
	return {
		isHabitBundle: false,
		hasDirectDayNotes: false,
		childFolders: [],
		...overrides,
	} satisfies HabitRowHost;
}

const bundle = (name: string, path: string) => ({
	name,
	path,
	isHabitBundle: true,
});

test("a habit folder hosting its own tracker is one row pointing at itself", () => {
	// Habits/Running keeps its completions directly inside it and has no habit
	// subfolders. The row must read Habits/Running — joining the host path with
	// the row name gives Habits/Running/Running, which does not exist, and the
	// row renders with every day blank.
	assert.deepEqual(
		resolveHabitRows(
			host({ name: "Running", path: "Habits/Running", isHabitBundle: true }),
		),
		[{ name: "Running", path: "Habits/Running" }],
	);
});

test("a folder of habits gives one row per child habit", () => {
	assert.deepEqual(
		resolveHabitRows(
			host({
				name: "Habits",
				path: "Habits",
				isHabitBundle: true,
				childFolders: [
					bundle("Running", "Habits/Running"),
					bundle("Reading", "Habits/Reading"),
					bundle("Writing", "Habits/Writing"),
				],
			}),
		),
		[
			{ name: "Reading", path: "Habits/Reading" },
			{ name: "Running", path: "Habits/Running" },
			{ name: "Writing", path: "Habits/Writing" },
		],
	);
});

test("the host is not a row when its children carry the completions", () => {
	// Habits itself has a hub note, but no day notes of its own, so it is a
	// container rather than a habit and must not add an empty row.
	const rows = resolveHabitRows(
		host({
			name: "Habits",
			path: "Habits",
			isHabitBundle: true,
			childFolders: [bundle("Running", "Habits/Running")],
		}),
	);
	assert.deepEqual(rows, [{ name: "Running", path: "Habits/Running" }]);
});

test("a folder with both its own days and child habits appears alongside them", () => {
	assert.deepEqual(
		resolveHabitRows(
			host({
				name: "Habits",
				path: "Habits",
				isHabitBundle: true,
				hasDirectDayNotes: true,
				childFolders: [bundle("Reading", "Habits/Reading")],
			}),
		),
		[
			{ name: "Habits", path: "Habits" },
			{ name: "Reading", path: "Habits/Reading" },
		],
	);
});

test("a child sharing the host's name is listed once, as the child", () => {
	const rows = resolveHabitRows(
		host({
			name: "Running",
			path: "Habits/Running",
			isHabitBundle: true,
			hasDirectDayNotes: true,
			childFolders: [bundle("Running", "Habits/Running/Running")],
		}),
	);
	assert.deepEqual(rows, [{ name: "Running", path: "Habits/Running/Running" }]);
});

test("folders without a hub note are not habits", () => {
	assert.deepEqual(
		resolveHabitRows(
			host({
				name: "Bases",
				path: "Bases",
				childFolders: [{ name: "Assets", path: "Bases/Assets", isHabitBundle: false }],
			}),
		),
		[],
	);
});
