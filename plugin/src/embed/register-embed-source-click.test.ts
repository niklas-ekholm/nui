import assert from "node:assert/strict";
import test from "node:test";
import { isPointInEditorMargin } from "./embed-source-margin.ts";

const rects = {
	sizer: { left: 100, right: 800, top: 0, bottom: 1000 } as DOMRectReadOnly,
	content: { left: 132, right: 768, top: 200, bottom: 900 } as DOMRectReadOnly,
};

test("isPointInEditorMargin treats pane margin beside sizer as margin", () => {
	assert.equal(isPointInEditorMargin(50, 400, rects), true);
	assert.equal(isPointInEditorMargin(850, 400, rects), true);
});

test("isPointInEditorMargin treats lateral inset around cm-content as margin", () => {
	assert.equal(isPointInEditorMargin(110, 400, rects), true);
	assert.equal(isPointInEditorMargin(790, 400, rects), true);
});

test("isPointInEditorMargin treats vertical inset around cm-content as margin", () => {
	assert.equal(isPointInEditorMargin(400, 150, rects), true);
	assert.equal(isPointInEditorMargin(400, 950, rects), true);
});

test("isPointInEditorMargin treats cm-content interior as not margin", () => {
	assert.equal(isPointInEditorMargin(400, 400, rects), false);
});
