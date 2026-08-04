---
type: Implementation
title: Daily Note Link
description: Folder-style chips linking to today, yesterday, or tomorrow's daily note.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Daily Note Link

Folder-style chip linking to a daily note relative to today. Views live on `Bases/Daily.base`.

```md
![[Daily.base#today]]
![[Daily.base#yesterday]]
![[Daily.base#tomorrow]]
```

## Layout

[[2-elements/list/index|List]] folders chip — same appearance as folder links in `![[Navigation.base]]` (large title, `→` arrow, borderless chip). Renders exactly `→ Today` (or Yesterday / Tomorrow) — no date and no folder name in the label.

No [[add-button]] — the chip itself opens or creates the note.

## Behaviour

- Resolves path from Obsidian **Daily notes** core plugin settings (folder, format, template), with optional `linkFolder` override on the view.
- `dayOffset`: `0` today, `-1` yesterday, `1` tomorrow.
- `label`: display word (`Today`, …). Defaults from the offset when omitted.
- Default symbol: `→` — same as Navigation (`listPrefix` overrides).
- Click opens that day's note. If missing, creates it via the daily-notes plugin (template applied); falls back to vault create when the plugin API is unavailable.
- Label stays a fixed word; the target path updates when the embed re-renders after midnight.

## Daily.base views

```yaml
- type: nui-daily-note-link
  name: today
  label: Today
  dayOffset: 0
  linkFolder: Daily
  cardSize: 180
```

Ignores base filters — path comes from daily-notes settings / `linkFolder`, not `this.file.folder`.

## Vault usage

- `Daily/Daily.md` — `![[Daily.base#today]]`
- `Start here.md` — same embed above Navigation

## See also

- [[contents]] — shared navigation base
- [[nui-plugin]] — `nui-daily-note-link` registration
