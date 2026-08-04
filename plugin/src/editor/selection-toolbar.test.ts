import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EditorState } from "@codemirror/state";
import {
	headingLevelAt,
	nextHeadingLevel,
} from "./selection-toolbar-heading.ts";

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
