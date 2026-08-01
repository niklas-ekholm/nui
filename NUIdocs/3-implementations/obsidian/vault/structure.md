---
type: Implementation
title: Structure
description: How NUI is used in N-docs, the live vault — folder indexes, frontmatter rules, and where NUI artefacts sit.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Structure

How NUI is used in **N-docs** — the live Obsidian vault (plain `.md` on iCloud).

```
NUIdocs (NUI spec)           ← rules
N-docs                       ← content, and the vault the plugin ships from
NUI Plugin + NUI Theme       ← UI over vault files
```

NipaNotes is the **previous** vault and stays on the 0.1.x plugin line. Notes here describe N-docs unless they say otherwise; where the two differ, the difference is the `index.md` folder model — [[folder-index-v1-0]].

## Purpose

Live vault layout and conventions — folder indexes, frontmatter rules, and where NUI artefacts sit.

## Principles

- Every note is valid markdown with YAML frontmatter
- `.md` extension required for Obsidian
- Structure in frontmatter properties, not folder hierarchy alone
- `locked: true` — human-maintained notes AI must not edit
- No plugin-specific databases — markdown survives without NUI Plugin
- Live vault settings are in [[config]]

## Folder indexes

Each folder's hub is **`index.md`** inside that folder — one name everywhere, independent of the folder name. With NUI Plugin: click a folder **title** to open its index, creating it if absent; [[collapse-chevron]] expands the tree instead.

- Seeded with an H1 only, no template — [[folder-index-create]]
- Renaming a folder syncs nothing, because `index.md` never goes stale — [[folder-index-rename]]
- Breadcrumbs and titles display a folder index under its parent folder's name (`displayBasenameForNotePath`)

There are no `{FolderName}.md` hub notes. That coupling is what the v1.0 break removed, and dropping it is what lets a space like NUIdocs use lowercase-hyphen filenames freely.

## Where NUI artefacts sit

| Artefact | Path |
| -------- | ---- |
| Plugin (dev vault) | `vault-example/.obsidian/plugins/nui/` — bundled `main.js`, `styles.css`, `manifest.json` |
| Plugin source | `plugin/src/` in the [nui monorepo](https://github.com/niklas-ekholm/nui) |
| Theme | `vault-example/.obsidian/themes/NUI/` — `theme.css` is the source of truth |
| Build tooling | `plugin/` — `npm run dev` writes into the example vault; `node_modules` stays outside iCloud |
| Shared bases | `vault-example/┼/Bases/` — `Contents`, `Tasks`, `Timeline`, `Tracker`, `Year`, `Month` |
| Product spec | `NUIdocs/` in the monorepo — canonical NUI design language |
| Vault schema for agents | `ai/index.md`, with `CLAUDE.md` / `AGENTS.md` pointing at it |

The shared bases all filter on `file.inFolder(this.file.folder)`, so one file serves every folder that embeds it. That is the vault's central trick — see [[contents]].

## Spaces

The vault root holds one folder per space, each with its own `index.md`. See the root `index.md` for the catalogue and `ai/index.md` for the conventions each space follows.

## Roadmap

- Document the per-space conventions that `ai/index.md` currently owns alone
