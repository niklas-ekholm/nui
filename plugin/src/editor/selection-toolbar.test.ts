import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EditorState } from "@codemirror/state";
import {
	headingLevelAt,
	nextHeadingLevel,
} from "./selection-toolbar-heading.ts";
import { toolbarAnchorPos } from "./selection-toolbar-anchor.ts";

describe("selection toolbar heading cycle", () => {
	it("reads heading level from the line", () => {
		const state = EditorState.create({
			doc: "intro\n## Title\nbody",
		});
		assert.equal(headingLevelAt(state, 0), 0);
		assert.equal(headingLevelAt(state, state.doc.line(2).from), 2);
		assert.equal(headingLevelAt(state, state.doc.line(3).from), 0);
	});

	it("cycles paragraph through H6 then back", () => {
		assert.equal(nextHeadingLevel(0), 1);
		assert.equal(nextHeadingLevel(6), 0);
		assert.equal(nextHeadingLevel(3), 4);
	});
});

describe("selection toolbar anchor", () => {
	it("includes bold markers", () => {
		const doc = "**hello**";
		const state = EditorState.create({ doc });
		const from = doc.indexOf("hello");
		const to = from + "hello".length;
		assert.equal(toolbarAnchorPos(state, from, to), 0);
	});

	it("includes heading prefix", () => {
		const doc = "# hello";
		const state = EditorState.create({ doc });
		const from = doc.indexOf("hello");
		const to = from + "hello".length;
		assert.equal(toolbarAnchorPos(state, from, to), 0);
	});

	it("includes blockquote prefix", () => {
		const doc = "> hello";
		const state = EditorState.create({ doc });
		const from = doc.indexOf("hello");
		const to = from + "hello".length;
		assert.equal(toolbarAnchorPos(state, from, to), 0);
	});

	it("includes list marker", () => {
		const doc = "- hello";
		const state = EditorState.create({ doc });
		const from = doc.indexOf("hello");
		const to = from + "hello".length;
		assert.equal(toolbarAnchorPos(state, from, to), doc.indexOf("-"));
	});

	it("leaves plain selection unchanged", () => {
		const doc = "plain text";
		const state = EditorState.create({ doc });
		const from = doc.indexOf("plain");
		const to = from + "plain".length;
		assert.equal(toolbarAnchorPos(state, from, to), from);
	});
});
