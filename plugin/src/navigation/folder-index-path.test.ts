import assert from "node:assert/strict";
import test from "node:test";
import {
	displayBasenameForNotePath,
	getFolderIndexFolderName,
	getFolderIndexPathFromFolderPath,
	getFolderIndexPath,
	isFolderIndexPath,
	isHiddenNavFilePath,
	isOkfSidecarPath,
	resolveFolderPath,
	resolveParentFolderPathFromFilePath,
	setVaultRootName,
	shouldHideNavFilePath,
} from "./folder-index-path.ts";

test("isHiddenNavFilePath hides agent stub files at vault root", () => {
	assert.equal(isHiddenNavFilePath("CLAUDE.md"), true);
	assert.equal(isHiddenNavFilePath("AGENTS.md"), true);
	assert.equal(isHiddenNavFilePath("ai/ai.md"), false);
	assert.equal(isHiddenNavFilePath("NUI/CLAUDE.md"), false);
});

test("shouldHideNavFilePath hides nothing until asked", () => {
	const off = { hideIndexInExplorer: false, hideAgentStubs: false };
	assert.equal(shouldHideNavFilePath("CLAUDE.md", off), false);
	assert.equal(shouldHideNavFilePath("NUI/NUI.md", off), false);
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
		shouldHideNavFilePath("NUI/NUI.md", {
			hideIndexInExplorer: true,
			hideAgentStubs: false,
		}),
		true,
	);
	assert.equal(
		shouldHideNavFilePath("NUI/NUI.md", {
			hideIndexInExplorer: false,
			hideAgentStubs: true,
		}),
		false,
	);
});

test("resolveParentFolderPathFromFilePath walks up to the vault root hub", () => {
	assert.equal(resolveParentFolderPathFromFilePath("index.md"), null);
	assert.equal(resolveParentFolderPathFromFilePath("NUI/NUI.md"), "");
	assert.equal(
		resolveParentFolderPathFromFilePath("NUI/docs/docs.md"),
		"NUI",
	);
	assert.equal(getFolderIndexPathFromFolderPath(""), "index.md");
});

test("resolveParentFolderPathFromFilePath opens the containing folder hub when it exists", () => {
	const exists = (path: string) =>
		path === "Projects/Bunker library/Bunker library.md" ||
		path === "NUI/docs/docs.md" ||
		path === "Projects/Projects.md";

	assert.equal(
		resolveParentFolderPathFromFilePath(
			"Projects/Bunker library/Phase 1.md",
			exists,
		),
		"Projects/Bunker library",
	);
	assert.equal(
		resolveParentFolderPathFromFilePath("Projects/Lantern.md", exists),
		"Projects",
	);
});

test("resolveParentFolderPathFromFilePath skips folders without a hub note", () => {
	const exists = (path: string) => path === "NUI/docs/docs.md";

	assert.equal(
		resolveParentFolderPathFromFilePath(
			"NUI/docs/concepts/foo.md",
			exists,
		),
		"NUI/docs",
	);
});

test("resolveFolderPath treats empty path as vault root", () => {
	const root = { path: "" };
	const folders = new Map([
		["NUI", { path: "NUI" }],
		["NUI/docs", { path: "NUI/docs" }],
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

test("the vault root is the root whether its path is \"\" or \"/\"", () => {
	// Obsidian's real root TFolder reports path "/" and an empty name. Mocking
	// it as "" is what let the root hub break in a real vault while every unit
	// test passed: the hub resolved to "//{VaultName}.md", which
	// getAbstractFileByPath never matches, so Cmd+Escape and the vault
	// breadcrumb both dead-ended one level below the root.
	const root = { path: "/" };
	const folders = new Map([["NUI", { path: "NUI" }]]);
	const resolve = (path: string) =>
		resolveFolderPath(path, () => root, (p) => folders.get(p) ?? null);

	assert.deepEqual(resolve("/"), root);
	assert.deepEqual(resolve(""), root);
	assert.deepEqual(resolve("NUI"), { path: "NUI" });

	try {
		setVaultRootName("My Vault");
		assert.equal(getFolderIndexPath({ path: "/", name: "" }), "My Vault.md");
		assert.equal(getFolderIndexPathFromFolderPath("/"), "My Vault.md");
		// A trailing slash is the same folder, not a child of it.
		assert.equal(getFolderIndexPath({ path: "NUI/", name: "NUI" }), "NUI/NUI.md");
	} finally {
		setVaultRootName("index");
	}
});

test("getFolderIndexPath names a folder's hub note after the folder", () => {
	assert.equal(getFolderIndexPath({ path: "", name: "" }), "index.md");
	assert.equal(getFolderIndexPath({ path: "NUI", name: "NUI" }), "NUI/NUI.md");
	assert.equal(
		getFolderIndexPath({ path: "NUI/docs", name: "docs" }),
		"NUI/docs/docs.md",
	);
});

test("getFolderIndexPathFromFolderPath derives the folder name from the path", () => {
	assert.equal(getFolderIndexPathFromFolderPath(""), "index.md");
	assert.equal(getFolderIndexPathFromFolderPath("NUI"), "NUI/NUI.md");
	assert.equal(
		getFolderIndexPathFromFolderPath("NUI/docs"),
		"NUI/docs/docs.md",
	);
});

test("isFolderIndexPath accepts a folder's own hub note, or the root hub", () => {
	assert.equal(isFolderIndexPath("index.md"), true);
	assert.equal(isFolderIndexPath("NUI/NUI.md"), true);
	assert.equal(isFolderIndexPath("NUI/docs/docs.md"), true);
	assert.equal(isFolderIndexPath("NUI/docs/NUI.md"), false);
	assert.equal(isFolderIndexPath("NUI/index.md"), false);
	assert.equal(isFolderIndexPath("Untitled.md"), false);
});

test("isOkfSidecarPath accepts the fixed index.md filename in any folder", () => {
	assert.equal(isOkfSidecarPath("index.md"), true);
	assert.equal(isOkfSidecarPath("NUI/index.md"), true);
	assert.equal(isOkfSidecarPath("NUI/docs/index.md"), true);
	assert.equal(isOkfSidecarPath("NUI/NUI.md"), false);
	assert.equal(isOkfSidecarPath("NUI/my-index.md"), false);
});

test("displayBasenameForNotePath uses parent folder name for a hub note", () => {
	assert.equal(displayBasenameForNotePath("NUI/docs/docs.md"), "docs");
	assert.equal(displayBasenameForNotePath("NUI/project.md"), "project");
	assert.equal(displayBasenameForNotePath("index.md"), "index");
});

test("getFolderIndexFolderName resolves timeline titles for a folder's hub note", () => {
	assert.equal(getFolderIndexFolderName("NUI/NUI.md"), "NUI");
	assert.equal(
		getFolderIndexFolderName("NUI/NUI Projects/Superproject/Superproject.md"),
		"Superproject",
	);
	assert.equal(getFolderIndexFolderName("index.md"), null);
	assert.equal(getFolderIndexFolderName("NUI/project.md"), null);
});

test("setVaultRootName names the root hub after the vault, like any other folder", () => {
	try {
		setVaultRootName("My Vault");
		assert.equal(getFolderIndexPath({ path: "", name: "" }), "My Vault.md");
		assert.equal(getFolderIndexPathFromFolderPath(""), "My Vault.md");
		assert.equal(isFolderIndexPath("My Vault.md"), true);
		assert.equal(isFolderIndexPath("index.md"), false);
		// the root's OKF sidecar, if the root is ever marked OKF, is a
		// distinct file from its hub once the hub isn't named "index.md".
		assert.equal(isOkfSidecarPath("index.md"), true);

		setVaultRootName("  ");
		assert.equal(getFolderIndexPathFromFolderPath(""), "index.md");
	} finally {
		setVaultRootName("index");
	}
});
