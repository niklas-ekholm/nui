import assert from "node:assert/strict";
import test from "node:test";
import {
	displayBasenameForNotePath,
	getFolderIndexFolderName,
	getFolderIndexPathFromFolderPath,
	getFolderIndexPath,
	isFolderIndexPath,
	isHiddenNavFilePath,
	isSameNamedFolderNote,
	resolveFolderPath,
	resolveParentFolderPathFromFilePath,
	shouldHideNavFilePath,
} from "./folder-index-path.ts";

test("isHiddenNavFilePath hides agent stub files at vault root", () => {
	assert.equal(isHiddenNavFilePath("CLAUDE.md"), true);
	assert.equal(isHiddenNavFilePath("AGENTS.md"), true);
	assert.equal(isHiddenNavFilePath("ai/index.md"), false);
	assert.equal(isHiddenNavFilePath("NUI/CLAUDE.md"), false);
});

test("shouldHideNavFilePath always hides agent stubs", () => {
	assert.equal(shouldHideNavFilePath("CLAUDE.md", false), true);
	assert.equal(shouldHideNavFilePath("NUI/index.md", false), false);
	assert.equal(shouldHideNavFilePath("NUI/index.md", true), true);
});

test("resolveParentFolderPathFromFilePath walks up to the vault root index", () => {
	assert.equal(resolveParentFolderPathFromFilePath("index.md"), null);
	assert.equal(resolveParentFolderPathFromFilePath("NUI/index.md"), "");
	assert.equal(
		resolveParentFolderPathFromFilePath("NUI/NUIdocs/index.md"),
		"NUI",
	);
	assert.equal(
		resolveParentFolderPathFromFilePath("NUI/NUIdocs/concepts/foo.md"),
		"NUI/NUIdocs",
	);
	assert.equal(
		getFolderIndexPathFromFolderPath(""),
		"index.md",
	);
});

test("resolveFolderPath treats empty path as vault root", () => {
	const root = { path: "" };
	const folders = new Map([
		["NUI", { path: "NUI" }],
		["NUI/NUIdocs", { path: "NUI/NUIdocs" }],
	]);

	assert.deepEqual(
		resolveFolderPath("", () => root, (path) => folders.get(path) ?? null),
		root,
	);
	assert.deepEqual(
		resolveFolderPath("NUI", () => root, (path) => folders.get(path) ?? null),
		{ path: "NUI" },
	);
	assert.equal(
		resolveFolderPath("missing", () => root, (path) => folders.get(path) ?? null),
		null,
	);
});

test("getFolderIndexPath resolves root and nested folder indexes", () => {
	assert.equal(getFolderIndexPath({ path: "" }), "index.md");
	assert.equal(getFolderIndexPath({ path: "NUI" }), "NUI/index.md");
	assert.equal(
		getFolderIndexPath({ path: "NUI/NUIdocs" }),
		"NUI/NUIdocs/index.md",
	);
});

test("isFolderIndexPath only accepts an index.md path segment", () => {
	assert.equal(isFolderIndexPath("index.md"), true);
	assert.equal(isFolderIndexPath("NUI/index.md"), true);
	assert.equal(isFolderIndexPath("NUI/NUIdocs/index.md"), true);
	assert.equal(isFolderIndexPath("NUI/my-index.md"), false);
	assert.equal(isFolderIndexPath("NUI/index.md.backup"), false);
});

test("displayBasenameForNotePath uses parent folder name for folder indexes", () => {
	assert.equal(displayBasenameForNotePath("NUI/NUIdocs/index.md"), "NUIdocs");
	assert.equal(displayBasenameForNotePath("NUI/project.md"), "project");
	assert.equal(displayBasenameForNotePath("index.md"), "index");
});

test("getFolderIndexFolderName resolves timeline titles for folder indexes", () => {
	assert.equal(getFolderIndexFolderName("NUI/index.md"), "NUI");
	assert.equal(
		getFolderIndexFolderName("NUI/NUI Projects/Superproject/index.md"),
		"Superproject",
	);
	assert.equal(getFolderIndexFolderName("index.md"), null);
	assert.equal(getFolderIndexFolderName("NUI/project.md"), null);
});

test("same-named notes remain a distinct habit-only convention", () => {
	assert.equal(isSameNamedFolderNote("Habits/Walking/Walking.md"), true);
	assert.equal(isSameNamedFolderNote("Habits/Walking/index.md"), false);
	assert.equal(isSameNamedFolderNote("NUI/NUI.md"), true);
	assert.equal(isSameNamedFolderNote("NUI/index.md"), false);
});
