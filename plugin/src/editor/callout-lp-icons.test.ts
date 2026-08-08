import assert from "node:assert/strict";
import test from "node:test";
import { getObsidianCalloutIconId } from "./callout-lp-icon-ids.ts";

test("getObsidianCalloutIconId matches Obsidian callout icons", () => {
	assert.equal(getObsidianCalloutIconId("warning"), "alert-triangle");
	assert.equal(getObsidianCalloutIconId("note"), "pencil");
	assert.equal(getObsidianCalloutIconId("unknown"), "pencil");
});
