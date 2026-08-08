---
type: Implementation
title: Install
description: Install NUI for Cursor — build from the monorepo and load the VSIX into Cursor or VS Code.
generated: { by: okf-enforcer/0.5, at: 2026-08-08T00:00:00Z }
---

# Install

NUI for Cursor is not on the Open VSX or VS Code Marketplace. Install from a local VSIX built from `cursor-extension/` in this repo.

Works in **Cursor** and **VS Code** (engine `^1.85.0`).

## Purpose

End-user install path — get preview-first markdown with NUI typography without running an Extension Development Host. For day-to-day extension hacking, see [[3-implementations/cursor/dev/index|Dev]].

## Prerequisites

- Git clone of this repo
- Node.js 18+
- Cursor or VS Code 1.85+

## Build

From the repo root:

```bash
cd cursor-extension
npm install
npm run build
```

`npm run build` typechecks and writes `dist/extension.js`. The extension will not load without that file.

## Package VSIX

Still in `cursor-extension/`:

```bash
npx @vscode/vsce package
```

Creates `nui-cursor-0.1.0.vsix` in the same folder (version matches `package.json`). `vsce` may warn about a missing repository field or license — the package still succeeds.

To write the file elsewhere:

```bash
npx @vscode/vsce package --out /path/to/nui-cursor.vsix
```

## Install the VSIX

1. Open Cursor (or VS Code).
2. Command Palette → **Extensions: Install from VSIX…**
3. Select the `.vsix` file from the build step.
4. Reload the window when prompted.

The extension installs as **NUI** (`niklas-ekholm.nui-cursor`).

## Verify

1. Open any `.md` file — it should open in **markdown preview**, not the text editor.
2. Typography should match NUI reading view (light weight headings, uppercase h4–h6, blockquote scale). See [[3-implementations/cursor/nui-preview|NUI Preview]].
3. Press **⌘`** (Mac) or **Ctrl+`** to toggle between preview and source. See [[3-implementations/cursor/hotkeys|Hotkeys]].

If preview opens but styling looks like default GitHub markdown, confirm the extension is enabled and reload the window.

## Prefer source editor by default

User settings override the extension default. To open `.md` in source mode:

```json
"workbench.editorAssociations": {
  "*.md": "default"
}
```

NUI preview CSS still applies when you switch to preview manually or via **⌘**`/Ctrl+`.

## Update

After pulling repo changes:

```bash
cd cursor-extension
npm run build
npx @vscode/vsce package
```

Install the new VSIX over the previous version (same command palette action). Reload the window.

## Uninstall

Command Palette → **Extensions: Show Installed Extensions** → find **NUI** → Uninstall.

Or remove the folder under:

| Host | Extensions directory |
| ---- | -------------------- |
| Cursor | `~/.cursor/extensions/niklas-ekholm.nui-cursor-*` |
| VS Code | `~/.vscode/extensions/niklas-ekholm.nui-cursor-*` |

## See also

- [[3-implementations/cursor/index|Cursor]] — what the extension ships and what it deliberately excludes.

## Roadmap

- Marketplace publish once the extension leaves private monorepo use
