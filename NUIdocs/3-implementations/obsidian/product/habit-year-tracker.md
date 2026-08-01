---
type: Implementation
title: Habit Year Tracker
description: Year-at-a-glance grid for one habit, from the shared Year.base scoped to the habit folder.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Habit Year Tracker

Year grid for a single habit, from the shared `┼/Bases/Year.base`.

```md
![[Year.base#2026]]
```

Pattern: `![[Year.base#{year}]]`. The view name **is** the year — `Year.base` carries one `nui-year-tracker` view per year, 2017 through 2026. Add a year by adding a view, not a file.

[[habit-create]] writes this embed into every new habit's `index.md`, using the current year.

## Bundle layout

```
Habits/Chess/
  index.md            -- # Chess + ![[Year.base#2026]]
  2026-07-10 Chess.md
  2026-07-12 Chess.md
```

There is no per-habit `.base` file. Scoping comes from the base's own filter, `file.inFolder(this.file.folder)`, so the same embed in a different habit folder shows that habit.

## Day notes

`{YYYY-MM-DD} {HabitName}.md`, frontmatter `date: {YYYY-MM-DD}`, matching the view's `dateField: note.date`. Clicking an empty day cell creates exactly that; clicking a filled one opens the note. An optional `rating: 1`–`5` renders on the day mark.

A day note missing its `date:` still lands correctly — `readDate` falls back to the leading `YYYY-MM-DD` in the filename.

## See also

- The multi-habit three-week board is [[weekly-habits]].
- Bundle rules and rename behaviour: [[3-implementations/obsidian/behavior/index|Behavior]].
