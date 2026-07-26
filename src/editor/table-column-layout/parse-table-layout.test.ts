import assert from "node:assert/strict";
import test from "node:test";
import {
	compactSeparatorRow,
	formatSeparatorCell,
	isSeparatorRowLine,
	parseMarkdownTables,
	parseSeparatorCell,
	splitPipeTableRow,
	tableSignature,
} from "./parse-table-layout.ts";

test("parseSeparatorCell single dash is shrink", () => {
	assert.deepEqual(parseSeparatorCell("-"), {
		mode: "shrink",
		weight: 0,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell(":-:"), {
		mode: "shrink",
		weight: 0,
		align: "center",
	});
	assert.deepEqual(parseSeparatorCell(":-"), {
		mode: "shrink",
		weight: 0,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell("-:"), {
		mode: "shrink",
		weight: 0,
		align: "right",
	});
});

test("parseSeparatorCell fill alignments and weights", () => {
	assert.deepEqual(parseSeparatorCell("--"), {
		mode: "fill",
		weight: 2,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell("---"), {
		mode: "fill",
		weight: 3,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell(":---"), {
		mode: "fill",
		weight: 3,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell(":---:"), {
		mode: "fill",
		weight: 3,
		align: "center",
	});
	assert.deepEqual(parseSeparatorCell("---:"), {
		mode: "fill",
		weight: 3,
		align: "right",
	});
	assert.deepEqual(parseSeparatorCell(":--"), {
		mode: "fill",
		weight: 2,
		align: "left",
	});
});

test("parseSeparatorCell caret shrink alias", () => {
	assert.deepEqual(parseSeparatorCell("^"), {
		mode: "shrink",
		weight: 0,
		align: "left",
	});
	assert.deepEqual(parseSeparatorCell(":^:"), {
		mode: "shrink",
		weight: 0,
		align: "center",
	});
});

test("parseMarkdownTables shrubbery table separator", () => {
	const md = [
		"| A | B | C | D | E | F |",
		"| - | -- | -- | ---: | --- | --- |",
		"| L | body | body | body | body | |",
	].join("\n");

	const tables = parseMarkdownTables(md);
	assert.equal(tables.length, 1);
	assert.deepEqual(tables[0]?.columns, [
		{ mode: "shrink", weight: 0, align: "left" },
		{ mode: "fill", weight: 2, align: "left" },
		{ mode: "fill", weight: 2, align: "left" },
		{ mode: "fill", weight: 3, align: "right" },
		{ mode: "fill", weight: 3, align: "left" },
		{ mode: "fill", weight: 3, align: "left" },
	]);
});

test("parseMarkdownTables mixed shrink and fill ratios", () => {
	const md = [
		"| # | Date | Notes |",
		"| :-: | :--: | :---- |",
		"| 1 | Mon | Long text |",
	].join("\n");

	const tables = parseMarkdownTables(md);
	assert.equal(tables.length, 1);
	assert.deepEqual(tables[0]?.columns, [
		{ mode: "shrink", weight: 0, align: "center" },
		{ mode: "fill", weight: 2, align: "center" },
		{ mode: "fill", weight: 4, align: "left" },
	]);
});

test("splitPipeTableRow trims outer pipes", () => {
	assert.deepEqual(splitPipeTableRow("| a | b |"), ["a", "b"]);
});

test("compactSeparatorRow keeps minimal dash counts", () => {
	assert.equal(
		compactSeparatorRow("| - | -- | -- | ---: | --- | --- |"),
		"| - | -- | -- | ---: | --- | --- |",
	);
	assert.equal(
		compactSeparatorRow("| --- | ----- | -------: |"),
		"| --- | ----- | -------: |",
	);
});

test("formatSeparatorCell preserves caret shrink alias", () => {
	const spec = parseSeparatorCell("^");
	assert.equal(formatSeparatorCell(spec, "^"), "^");
	assert.equal(formatSeparatorCell(spec, "-"), "-");
});

test("isSeparatorRowLine detects separator rows", () => {
	assert.equal(isSeparatorRowLine("| - | -- |"), true);
	assert.equal(isSeparatorRowLine("| data | here |"), false);
});

test("tableSignature ignores header cell padding", () => {
	const plain = tableSignature(["A", "B", "C"]);
	const padded = tableSignature(["A   ", " B ", "C"]);
	assert.equal(plain, padded);
});
