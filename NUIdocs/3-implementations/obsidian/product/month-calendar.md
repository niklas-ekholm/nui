---
type: Implementation
title: Month Calendar
description: Cross-habit month calendar from the shared Month.base, scoped by view name.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Month Calendar

Month grid over the notes in the embedding folder, from the shared `┼/Bases/Month.base`.

```md
![[Month.base]]
![[Month.base#compact]]
![[Month.base#2026]]
![[Month.base#7]]
```

## Views

24 `nui-month-tracker` views, all sharing one folder-scoped filter:

| View | Scope |
| ---- | ----- |
| `Calendar` | Current year, all months, event pills |
| `compact` | Current year, all months, day marks only |
| `1`–`12` | That month of the current year |
| `2017`–`2026` | That whole year |

Same filter as its siblings, so scope follows the embed:

```yaml
filters:
  and:
    - file.inFolder(this.file.folder)
    - file.path != this.file.path
```

## Layout

[[month|Tracker — Month]]. `Calendar` and the numbered views show **event pills** titled by each note's parent folder, so embedding at a level that contains several habit folders gives a cross-habit calendar. `compact` reduces every day to a single mark.

## Vault usage

- `Habits/Työpäivä/index.md` — `![[Month.base]]`
- `Habits/kaikki merkinnät kuukausittain.md` — `![[Month.base]]`, all entries by month
- `Habits/totaaliseuranta.md` — `![[Month.base#compact]]`

Embedded from a note directly inside `Habits/`, the pills name each habit folder — which is what makes "kaikki merkinnät kuukausittain" work without configuration.

## Live Preview

A **full** month embed sticks its header band under the pane chrome while the note scrolls — [[live-preview-sticky-headers]].

## See also

- One habit, one year: [[habit-year-tracker]]
- Many habits, three weeks: [[weekly-habits]]
