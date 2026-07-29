import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskTextSegments } from "./parse-task-text-segments.ts";

test("parseTaskTextSegments returns plain text when there are no wikilinks", () => {
	assert.deepEqual(parseTaskTextSegments("Pull the first run"), [
		{ type: "text", content: "Pull the first run" },
	]);
});

test("parseTaskTextSegments parses a single wikilink", () => {
	assert.deepEqual(parseTaskTextSegments("Review [[The Colt]] wiring"), [
		{ type: "text", content: "Review " },
		{
			type: "wikilink",
			content: "The Colt",
			target: "The Colt",
			alias: undefined,
		},
		{ type: "text", content: " wiring" },
	]);
});

test("parseTaskTextSegments parses alias syntax and heading links", () => {
	assert.deepEqual(parseTaskTextSegments("See [[The Colt|the gun]] and [[Stopping the Apocalypse#seals]]"), [
		{ type: "text", content: "See " },
		{
			type: "wikilink",
			content: "the gun",
			target: "The Colt",
			alias: "the gun",
		},
		{ type: "text", content: " and " },
		{
			type: "wikilink",
			content: "Stopping the Apocalypse#seals",
			target: "Stopping the Apocalypse#seals",
			alias: undefined,
		},
	]);
});
