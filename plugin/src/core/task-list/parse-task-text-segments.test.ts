import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskTextSegments } from "./parse-task-text-segments.ts";

test("parseTaskTextSegments returns plain text when there are no wikilinks", () => {
	assert.deepEqual(parseTaskTextSegments("Pull the first run"), [
		{ type: "text", content: "Pull the first run" },
	]);
});

test("parseTaskTextSegments parses a single wikilink", () => {
	assert.deepEqual(parseTaskTextSegments("Review [[Meridian]] wiring"), [
		{ type: "text", content: "Review " },
		{
			type: "wikilink",
			content: "Meridian",
			target: "Meridian",
			alias: undefined,
		},
		{ type: "text", content: " wiring" },
	]);
});

test("parseTaskTextSegments parses alias syntax and heading links", () => {
	assert.deepEqual(parseTaskTextSegments("See [[Lantern|the lamp]] and [[Meridian#wiring]]"), [
		{ type: "text", content: "See " },
		{
			type: "wikilink",
			content: "the lamp",
			target: "Lantern",
			alias: "the lamp",
		},
		{ type: "text", content: " and " },
		{
			type: "wikilink",
			content: "Meridian#wiring",
			target: "Meridian#wiring",
			alias: undefined,
		},
	]);
});
