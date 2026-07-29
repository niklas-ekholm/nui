#!/usr/bin/env node
/**
 * Copy the built plugin into the example vault.
 *
 * `npm run dev` writes straight into the vault, but a production build writes
 * only next to the source — so after any `npm run build` the vault silently
 * keeps running the previous bundle. That is invisible until something
 * registered at load time, like a default hotkey, appears not to work.
 *
 * Skips quietly when the vault is not there, so a checkout without it (or a CI
 * job that only wants the artifact) is unaffected.
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), "..");
const VAULT_PLUGIN_DIR = join(
	PLUGIN,
	"..",
	"vault-example",
	".obsidian",
	"plugins",
	"nui",
);
const FILES = ["main.js", "manifest.json", "styles.css"];

if (!existsSync(join(PLUGIN, "..", "vault-example"))) {
	console.log("sync-vault: no vault-example/ beside plugin/, nothing to do.");
	process.exit(0);
}

const missing = FILES.filter((file) => !existsSync(join(PLUGIN, file)));
if (missing.length > 0) {
	console.error(
		`sync-vault: ${missing.join(", ")} not built yet — run the build first.`,
	);
	process.exit(1);
}

mkdirSync(VAULT_PLUGIN_DIR, { recursive: true });
for (const file of FILES) {
	copyFileSync(join(PLUGIN, file), join(VAULT_PLUGIN_DIR, file));
}

console.log(
	`sync-vault: copied ${FILES.join(", ")} into vault-example/.obsidian/plugins/nui/.\n` +
		"Reload Obsidian (Cmd+P → “Reload app without saving”) to pick it up.",
);
