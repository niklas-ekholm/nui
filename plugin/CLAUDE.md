# NUI plugin — developer guide

Obsidian plugin (id `nui`) providing Bases views, folder-index navigation, and editor tools. Public repository; the 0.x line runs before a real 1.0.0.

## Build & reload loop

`src/` is the TypeScript source. Obsidian loads the bundled `main.js`. All tooling lives in this directory, and `node_modules` is safe here because the repository is outside iCloud.

- First setup: `npm install`
- Watch mode:   `npm run dev` — writes `main.js`, `manifest.json`, and `styles.css` into `../vault/.obsidian/plugins/nui/`, the example vault in this repository
- One-off build: `npm run build` — writes `main.js` next to the source, which is what the release workflow uploads
- Everything CI runs: `npm run check`
- After a build, reload Obsidian (Cmd+P → "Reload app") or toggle the plugin off and on.

Override the watch target with `NUI_VAULT_PLUGIN_DIR`. esbuild bundles `src/main.ts` with `obsidian`, `@codemirror/*`, electron, and node builtins external. Do not edit `main.js` by hand.

`obsidian` and the two `@codemirror` packages it peers on are pinned exactly. Obsidian pins its CodeMirror peers to single versions, so a floating range breaks `npm install` whenever Obsidian publishes.

## Architecture (src/)

- `main.ts` — plugin entry: registers commands, Bases views, editor features, the folder-index and habit managers, and the settings tab.
- `navigation/folder-index.ts` — the folder-index manager. Clicking a folder opens/creates its `{FolderName}.md` hub note; renaming a folder renames its hub and vice versa, and creating a folder auto-creates its hub. A space marked OKF (`okf_version` in its hub note's frontmatter) also gets an `index.md` sidecar alongside the hub, in every folder beneath it — see `navigation/okf-space.ts`.
- `navigation/folder-index-path.ts` — pure shared path contract. `getFolderIndexPath` → `{FolderName}.md` (the vault root's hub is named after the vault instead, set once via `setVaultRootName`). `isOkfSidecarPath` matches the fixed OKF `index.md` filename.
- `habits/` — habit bundles. A habit is a folder; completions are dated notes inside it.
- `core/timeline/`, `views/*-bases-view.ts`, `bases/` — the fourteen Bases views.
- `editor/` — multi-cursor, text colour, table column layout, HTML live preview.

## Conventions

- View-type strings and CSS classes are `nui-*`. **Never rename a `nui-*` view type** — they are written into users' `.base` files.
- The plugin must never write to a user's `.base` file. `habits/no-base-mutation.test.ts` guards this; it has regressed once already.
- Plugin CSS uses Obsidian's native variables only. No `--nui-*` token layer, no literal typography values — typography belongs to the theme, and the theme is optional.
- Anything that overrides built-in Obsidian behaviour defaults to off.
- `scripts/check-no-personal-paths.mjs` rejects the author's private vault conventions. With no arguments it checks `src/`; the release workflow also points it at `../vault`. Test fixtures are exempt.
- Versions: `manifest.json`, `package.json`, `versions.json`, and the theme manifest all read from the repository's root `VERSION` file. Add the matching `versions.json` entry in the same commit as any bump.
- Releases are cut from the monorepo root by pushing to `prod`, and the tag is `v{VERSION}`. Submitting this plugin to the community directory later would require extracting it to its own repository with an un-prefixed tag — see the release plan.
