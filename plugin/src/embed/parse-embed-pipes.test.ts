import assert from "node:assert/strict";
import test from "node:test";
import {
	parseEmbedLinkText,
	parseEmbedPipeTokens,
	parseResponsibilityForBaseEmbed,
} from "./parse-embed-pipes.ts";
import { shouldEmbedBeWide } from "./apply-embed-pipes.ts";

test("parseEmbedPipeTokens handles wide and compact", () => {
	assert.deepEqual(parseEmbedPipeTokens(["wide"]), {
		rawTokens: ["wide"],
		wide: true,
	});
	assert.deepEqual(parseEmbedPipeTokens(["narrow"]), {
		rawTokens: ["narrow"],
		narrow: true,
	});
	assert.deepEqual(parseEmbedPipeTokens(["wide", "compact"]), {
		rawTokens: ["wide", "compact"],
		wide: true,
		timelineCompact: true,
		timelineLayout: "compact",
	});
	assert.deepEqual(parseEmbedPipeTokens(["compact", "wide"]), {
		rawTokens: ["compact", "wide"],
		wide: true,
		timelineCompact: true,
		timelineLayout: "compact",
	});
	assert.deepEqual(parseEmbedPipeTokens(["400"]), {
		rawTokens: ["400"],
		widthPx: 400,
	});
});

test("parseEmbedPipeTokens handles timeline layout tokens", () => {
	assert.deepEqual(parseEmbedPipeTokens(["full-tasks"]), {
		rawTokens: ["full-tasks"],
		timelineLayout: "full-tasks",
	});
});

test("parseEmbedPipeTokens treats unknown tokens as responsibility filters", () => {
	assert.deepEqual(parseEmbedPipeTokens(["Dean"]), {
		rawTokens: ["Dean"],
		responsibility: "Dean",
	});
	assert.deepEqual(parseEmbedPipeTokens(["Dean", "compact"]), {
		rawTokens: ["Dean", "compact"],
		responsibility: "Dean",
		timelineCompact: true,
		timelineLayout: "compact",
	});
	assert.deepEqual(parseEmbedPipeTokens(["full-tasks", "Dean"]), {
		rawTokens: ["full-tasks", "Dean"],
		timelineLayout: "full-tasks",
		responsibility: "Dean",
	});
});

test("parseEmbedPipeTokens handles legacy image dimensions", () => {
	assert.deepEqual(parseEmbedPipeTokens(["640x480"]), {
		rawTokens: ["640x480"],
		imageWidthPx: 640,
		imageHeightPx: 480,
	});
});

test("parseEmbedLinkText parses embed originals", () => {
	assert.deepEqual(parseEmbedLinkText("![[Timeline.base|wide]]"), {
		rawTokens: ["wide"],
		wide: true,
	});
	assert.deepEqual(parseEmbedLinkText("![[Timeline.base|wide|compact]]"), {
		rawTokens: ["wide", "compact"],
		wide: true,
		timelineCompact: true,
		timelineLayout: "compact",
	});
	assert.deepEqual(parseEmbedLinkText("![[Timeline.base|compact|wide]]"), {
		rawTokens: ["compact", "wide"],
		wide: true,
		timelineCompact: true,
		timelineLayout: "compact",
	});
	assert.deepEqual(parseEmbedLinkText("![[Timeline.base|Dean]]"), {
		rawTokens: ["Dean"],
		responsibility: "Dean",
	});
	assert.deepEqual(parseEmbedLinkText("![[Timeline.base|full-tasks|Dean]]"), {
		rawTokens: ["full-tasks", "Dean"],
		timelineLayout: "full-tasks",
		responsibility: "Dean",
	});
	assert.deepEqual(parseEmbedLinkText("![[photo.png|wide]]"), {
		rawTokens: ["wide"],
		wide: true,
	});
});

test("parseResponsibilityForBaseEmbed ignores wikilink syntax in prose", () => {
	const source = [
		"Add `responsibility` to filter — `![[Timeline.base|Dean]]`.",
		"![[Timeline.base]]",
	].join("\n");

	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Timeline.base", (link) =>
			link === "Timeline.base" ? "Bases/Timeline.base" : null,
		),
		null,
	);
});

test("parseResponsibilityForBaseEmbed returns null when embed has no pipe", () => {
	const source = ["![[Timeline.base]]", "![[Tasks.base]]"].join("\n");

	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Timeline.base", (link) =>
			link === "Timeline.base" ? "Bases/Timeline.base" : null,
		),
		null,
	);
});

test("parseResponsibilityForBaseEmbed reads pipe tokens from host note source", () => {
	const source = [
		"![[Tasks.base|Dean]]",
		"![[Timeline.base|Dean]]",
	].join("\n");

	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Tasks.base", (link) =>
			link === "Tasks.base" ? "Bases/Tasks.base" : null,
		),
		"Dean",
	);
	assert.equal(
		parseResponsibilityForBaseEmbed(source, "Bases/Timeline.base", (link) =>
			link === "Timeline.base" ? "Bases/Timeline.base" : null,
		),
		"Dean",
	);
});

test("shouldEmbedBeWide defaults timeline embeds to wide", () => {
	assert.equal(shouldEmbedBeWide({ rawTokens: [] }, true), true);
	assert.equal(shouldEmbedBeWide({ rawTokens: ["narrow"], narrow: true }, true), false);
	assert.equal(shouldEmbedBeWide({ rawTokens: ["wide"], wide: true }, false), true);
	assert.equal(shouldEmbedBeWide({ rawTokens: [] }, false), false);
});
