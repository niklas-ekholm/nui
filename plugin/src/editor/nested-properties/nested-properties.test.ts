import { test } from "node:test";
import assert from "node:assert/strict";
import {
	getNestedValue,
	isComplexValue,
} from "./nested-value.ts";

test("isComplexValue", () => {
	assert.equal(isComplexValue({ a: 1 }), true);
	assert.equal(isComplexValue([1]), true);
	assert.equal(isComplexValue("x"), false);
	assert.equal(isComplexValue(null), false);
});

test("getNestedValue", () => {
	const root = {
		generated: { by: "human:test", at: "2026-08-01T00:00:00Z" },
		sources: [{ id: "raw" }],
	};
	assert.equal(getNestedValue(root, ["generated", "by"]), "human:test");
	assert.equal(getNestedValue(root, ["sources", "0", "id"]), "raw");
});
