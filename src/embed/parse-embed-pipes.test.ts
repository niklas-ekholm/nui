import assert from "node:assert/strict";
import test from "node:test";
import {
	parseEmbedLinkText,
	parseEmbedPipeTokens,
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
	assert.deepEqual(parseEmbedLinkText("![[photo.png|wide]]"), {
		rawTokens: ["wide"],
		wide: true,
	});
});

test("shouldEmbedBeWide defaults timeline embeds to wide", () => {
	assert.equal(shouldEmbedBeWide({ rawTokens: [] }, true), true);
	assert.equal(shouldEmbedBeWide({ rawTokens: ["narrow"], narrow: true }, true), false);
	assert.equal(shouldEmbedBeWide({ rawTokens: ["wide"], wide: true }, false), true);
	assert.equal(shouldEmbedBeWide({ rawTokens: [] }, false), false);
});
