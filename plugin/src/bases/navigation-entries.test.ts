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
		isDirectChildFolderIndexPath(entry("NUI/NUI.md"), "", isFolderIndexPath),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(entry("NUI/NUI.md"), "/", isFolderIndexPath),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("NUI/NUIdocs/NUIdocs.md"),
			"NUI",
			isFolderIndexPath,
		),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("NUI/NUIdocs/Design/Design.md"),
			"NUI",
			isFolderIndexPath,
		),
		false,
	);
	assert.equal(
		isDirectChildFolderIndexPath(entry("NUI/index.md"), "", isFolderIndexPath),
		false,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("Habits/Walking/Walking.md"),
			"Habits",
			isFolderIndexPath,
		),
		true,
	);
	assert.equal(
		isDirectChildFolderIndexPath(
			entry("Habits/Walking/notes.md"),
			"Habits/Walking",
			isFolderIndexPath,
		),
		false,
	);
});

test("folder entries display their parent folder name", () => {
	assert.equal(folderNameForEntry(entry("NUI/NUI.md")), "NUI");
	assert.equal(folderNameForEntry(entry("NUI/NUIdocs/NUIdocs.md")), "NUIdocs");
});

test("navigation partition keeps child folders and sibling files separate", () => {
	const entries = [
		entry("NUI/NUI.md"),
		entry("NUI.md"),
		entry("readme.md"),
		entry("NUI/NUIdocs/NUIdocs.md"),
		entry("Habits/Walking/Walking.md"),
	];
	const result = partitionNavigationEntryPathsForHost(
		entries,
		"",
		isFolderIndexPath,
	);

	assert.deepEqual(
		result.folders.map((item) => item.file.path),
		["NUI/NUI.md"],
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

test("an ordinary index.md sibling is not a folder entry", () => {
	// A file named index.md next to a hub note is just another sibling —
	// never itself the folder's click target.
	const entries = [entry("NUI/NUI.md"), entry("NUI/index.md")];
	const result = partitionNavigationEntryPathsForHost(
		entries,
		"",
		isFolderIndexPath,
	);
	assert.deepEqual(
		result.folders.map((item) => item.file.path),
		["NUI/NUI.md"],
	);
});

test("nested folder hub notes surface once their own folder is the host", () => {
	const entries = [entry("Habits/Walking/Walking.md")];
	const result = partitionNavigationEntryPathsForHost(
		entries,
		"Habits",
		isFolderIndexPath,
	);
	assert.deepEqual(
		result.folders.map((item) => item.file.path),
		["Habits/Walking/Walking.md"],
	);
});
