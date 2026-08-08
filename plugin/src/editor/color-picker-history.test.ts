import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	mergeRecentColors,
	pushRecentColor,
	RECENT_COLOR_LIMIT,
} from "./color-picker-history.ts";

describe("mergeRecentColors", () => {
	it("normalizes and dedupes stored colors", () => {
		assert.deepEqual(
			mergeRecentColors(["#AABBCC", "aabbcc", "112233", "nope", 42]),
			["#aabbcc", "#112233"],
		);
	});

	it("caps at the recent color limit", () => {
		const input = Array.from({ length: 12 }, (_, i) =>
			`#${(i + 1).toString(16).padStart(6, "0")}`,
		);
		assert.equal(mergeRecentColors(input).length, RECENT_COLOR_LIMIT);
	});
});

describe("pushRecentColor", () => {
	it("moves the latest color to the front", () => {
		assert.deepEqual(
			pushRecentColor(["#111111", "#222222"], "#333333"),
			["#333333", "#111111", "#222222"],
		);
	});

	it("promotes an existing color without duplicating it", () => {
		assert.deepEqual(
			pushRecentColor(["#111111", "#222222", "#333333"], "#222222"),
			["#222222", "#111111", "#333333"],
		);
	});
});
