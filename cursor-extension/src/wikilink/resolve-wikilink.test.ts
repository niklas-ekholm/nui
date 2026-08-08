import assert from "node:assert/strict";
import test from "node:test";
import * as path from "path";
import {
	buildNoteIndexSnapshot,
	resolveWikilinkHref,
	resolveWikilinkTarget,
	toPreviewHref,
	toRelativeHref,
} from "./resolve-wikilink.ts";

const root = path.join("/vault");
const entries = [
	{
		uriFsPath: path.join(root, "Start here.md"),
		workspaceRoot: root,
	},
	{
		uriFsPath: path.join(root, "Projects/Projects.md"),
		workspaceRoot: root,
	},
	{
		uriFsPath: path.join(
			root,
			"Projects/Bunker library/Bunker library.md",
		),
		workspaceRoot: root,
	},
	{
		uriFsPath: path.join(root, "docs/3-implementations/cursor/index.md"),
		workspaceRoot: root,
	},
	{
		uriFsPath: path.join(root, "docs/3-implementations/cursor/install.md"),
		workspaceRoot: root,
	},
];

const index = buildNoteIndexSnapshot(entries);

test("resolveWikilinkTarget finds note by basename", () => {
	const note = resolveWikilinkTarget(
		"Projects",
		index,
		path.join(root, "Start here.md"),
	);
	assert.equal(note?.relativePath, "Projects/Projects");
});

test("resolveWikilinkTarget finds folder note by folder name", () => {
	const note = resolveWikilinkTarget(
		"Bunker library",
		index,
		path.join(root, "Start here.md"),
	);
	assert.equal(
		note?.relativePath,
		"Projects/Bunker library/Bunker library",
	);
});

test("resolveWikilinkTarget resolves docs paths without docs/ prefix", () => {
	const note = resolveWikilinkTarget(
		"3-implementations/cursor/install",
		index,
		path.join(root, "docs/3-implementations/cursor/index.md"),
	);
	assert.equal(note?.relativePath, "docs/3-implementations/cursor/install");
});

test("resolveWikilinkHref uses relative preview href for resolved targets", () => {
	const source = path.join(root, "docs/3-implementations/cursor/index.md");
	const note = resolveWikilinkTarget(
		"3-implementations/cursor/install",
		index,
		source,
	)!;
	const { href, dataHref, resolved } = resolveWikilinkHref(
		"3-implementations/cursor/install",
		undefined,
		index,
		source,
	);
	assert.equal(resolved, true);
	assert.equal(href, toPreviewHref(note, source));
	assert.equal(dataHref, href);
	assert.equal(href, "./install.md");
});

test("resolveWikilinkHref includes heading fragment", () => {
	const source = path.join(root, "docs/3-implementations/cursor/install.md");
	const note = resolveWikilinkTarget(
		"3-implementations/cursor/index",
		index,
		source,
	)!;
	const { href, resolved } = resolveWikilinkHref(
		"3-implementations/cursor/index",
		"Purpose",
		index,
		source,
	);
	assert.equal(resolved, true);
	assert.equal(href, toPreviewHref(note, source, "Purpose"));
	assert.equal(href, "./index.md#purpose");
});

test("toRelativeHref prefixes same-folder links with ./", () => {
	assert.equal(
		toRelativeHref(
			path.join(root, "docs/a/index.md"),
			path.join(root, "docs/a/install.md"),
		),
		"./install.md",
	);
});

test("resolveWikilinkHref marks missing targets unresolved", () => {
	const { href, dataHref, resolved } = resolveWikilinkHref(
		"Missing note",
		undefined,
		index,
		path.join(root, "Start here.md"),
	);
	assert.equal(resolved, false);
	assert.equal(href, "./Missing note.md");
	assert.equal(dataHref, href);
});

test("resolveWikilinkHref uses workspace path for unresolved path targets", () => {
	const { href, resolved } = resolveWikilinkHref(
		"3-implementations/cursor/missing",
		undefined,
		index,
		path.join(root, "docs/3-implementations/cursor/index.md"),
	);
	assert.equal(resolved, false);
	assert.equal(href, "/docs/3-implementations/cursor/missing.md");
});
