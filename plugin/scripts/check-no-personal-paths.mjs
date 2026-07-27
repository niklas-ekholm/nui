#!/usr/bin/env node
/**
 * Guards against the author's private vault conventions leaking into anything
 * published — the plugin source and the example vault alike. Test files are
 * exempt: they use vault-shaped paths as fixtures, and those strings never
 * reach a user's vault.
 *
 * With no arguments it checks `plugin/src` for `.ts` files, which is what
 * `npm run check` does from inside `plugin/`. Pass directories to check them
 * instead, across every text extension below:
 *
 *   node scripts/check-no-personal-paths.mjs ../vault ./src
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = join(SCRIPT_DIR, "..");
const CWD = process.cwd();

/** Tokens that only ever appear in the author's private vaults or machine. */
const FORBIDDEN = [
	"𓂀",
	"┼",
	"HTS",
	"NUIdocs",
	"N-docs",
	"NipaNotes",
	"NipaData",
	"PabeNotes",
	"OldNotes",
	"nui-testvault",
	"niklasekholm",
	"/Users/",
	"Kyrösjärvi",
];

/** Text files worth reading. Anything else is a binary or a lockfile. */
const TEXT_EXTENSIONS = new Set([
	".ts",
	".mjs",
	".js",
	".json",
	".base",
	".css",
	".md",
	".sh",
	".yml",
	".yaml",
	".py",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".obsidian-cache"]);

function walk(dir, accept) {
	const out = [];
	for (const name of readdirSync(dir)) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			out.push(...walk(full, accept));
		} else if (accept(name)) {
			out.push(full);
		}
	}
	return out;
}

const args = process.argv.slice(2);
const targets =
	args.length > 0
		? args.map((arg) => ({
				dir: resolve(CWD, arg),
				base: CWD,
				accept: (name) => TEXT_EXTENSIONS.has(extname(name)),
			}))
		: [
				{
					dir: join(PLUGIN_ROOT, "src"),
					base: PLUGIN_ROOT,
					accept: (name) => name.endsWith(".ts"),
				},
			];

const failures = [];
let checked = 0;

for (const target of targets) {
	for (const file of walk(target.dir, target.accept)) {
		if (file.endsWith(".test.ts")) continue;
		checked += 1;
		const lines = readFileSync(file, "utf8").split("\n");
		lines.forEach((line, i) => {
			for (const token of FORBIDDEN) {
				if (line.includes(token)) {
					failures.push(
						`${relative(target.base, file)}:${i + 1}  contains "${token}"\n    ${line.trim()}`,
					);
				}
			}
		});
	}
}

const scope = targets.map((t) => relative(CWD, t.dir) || ".").join(", ");

if (failures.length > 0) {
	console.error(
		`Personal vault paths found in ${scope} (${failures.length}):\n\n${failures.join("\n")}\n`,
	);
	process.exit(1);
}

console.log(
	`No personal vault paths in ${scope} — ${checked} files, ${FORBIDDEN.length} tokens.`,
);
