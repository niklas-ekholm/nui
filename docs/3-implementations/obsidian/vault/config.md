---
type: Implementation
title: Config
description: Obsidian vault settings in app.json and why each is set.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Config

Obsidian vault settings in `.obsidian/app.json`. See [[structure]], [[🧑‍🎨 appearance]].

Configure in **Settings → Files and links** (or edit `app.json` — UI is safer).

## Files and links

| Setting | Value | Why |
|---------|-------|-----|
| Show inline title | off | Every note starts with its own H1 instead — see [[folder-index-v1-0]] |
| Filters (excluded files) | `CLAUDE.md`, `AGENTS.md` | Keeps the agent stub files out of the explorer; the plugin also hides them via `HIDDEN_NAV_FILE_PATHS` |
| Always update links | on | Safe renames and moves |
| Prompt when deleting files | off | Faster cleanup |

Everything else is left at the Obsidian default, so it does not appear in `app.json`. Notably there is **no** `newFileLocation` / `newFileFolderPath` / `attachmentFolderPath` override: new notes land wherever Obsidian defaults them, and capture goes through the `┼` inbox by convention rather than by setting.

## Raw config

`.obsidian/app.json` in full:

```json
{
  "showInlineTitle": false,
  "userIgnoreFilters": [
    "CLAUDE.md",
    "AGENTS.md"
  ],
  "alwaysUpdateLinks": true,
  "promptDelete": false
}
```

## Related

- Appearance: `.obsidian/appearance.json` — [[🧑‍🎨 appearance]]
- Full setup: [[structure]]

