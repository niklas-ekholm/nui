import assert from "node:assert/strict";
import test from "node:test";
import {
	canonicalCalloutType,
	isCalloutContinuationLine,
	isQuoteLine,
	parseCalloutType,
	replaceCalloutTypeInLine,
} from "./callout-lp-parse.ts";

test("parseCalloutType reads callout type from header line", () => {
	assert.equal(parseCalloutType("> [!warning] Title"), "warning");
	assert.equal(parseCalloutType("> [!NOTE|no-icon] "), "note");
});

test("parseCalloutType returns null for plain quotes", () => {
	assert.equal(parseCalloutType("> plain quote"), null);
});

test("isCalloutContinuationLine detects body lines inside callouts", () => {
	assert.equal(isCalloutContinuationLine("> more text"), true);
	assert.equal(isCalloutContinuationLine("> [!warning] Title"), false);
	assert.equal(isCalloutContinuationLine("plain line"), false);
});

test("replaceCalloutTypeInLine swaps type and keeps metadata", () => {
	assert.equal(
		replaceCalloutTypeInLine("> [!warning] Title", "info"),
		"> [!info] Title",
	);
	assert.equal(
		replaceCalloutTypeInLine("> [!NOTE|no-icon] Title", "tip"),
		"> [!tip|no-icon] Title",
	);
	assert.equal(replaceCalloutTypeInLine("> plain quote", "info"), null);
});

test("canonicalCalloutType maps aliases to picker options", () => {
	assert.equal(canonicalCalloutType("caution"), "warning");
	assert.equal(canonicalCalloutType("NOTE"), "note");
});

test("isQuoteLine detects blockquote source lines", () => {
	assert.equal(isQuoteLine("> quoted"), true);
	assert.equal(isQuoteLine("> [!note] x"), true);
	assert.equal(isQuoteLine("plain"), false);
});
