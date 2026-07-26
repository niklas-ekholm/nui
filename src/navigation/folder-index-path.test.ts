import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	displayBasenameForNotePath,
	getFolderIndexFolderName,
	getFolderIndexPathFromFolderPath,
	getFolderIndexPath,
	isFolderIndexPath,
	isHiddenNavFilePath,
	normalizeFolderIndexFilename,
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

test("shouldHideNavFilePath hides nothing until asked", () => {
	const off = { hideIndexInExplorer: false, hideAgentStubs: false };
	assert.equal(shouldHideNavFilePath("CLAUDE.md", off), false);
	assert.equal(shouldHideNavFilePath("NUI/index.md", off), false);
});

test("shouldHideNavFilePath honours each toggle independently", () => {
	assert.equal(
		shouldHideNavFilePath("CLAUDE.md", {
			hideIndexInExplorer: false,
			hideAgentStubs: true,
		}),
		true,
	);
	assert.equal(
		shouldHideNavFilePath("NUI/index.md", {
			hideIndexInExplorer: true,
			hideAgentStubs: false,
		}),
		true,
	);
	assert.equal(
		shouldHideNavFilePath("NUI/index.md", {
			hideIndexInExplorer: false,
			hideAgentStubs: true,
		}),
		false,
	);
});

test("the index filename is configurable", () => {
	assert.equal(getFolderIndexPath({ path: "NUI" }, "_index.md"), "NUI/_index.md");
	assert.equal(isFolderIndexPath("NUI/_index.md", "_index.md"), true);
	assert.equal(isFolderIndexPath("NUI/index.md", "_index.md"), false);
	assert.equal(getFolderIndexFolderName("NUI/Docs/_index.md", "_index.md"), "Docs");
});

test("normalizeFolderIndexFilename rejects anything but a bare filename", () => {
	assert.equal(normalizeFolderIndexFilename("home"), "home.md");
	assert.equal(normalizeFolderIndexFilename("  home.md  "), "home.md");
	assert.equal(normalizeFolderIndexFilename("a/b.md"), "index.md");
	assert.equal(normalizeFolderIndexFilename(""), "index.md");
	assert.equal(normalizeFolderIndexFilename("   "), "index.md");
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

/**
 * Architecture guard for the retired hub-note convention.
 *
 * Before the index.md model, a folder's hub note was named after the folder
 * (`Walking/Walking.md`), and habits were renamed by renaming that note. Both
 * conventions were deleted; a same-named note is now an ordinary note. These
 * tests fail if the check comes back.
 */
test("a note named after its folder is not a folder index", () => {
	assert.equal(isFolderIndexPath("Habits/Walking/Walking.md"), false);
	assert.equal(isFolderIndexPath("NUI/NUI.md"), false);
	assert.equal(isFolderIndexPath("Habits/Walking/index.md"), true);
});

test("the same-named hub-note check has not returned", () => {
	const srcDir = dirname(dirname(fileURLToPath(import.meta.url)));

	const walk = (dir: string): string[] =>
		readdirSync(dir).flatMap((name) => {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) return walk(full);
			return name.endsWith(".ts") && !name.endsWith(".test.ts") ? [full] : [];
		});

	for (const file of walk(srcDir)) {
		const text = readFileSync(file, "utf8");
		assert.equal(
			text.includes("isSameNamedFolderNote"),
			false,
			`${file} references isSameNamedFolderNote; the hub-note convention was removed`,
		);
	}
});
