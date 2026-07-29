#!/usr/bin/env node
/**
 * Sanity checks for the example vault. Run from the repository root:
 *
 *   node scripts/check-vault.mjs
 *
 * The vault is the shipped artifact and the first thing anyone sees, so three
 * things have to hold:
 *
 *   1. Every view type a `.base` file asks for is one the plugin registers,
 *      and every view type the plugin registers is demonstrated somewhere.
 *      A base naming a view that no longer exists renders an error card.
 *   2. Every property a view is pointed at exists on at least one note. A
 *      correct view over a property nothing carries renders as empty, which
 *      looks like a broken plugin rather than an empty query.
 *   3. No absolute paths anywhere. The vault moves to whatever directory
 *      someone unzips it into.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VAULT = join(ROOT, "vault-example");
const PLUGIN_SRC = join(ROOT, "plugin", "src");
const MAIN_TS = join(PLUGIN_SRC, "main.ts");

const SKIP_DIRS = new Set(["node_modules", ".git", ".obsidian"]);

function walk(dir, keep) {
	const out = [];
	for (const name of readdirSync(dir)) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...walk(full, keep));
		else if (keep(full)) out.push(full);
	}
	return out;
}

const problems = [];
const fail = (message) => problems.push(message);

/* ---------------------------------------------------------------- view types */

/**
 * The registered set is whatever `main.ts` passes to `registerBasesView`,
 * resolved through the constants those names are declared with. Reading the
 * call sites rather than a hardcoded list means this check follows the plugin.
 */
function registeredViewTypes() {
	const main = readFileSync(MAIN_TS, "utf8");
	const names = [...main.matchAll(/registerBasesView\(\s*([A-Z0-9_]+)\s*,/g)].map(
		(m) => m[1],
	);
	if (names.length === 0) {
		fail("check-vault: found no registerBasesView calls in plugin/src/main.ts");
		return new Map();
	}

	const constants = new Map();
	for (const file of walk(PLUGIN_SRC, (f) => f.endsWith(".ts"))) {
		const text = readFileSync(file, "utf8");
		for (const m of text.matchAll(
			/export const ([A-Z0-9_]+_BASES_VIEW_TYPE)\s*=\s*"([^"]+)"/g,
		)) {
			constants.set(m[1], m[2]);
		}
	}

	const types = new Map();
	for (const name of names) {
		const value = constants.get(name);
		if (!value) {
			fail(`check-vault: ${name} is registered but its value was not found`);
			continue;
		}
		types.set(value, name);
	}
	return types;
}

/* --------------------------------------------------------------- base parsing */

/** `type:` and the property-valued options, without pulling in a YAML parser. */
function parseBase(text) {
	const types = [];
	const properties = [];
	for (const line of text.split("\n")) {
		const type = line.match(/^\s*-?\s*type:\s*(\S+)\s*$/);
		if (type) {
			types.push(type[1]);
			continue;
		}
		const option = line.match(
			/^\s*(dateField|startField|endField|projectField|titleField|image):\s*(\S+)\s*$/,
		);
		if (option) properties.push({ key: option[1], value: option[2] });
	}
	return { types, properties };
}

/* ------------------------------------------------------------------ the notes */

/** Frontmatter keys per note, and the raw text for the absolute-path scan. */
function readNotes() {
	const notes = [];
	for (const file of walk(VAULT, (f) => extname(f) === ".md")) {
		const text = readFileSync(file, "utf8");
		const keys = new Set();
		const fm = text.match(/^---\n([\s\S]*?)\n---/);
		if (fm) {
			for (const line of fm[1].split("\n")) {
				const key = line.match(/^([A-Za-z_][\w -]*):/);
				if (key) keys.add(key[1]);
			}
		}
		notes.push({ file, text, keys });
	}
	return notes;
}

/* -------------------------------------------------------------------- running */

const registered = registeredViewTypes();
const bases = walk(VAULT, (f) => extname(f) === ".base");
const notes = readNotes();

if (bases.length === 0) fail("check-vault: the vault contains no .base files");
if (notes.length === 0) fail("check-vault: the vault contains no notes");

const seen = new Set();

for (const base of bases) {
	const where = relative(ROOT, base);
	const { types, properties } = parseBase(readFileSync(base, "utf8"));

	if (types.length === 0) fail(`${where}: declares no views`);

	for (const type of types) {
		if (!registered.has(type)) {
			fail(`${where}: view type "${type}" is not registered by the plugin`);
			continue;
		}
		seen.add(type);
	}

	for (const { key, value } of properties) {
		// `file.*` reads a file attribute rather than frontmatter.
		if (!value.startsWith("note.")) continue;
		const property = value.slice("note.".length);
		const carriers = notes.filter((note) => note.keys.has(property)).length;
		if (carriers === 0) {
			fail(
				`${where}: ${key} points at "${value}" but no note carries a "${property}" property`,
			);
		}
	}
}

for (const [type] of registered) {
	if (!seen.has(type)) {
		fail(
			`no .base file in the vault uses "${type}" — every registered view needs live data to demonstrate it`,
		);
	}
}

const ABSOLUTE = [/\/Users\//, /\/home\/[a-z]/, /[A-Z]:\\\\/];
for (const note of notes) {
	note.text.split("\n").forEach((line, i) => {
		for (const pattern of ABSOLUTE) {
			if (pattern.test(line)) {
				fail(`${relative(ROOT, note.file)}:${i + 1}: absolute path\n    ${line.trim()}`);
			}
		}
	});
}

/* -------------------------------------------------------------------- verdict */

if (problems.length > 0) {
	console.error(`Example vault checks failed (${problems.length}):\n`);
	for (const problem of problems) console.error(`  ${problem}`);
	console.error("");
	process.exit(1);
}

console.log(
	`Example vault: ${notes.length} notes, ${bases.length} bases, ` +
		`all ${registered.size} registered views demonstrated.`,
);
