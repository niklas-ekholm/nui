# Dev

Developer reference for the Cursor extension — build, debug, and manifest layout.

Source: `cursor-extension/` at the repo root.

## In this section

No child notes yet.

## Purpose

Dev workspace for **NUI for Cursor** — not end-user documentation. Covers how to build the extension bundle, run it in an Extension Development Host, and where each contributed capability lives.

To install the extension for daily use (VSIX), see [[3-implementations/cursor/install|Install]].

## Prerequisites

- Node.js (extension targets Node 18)
- Cursor or VS Code with the Extension Development Host

## Build

```bash
cd cursor-extension
npm install
npm run build
```

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | esbuild watch — writes `dist/extension.js` on change |
| `npm run build` | `tsc --noEmit` then production esbuild (no sourcemap) |
| `npm run typecheck` / `npm run check` | TypeScript only |

esbuild bundles `src/extension.ts` to `dist/extension.js` as CommonJS with `vscode` externalized (`esbuild.config.mjs`).

## Run locally

1. Open the `cursor-extension/` folder in Cursor (or add it as a workspace folder).
2. **Run → Start Debugging** (F5) — launches **Run Extension** (`.vscode/launch.json`).
3. In the Extension Development Host window, open any `.md` file from the repo.

The preLaunch task runs the default build task (esbuild watch via `.vscode/tasks.json`).

## Package layout

```
cursor-extension/
├── src/extension.ts      # activate — registers toggle command
├── media/nui-preview.css   # markdown.previewStyles
├── dist/extension.js       # build output (gitignored)
├── package.json            # contributes + scripts
└── esbuild.config.mjs
```

## Manifest contributes

| Key | Value |
| --- | ----- |
| `commands` | `nui.toggleMarkdownPreview` — "NUI: Toggle Markdown Preview" |
| `keybindings` | `cmd+` `` / `ctrl+` `` when editing or previewing `.md` |
| `markdown.previewStyles` | `./media/nui-preview.css` |
| `configurationDefaults` | `workbench.editorAssociations`: `*.md` → `vscode.markdown.preview.editor` |

`activationEvents` is empty — VS Code activates on command and configuration contribution.

## Extension logic

`toggleMarkdownPreview` resolves the active tab's markdown URI (text editor or preview custom editor), then:

- **Preview tab** → `vscode.openWith` … `default` (source editor), same view column
- **Source tab** → `markdown.showPreview`

No workspace state, no file watchers, no settings panel.

## Publishing

Not documented here — extension is private monorepo development for now. See [[3-implementations/cursor/index|Cursor]] for shipped version and publisher id.

## Roadmap

- None
