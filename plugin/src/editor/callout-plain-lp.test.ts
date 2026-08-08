import assert from "node:assert/strict";
import test from "node:test";
import { isCalloutBlockWidget } from "./callout-plain-lp.ts";

test("isCalloutBlockWidget detects Obsidian callout widgets", () => {
	const calloutWidget = {
		constructor: {
			prototype: {
				getType() {},
				getTypePos() {},
				updateType() {},
			},
		},
	};
	assert.equal(isCalloutBlockWidget(calloutWidget as never), true);
});

test("isCalloutBlockWidget ignores unrelated widgets", () => {
	const otherWidget = {
		constructor: {
			prototype: {
				toDOM() {},
			},
		},
	};
	assert.equal(isCalloutBlockWidget(otherWidget as never), false);
});
