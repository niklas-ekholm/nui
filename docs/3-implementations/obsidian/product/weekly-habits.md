---
type: Implementation
title: Weekly Habits
description: Three-week habit board from the shared Tracker.base, one row per habit folder.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Weekly Habits

Three-week habit overview from the shared `┼/Bases/Tracker.base`.

```md
![[Tracker.base]]
![[Tracker.base#Week]]
```

The base has a single view, `Week`, so the bare form works. Live in `Habits/index.md`.

## Layout

[[2-elements/tracker/index|Tracker]] — Week ×3 on desktop (two past weeks plus the current week).

On **mobile** the same embed shows a **10-day rolling window** ending today, today rightmost. See [[mobile]].

[[add-button]] creates a habit folder in the hosting folder — [[habit-create]].

## Tracker.base

```yaml
filters:
  and:
    - file.inFolder(this.file.folder)
    - file.path != this.file.path
views:
  - type: nui-week-tracker-3
    name: Week
    dateField: note.date
```

Folder-scoped, with no habit names in it. One base serves every board in the vault: rows are the **child folders** of whichever folder hosts the embed (`listHabitRowsInHostFolder`), so the base never needs editing when habits change.

The host folder itself becomes a row too when it is a habit bundle with day notes of its own and no habit children — which is how a leaf habit can still show a week board.

## Nesting

Because scoping follows the embed, a habit folder that contains habit folders acts as a group. `Habits/Liikunta/index.md` embeds `![[Tracker.base#Week]]` and gets a row per sub-habit.

## Vault usage

- `Habits/index.md` — all habits
- `Habits/Liikunta/index.md` — sub-habits of one group

## See also

- The year-at-a-glance view of a single habit is [[habit-year-tracker]].
