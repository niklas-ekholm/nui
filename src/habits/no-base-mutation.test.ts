import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Architecture guard for the habit bundle.
 *
 * Habits are resolved from the folder tree: the Week x3 tracker lists sibling
 * folders (`listHabitRowsInHostFolder`) and both trackers query
 * `file.inFolder(this.file.folder)`. There is no tag registry.
 *
 * A previous version registered each habit as a tag inside the week tracker's
 * `.base` file. Against the current folder-scoped `Tracker.base` that code
 * injected a `filters.or` branch beside the existing `filters.and` — one entry
 * per rename — plus a meaningless `tags:` key on the view, widening every embed
 * of that base beyond its folder. These tests fail if it comes back.
 */

const habitsDir = dirname(fileURLToPath(import.meta.url));

function habitSources(): { name: string; text: string }[] {
	return readdirSync(habitsDir)
		.filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
		.map((name) => ({ name, text: readFileSync(join(habitsDir, name), "utf8") }));
}

test("habit sources never round-trip YAML, the only way to rewrite a .base", () => {
	for (const { name, text } of habitSources()) {
		for (const fn of ["parseYaml", "stringifyYaml"]) {
			assert.equal(
				text.includes(fn),
				false,
				`${name} uses ${fn}; rewriting a base's YAML is how habit names leaked into Tracker.base`,
			);
		}
	}
});

test("habit sources never build a tag filter expression", () => {
	for (const { name, text } of habitSources()) {
		for (const expr of ["file.tags.contains", "file.hasTag"]) {
			assert.equal(
				text.includes(expr),
				false,
				`${name} builds the tag filter expression ${expr}; habits are folder-scoped`,
			);
		}
		assert.equal(
			/\bfilters\s*[.?]/.test(text),
			false,
			`${name} reaches into a base's filters; habits are folder-scoped`,
		);
	}
});

test("habit sources never author base content", () => {
	// The YAML guard above misses a base written by string concatenation, which is
	// how a since-removed helper emitted a per-habit year base with a tag filter.
	for (const { name, text } of habitSources()) {
		for (const marker of ['"views:"', "views:\\n", "nui-year-tracker", "nui-week-tracker-3"]) {
			assert.equal(
				text.includes(marker),
				false,
				`${name} looks like it authors base content (${marker}); bases are hand-written`,
			);
		}
	}
});

test("the retired weekly-habits-base module has not returned", () => {
	const names = readdirSync(habitsDir);
	assert.equal(
		names.includes("weekly-habits-base.ts"),
		false,
		"weekly-habits-base.ts wrote habit names into Tracker.base and was removed",
	);
});
