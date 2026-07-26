import assert from "node:assert/strict";
import test from "node:test";
import {
	habitDepthFromRoot,
	habitsRootPath,
	isPathInsideHabitsRoot,
	parentFolderPathOf,
	siblingHabitFolderPath,
} from "./habit-path.ts";

const ROOT = "Habits";

test("isPathInsideHabitsRoot matches habits at any depth", () => {
	assert.equal(isPathInsideHabitsRoot("Habits/Chess", ROOT), true);
	assert.equal(isPathInsideHabitsRoot("Habits/Liikunta/Aamujumppa", ROOT), true);
	assert.equal(isPathInsideHabitsRoot("Habits/a/b/c/d", ROOT), true);
});

test("isPathInsideHabitsRoot excludes the root, siblings, and outsiders", () => {
	assert.equal(isPathInsideHabitsRoot("Habits", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("Habits/", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("Habits2/Chess", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("HabitsArchive/Chess", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("Archive/Habits/Chess", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("Archive/Chess", ROOT), false);
	assert.equal(isPathInsideHabitsRoot("", ROOT), false);
});

test("isPathInsideHabitsRoot needs a non-empty root", () => {
	assert.equal(isPathInsideHabitsRoot("Habits/Chess", ""), false);
	assert.equal(isPathInsideHabitsRoot("Habits/Chess", "   "), false);
});

test("habitsRootPath trims whitespace and a trailing slash", () => {
	assert.equal(habitsRootPath(" Habits/ "), "Habits");
	assert.equal(habitsRootPath("Habits"), "Habits");
});

test("a trailing slash on the folder path does not change membership", () => {
	assert.equal(isPathInsideHabitsRoot("Habits/Chess/", ROOT), true);
	assert.equal(isPathInsideHabitsRoot("Habits/Chess", " Habits/ "), true);
});

test("habitDepthFromRoot counts nesting below the root", () => {
	assert.equal(habitDepthFromRoot("Habits", ROOT), 0);
	assert.equal(habitDepthFromRoot("Archive/Chess", ROOT), 0);
	assert.equal(habitDepthFromRoot("Habits/Chess", ROOT), 1);
	assert.equal(habitDepthFromRoot("Habits/Liikunta/Aamujumppa", ROOT), 2);
	assert.equal(habitDepthFromRoot("Habits/a/b/c", ROOT), 3);
});

test("parentFolderPathOf walks up one level", () => {
	assert.equal(parentFolderPathOf("Habits/Liikunta/Aamujumppa"), "Habits/Liikunta");
	assert.equal(parentFolderPathOf("Habits/Chess"), "Habits");
	assert.equal(parentFolderPathOf("Habits"), "");
	assert.equal(parentFolderPathOf("Habits/Chess/"), "Habits");
});

test("siblingHabitFolderPath keeps a renamed habit at its own depth", () => {
	// The regression this guards: a nested habit must not be hoisted to the root.
	assert.equal(
		siblingHabitFolderPath("Habits/Liikunta/Aamujumppa", "Iltajumppa"),
		"Habits/Liikunta/Iltajumppa",
	);
	assert.equal(siblingHabitFolderPath("Habits/Chess", "Shakki"), "Habits/Shakki");
	assert.equal(siblingHabitFolderPath("Chess", "Shakki"), "Shakki");
});

test("siblingHabitFolderPath trims the new name", () => {
	assert.equal(siblingHabitFolderPath("Habits/Chess", "  Shakki  "), "Habits/Shakki");
});
