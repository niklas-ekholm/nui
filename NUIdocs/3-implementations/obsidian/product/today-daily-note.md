---
type: Implementation
title: Today Daily Note
description: A single folder-style chip linking to today's daily note.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Today Daily Note

Single folder-style chip linking to today's daily note. View lives on `┼/Bases/Contents.base`.

```md
![[Contents.base#Today Daily Note]]
```

## Layout

[[2-elements/list/index|List]] folders chip — same appearance as folder links in `![[Contents.base#Navigation]]` (large title, arrow, borderless chip). Renders one link labelled with today's date (e.g. `→ 2026-07-11`).

No [[add-button]] — the chip itself opens or creates the note.

## Behaviour

- Resolves path from Obsidian **Daily notes** core plugin settings (folder, format, template).
- Default format: `YYYY-MM-DD`. Vault folder: `index/+`.
- Click opens today's note. If missing, creates it via the daily-notes plugin (template applied); falls back to vault create when the plugin API is unavailable.
- Label updates when the embed re-renders after midnight.

## Contents.base view

```yaml
- type: nui-daily-note-link
  name: Today Daily Note
  cardSize: 180
```

Ignores base filters — path comes from daily-notes settings, not `this.file.folder`.

## Vault usage

- `index/index.md` — below Navigation

## See also

- [[contents]] — shared base and other list views
- [[nui-plugin]] — `nui-daily-note-link` registration

