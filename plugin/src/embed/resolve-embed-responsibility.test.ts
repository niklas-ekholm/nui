import assert from "node:assert/strict";
import test from "node:test";
import { parseResponsibilityForBaseEmbed } from "./parse-responsibility-embed.ts";

test("parseResponsibilityForBaseEmbed reads pipe tokens from host note source", () => {
	const source = [
		"![[Tasks.base|Niklas]]",
		"![[Timeline.base|Niklas]]",
	].join("\n");

	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Tasks.base", (link) =>
			link === "Tasks.base" ? "Bases/Tasks.base" : null,
		),
		"Niklas",
	);
	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Timeline.base", (link) =>
			link === "Timeline.base" ? "Bases/Timeline.base" : null,
		),
		"Niklas",
	);
	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Tasks.base", () => null),
		null,
	);
});
