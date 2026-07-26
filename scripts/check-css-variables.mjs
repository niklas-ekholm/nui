#!/usr/bin/env node
/**
 * The NUI theme is optional, so no rule in styles.css may depend on a variable
 * only the theme defines. Every `--nui-*` / `--n-*` variable must either be
 * defined in styles.css, set at runtime by the plugin, or carry an inline
 * fallback at every use.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "styles.css"), "utf8");

/** Variables styles.css declares itself. */
const declared = new Set(
	[...CSS.matchAll(/^\s*(--(?:nui|n)-[A-Za-z0-9-]+)\s*:/gm)].map((m) => m[1]),
);

/** Variables the plugin sets at runtime via setProperty(). */
function runtimeSetVariables() {
	const found = new Set();
	const walk = (dir) => {
		for (const name of readdirSync(dir)) {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) walk(full);
			else if (name.endsWith(".ts")) {
				const text = readFileSync(full, "utf8");
				for (const m of text.matchAll(
					/setProperty\(\s*["'`](--(?:nui|n)-[A-Za-z0-9-]+)/g,
				)) {
					found.add(m[1]);
				}
			}
		}
	};
	walk(join(ROOT, "src"));
	return found;
}

const runtime = runtimeSetVariables();

/** Every use of a nui/n variable, with whether it supplies a fallback. */
const unresolved = new Map();
for (const m of CSS.matchAll(/var\(\s*(--(?:nui|n)-[A-Za-z0-9-]+)\s*(,?)/g)) {
	const [, name, comma] = m;
	if (comma) continue;
	if (declared.has(name) || runtime.has(name)) continue;
	const line = CSS.slice(0, m.index).split("\n").length;
	if (!unresolved.has(name)) unresolved.set(name, []);
	unresolved.get(name).push(line);
}

if (unresolved.size > 0) {
	console.error(
		`styles.css uses ${unresolved.size} variable(s) that nothing defines and that have no fallback.\n` +
			`With the NUI theme uninstalled these resolve to nothing:\n`,
	);
	for (const [name, lines] of unresolved) {
		console.error(`  ${name}  —  styles.css:${lines.join(", ")}`);
	}
	console.error(
		`\nUse an Obsidian native variable instead, or add an inline fallback.`,
	);
	process.exit(1);
}

console.log(
	`styles.css resolves standalone: ${declared.size} declared, ${runtime.size} set at runtime, no unresolved variables.`,
);
