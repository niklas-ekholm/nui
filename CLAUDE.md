# NUI plugin — developer guide

Obsidian plugin (id `nui`) providing Bases views, folder-index navigation, and editor tools. Public repository; the 0.x line runs before a real 1.0.0.

## Build & reload loop

`src/` is the TypeScript source. Obsidian loads the bundled `main.js`. All tooling lives in this repository — `~/Sites/nui-build` is retired, and `node_modules` is safe here because the repository is outside iCloud.

- First setup: `npm install`
- Watch mode:   `npm run dev` — writes `main.js`, `manifest.json`, and `styles.css` into `../nui-testvault/.obsidian/plugins/nui/`
- One-off build: `npm run build` — writes `main.js` next to the source, which is what the release workflow uploads
- Everything CI runs: `npm run check`
- After a build, reload Obsidian (Cmd+P → "Reload app") or toggle the plugin off and on.

Override the watch target with `NUI_VAULT_PLUGIN_DIR`. esbuild bundles `src/main.ts` with `obsidian`, `@codemirror/*`, electron, and node builtins external. Do not edit `main.js` by hand.

`obsidian` and the two `@codemirror` packages it peers on are pinned exactly. Obsidian pins its CodeMirror peers to single versions, so a floating range breaks `npm install` whenever Obsidian publishes.

## Architecture (src/)

- `main.ts` — plugin entry: registers commands, Bases views, editor features, the folder-index and habit managers, and the settings tab.
- `navigation/folder-index.ts` — the folder-index manager. Clicking a folder opens/creates its `index.md`; there is no folder↔note rename sync.
- `navigation/folder-index-path.ts` — pure shared path contract. `getFolderIndexPath` → `index.md`; `isFolderIndexPath` matches `index.md`.
- `habits/` — habit bundles. A habit is a folder; completions are dated notes inside it.
- `core/timeline/`, `views/*-bases-view.ts`, `bases/` — the fourteen Bases views.
- `editor/` — multi-cursor, text colour, table column layout, HTML live preview.

## Conventions

- View-type strings and CSS classes are `nui-*`. **Never rename a `nui-*` view type** — they are written into users' `.base` files.
- The plugin must never write to a user's `.base` file. `habits/no-base-mutation.test.ts` guards this; it has regressed once already.
- Plugin CSS uses Obsidian's native variables only. No `--nui-*` token layer, no literal typography values — typography belongs to the theme, and the theme is optional.
- Anything that overrides built-in Obsidian behaviour defaults to off.
- `scripts/check-no-personal-paths.mjs` rejects the author's private vault conventions in `src/`. Test fixtures are exempt.
- Releases: the git tag equals `manifest.version` exactly, with no `v` prefix. Add the matching `versions.json` entry in the same commit.
