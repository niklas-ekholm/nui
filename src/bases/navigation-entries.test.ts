import assert from "node:assert/strict";
import test from "node:test";
import {
	folderNameForEntry,
	isDirectChildFolderIndexPath,
	partitionNavigationEntryPathsForHost,
} from "./navigation-entry-path.ts";
import { isFolderIndexPath } from "../navigation/folder-index-path.ts";

function entry(path: string) {
	const parts = path.split("/");
	const name = parts.pop() ?? "";
	const parentPath = parts.join("/");
	const parentName = parts.at(-1) ?? "";
	return {
		file: {
			path,
			basename: name.replace(/\.md$/i, ""),
			parent: { path: parentPath, name: parentName },
		},
	};
}

test("direct child index detection works at root and nested hosts", () => {
	assert.equal(
		isDirectChildFolderIndexPath(entry("NUI/index.md"), "", isFolderIndexPath),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(entry("NUI/index.md"), "/", isFolderIndexPath),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("NUI/NUIdocs/index.md"),
			"NUI",
			isFolderIndexPath,
		),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("NUI/NUIdocs/Design/index.md"),
			"NUI",
			isFolderIndexPath,
		),
		false,
	);
	assert.equal(
		isDirectChildFolderIndexPath(entry("NUI/NUI.md"), "", isFolderIndexPath),
		false,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("Habits/Walking/Walking.md"),
			"Habits",
			isFolderIndexPath,
		),
		false,
	);
});

test("folder entries display their parent folder name", () => {
	assert.equal(folderNameForEntry(entry("NUI/index.md")), "NUI");
	assert.equal(folderNameForEntry(entry("NUI/NUIdocs/index.md")), "NUIdocs");
});

test("navigation partition keeps child folders and sibling files separate", () => {
	const entries = [
		entry("NUI/index.md"),
		entry("NUI.md"),
		entry("readme.md"),
		entry("NUI/NUIdocs/index.md"),
		entry("Habits/Walking/Walking.md"),
	];
	const result = partitionNavigationEntryPathsForHost(
		entries,
		"",
		isFolderIndexPath,
	);

	assert.deepEqual(
		result.folders.map((item) => item.file.path),
		["NUI/index.md"],
	);
	assert.deepEqual(
		result.files.map((item) => item.file.path),
		["NUI.md", "readme.md"],
	);
	assert.deepEqual(
		partitionNavigationEntryPathsForHost(entries, "/", isFolderIndexPath),
		result,
	);
	assert.deepEqual(
		partitionNavigationEntryPathsForHost(
			entries,
			null,
			isFolderIndexPath,
		),
		{ folders: [], files: [] },
	);
});
