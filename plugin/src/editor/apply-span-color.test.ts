import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripColorMarkup } from "./apply-span-color.ts";

describe("stripColorMarkup", () => {
	it("removes a single color span", () => {
		assert.equal(
			stripColorMarkup('<span style="color: #ff0000">hello</span>'),
			"hello",
		);
	});

	it("removes nested color spans", () => {
		assert.equal(
			stripColorMarkup(
				'<span style="color: #ff0000"><span style="color: #00ff00">hello</span> world</span>',
			),
			"hello world",
		);
	});

	it("cleans broken live preview fragments in the selection", () => {
		assert.equal(
			stripColorMarkup('hello</span> there<span style="color: #112233">'),
			"hello there",
		);
	});

	it("leaves plain text unchanged", () => {
		assert.equal(stripColorMarkup("plain text"), "plain text");
	});

	it("removes multiple adjacent color spans", () => {
		assert.equal(
			stripColorMarkup(
				'<span style="color: #111111">a</span><span style="color: #222222">b</span>',
			),
			"ab",
		);
	});
});
