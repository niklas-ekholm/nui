import assert from "node:assert/strict";
import test from "node:test";
import {
	canMoveIntoProjectFolder,
	destinationFolderForMoveOut,
	isPathInsideProjectFolder,
} from "../mutate/project-folder-move-rules.ts";

test("canMoveIntoProjectFolder allows moving a folder hub into another folder hub", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Inner/Inner.md",
			"Projects/Outer/Outer.md",
		),
		true,
	);
});

test("canMoveIntoProjectFolder blocks moving a folder hub into itself", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Outer/Outer.md",
			"Projects/Outer/Outer.md",
		),
		false,
	);
});

test("canMoveIntoProjectFolder blocks moving a folder hub into its descendant", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Outer/Outer.md",
			"Projects/Outer/Inner/Inner.md",
		),
		false,
	);
});

test("canMoveIntoProjectFolder blocks moving a folder hub that is already nested under target", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Outer/Inner/Inner.md",
			"Projects/Outer/Outer.md",
		),
		false,
	);
});

test("canMoveIntoProjectFolder still allows normal notes into a folder hub", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Phase 1.md",
			"Projects/Outer/Outer.md",
		),
		true,
	);
});

test("canMoveIntoProjectFolder blocks normal notes already in target folder", () => {
	assert.equal(
		canMoveIntoProjectFolder(
			"Projects/Outer/Phase 1.md",
			"Projects/Outer/Outer.md",
		),
		false,
	);
});

test("isPathInsideProjectFolder treats nested folder hubs as inside a project folder", () => {
	const hubs = new Set(["Projects/Outer/Outer.md"]);
	const hasHub = (folderPath: string) =>
		hubs.has(`${folderPath}/${folderPath.split("/").pop()}.md`);

	assert.equal(
		isPathInsideProjectFolder("Projects/Outer/Inner/Inner.md", hasHub),
		true,
	);
});

test("isPathInsideProjectFolder treats root folder hubs as not nested", () => {
	const hubs = new Set(["Projects/Outer/Outer.md"]);
	const hasHub = (folderPath: string) =>
		hubs.has(`${folderPath}/${folderPath.split("/").pop()}.md`);

	assert.equal(
		isPathInsideProjectFolder("Projects/Outer/Outer.md", hasHub),
		false,
	);
});

test("destinationFolderForMoveOut moves nested folder hubs to the parent project folder's parent", () => {
	assert.equal(
		destinationFolderForMoveOut("Projects/Outer/Inner/Inner.md"),
		"Projects",
	);
});

test("destinationFolderForMoveOut moves normal notes out of a project folder", () => {
	assert.equal(
		destinationFolderForMoveOut("Projects/Outer/Phase 1.md"),
		"Projects",
	);
});
