#!/usr/bin/env node
/**
 * Guards against the author's private vault conventions leaking back into the
 * published source. Test files are exempt: they use vault-shaped paths as
 * fixtures, and those strings never reach a user's vault.
 */
import { readFileSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readdirSync, statSync } from "fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

/** Tokens that only ever appear in the author's private vault. */
const FORBIDDEN = ["𓂀", "┼", "HTS", "NUIdocs", "N-docs", "NipaNotes"];

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) {
			out.push(...walk(full));
		} else if (name.endsWith(".ts")) {
			out.push(full);
		}
	}
	return out;
}

const failures = [];

for (const file of walk(SRC)) {
	if (file.endsWith(".test.ts")) continue;
	const lines = readFileSync(file, "utf8").split("\n");
	lines.forEach((line, i) => {
		for (const token of FORBIDDEN) {
			if (line.includes(token)) {
				failures.push(
					`${relative(ROOT, file)}:${i + 1}  contains "${token}"\n    ${line.trim()}`,
				);
			}
		}
	});
}

if (failures.length > 0) {
	console.error(
		`Personal vault paths found in src/ (${failures.length}):\n\n${failures.join("\n")}\n`,
	);
	process.exit(1);
}

console.log(
	`No personal vault paths in src/ (checked ${FORBIDDEN.length} tokens).`,
);
