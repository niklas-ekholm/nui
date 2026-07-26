import assert from "node:assert/strict";
import test from "node:test";
import {
	habitsRootPath,
	isPathInsideHabitsRoot,
	parentFolderPathOf,
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

test("parentFolderPathOf walks up one level", () => {
	assert.equal(parentFolderPathOf("Habits/Liikunta/Aamujumppa"), "Habits/Liikunta");
	assert.equal(parentFolderPathOf("Habits/Chess"), "Habits");
	assert.equal(parentFolderPathOf("Habits"), "");
	assert.equal(parentFolderPathOf("Habits/Chess/"), "Habits");
});
