# NUI plugin — developer guide

Obsidian plugin (id `nui`) providing Bases views, folder-index navigation, and editor tools. Public repository; the 0.x line runs before a real 1.0.0.

**Product spec:** [docs/index.md](../docs/index.md) — canonical design language and Obsidian implementation notes. Behaviour docs, view registration, and the standing [doc drift audit](../docs/3-implementations/obsidian/dev/doc-drift-audit.md) live there; reconcile code changes against the spec before release.

## Build & reload loop

`src/` is the TypeScript source. Obsidian loads the bundled `main.js`. All tooling lives in this directory, and `node_modules` is safe here because the repository is outside iCloud.

- First setup: `npm install`
- Watch mode:   `npm run dev` — writes `main.js`, `manifest.json`, and `styles.css` into `../vault-example/.obsidian/plugins/nui/`, the example vault in this repository
- One-off build: `npm run build` — writes `main.js` next to the source, which is what the release workflow uploads
- MiniNUI build: `node esbuild.config.mjs production mini` — writes `main.mini.js`, the same source with the Bases views compiled out
- Everything CI runs: `npm run check`
- After a build, reload Obsidian (Cmd+P → "Reload app") or toggle the plugin off and on.

Override the watch target with `NUI_VAULT_PLUGIN_DIR`. esbuild bundles `src/main.ts` with `obsidian`, `@codemirror/*`, electron, and node builtins external. Do not edit `main.js` by hand.

`obsidian` and the two `@codemirror` packages it peers on are pinned exactly. Obsidian pins its CodeMirror peers to single versions, so a floating range breaks `npm install` whenever Obsidian publishes.

## Architecture (src/)

- `main.ts` — plugin entry: registers commands, Bases views, editor features, the folder-index and habit managers, and the settings tab.
- `navigation/folder-index.ts` — the folder-index manager. Clicking a folder opens/creates its `{FolderName}.md` hub note; renaming a folder renames its hub and vice versa, and creating a folder auto-creates its hub. Hub notes exist only to help humans read and navigate the vault — do not bolt on machine-oriented directory listings (OKF `index.md` sidecars) here; that belongs in a separate vault/plugin.
- `navigation/folder-index-path.ts` — pure shared path contract. `getFolderIndexPath` → `{FolderName}.md` (the vault root's hub is named after the vault instead, set once via `setVaultRootName`).
- `habits/` — habit bundles. A habit is a folder; completions are dated notes inside it.
- `core/timeline/`, `views/*-bases-view.ts`, `bases/` — the fourteen Bases views.
- `editor/` — multi-cursor, text colour, table column layout, HTML live preview.
- `views/register-bases-views.ts` — the single place views are registered. The mini build resolves it to `register-bases-views.mini.ts`, a no-op, which is the whole of what MiniNUI leaves out. Register a new view here and nowhere else, or it will leak into MiniNUI.
- `build-flags.ts` — `IS_MINI`, replaced at build time. Do not import it from anything a test loads: it is a `define`, undefined outside a bundle.

## Conventions

- View-type strings and CSS classes are `nui-*`. **Never rename a `nui-*` view type** — they are written into users' `.base` files.
- The plugin must never write to a user's `.base` file. `habits/no-base-mutation.test.ts` guards this; it has regressed once already.
- Plugin CSS uses Obsidian's native variables only. No `--nui-*` token layer, no literal typography values — typography belongs to the theme, and the theme is optional.
- Anything that overrides built-in Obsidian behaviour defaults to off.
- `scripts/check-no-personal-paths.mjs` rejects the author's private vault conventions. With no arguments it checks `src/`; the release workflow also points it at `../vault-example`. Test fixtures are exempt.
- Versions: `manifest.json`, `package.json`, `versions.json`, and the theme manifest all read from the repository's root `VERSION` file. Add the matching `versions.json` entry in the same commit as any bump.
- MiniNUI (plugin id `mininui`, theme folder `MiniNUI`) is generated at release time by `scripts/package-release.sh` from `main.mini.js` and a rewritten manifest. Never maintain it by hand. Its curl entry point is `scripts/install-remote-mini.sh`.
- Releases are cut from the monorepo root by pushing to `prod`, and the tag is `v{VERSION}`. Submitting this plugin to the community directory later would require extracting it to its own repository with an un-prefixed tag — see the release plan.
