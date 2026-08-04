import assert from "node:assert/strict";
import test from "node:test";
import { buildFolderIndexContent } from "./folder-index-seed.ts";

test("buildFolderIndexContent seeds Navigation.base with blank lines above and below", () => {
	const content = buildFolderIndexContent();
	const lines = content.split("\n");
	assert.equal(lines.length, 3);
	assert.equal(lines[0], "");
	assert.equal(lines[1], "![[Navigation.base]]");
	assert.equal(lines[2], "");
});
