---
type: Implementation
title: Habit Create
description: Creating a habit folder and its index note from the + button on an embedded Week x3 tracker.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Habit Create

Create a new habit from [[add-button]] on an embedded Week ×3 tracker.

Status: live. Parent: [[3-implementations/obsidian/behavior/index|Behavior]].

## Trigger

[[add-button]] in the Week ×3 topbar — `onAddHabit` in `src/views/week-tracker-3-bases-view.ts` calls `createHabit` with `calendarFolder` set to the **host folder**, i.e. the folder holding the note the tracker is embedded in. Embedding `![[Tracker.base]]` in `Habits/index.md` creates under `Habits/`; embedding it in `Habits/Liikunta/index.md` creates a sub-habit under `Habits/Liikunta/`.

## Create order

1. Resolve a unique name — `Untitled`, then `Untitled 2`, … until the folder path is free (`resolveUniqueHabitName`)
2. Create the folder `{hostFolder}/{name}/`
3. Create `index.md` in it
4. Open the index note

All of it runs inside `withFolderIndexCreateSuppressed`, so the folder-index manager does not also react to the new folder.

## Index note content

```md
# {Name}

![[Year.base#{year}]]
```

`{year}` is the current year unless the caller passes one. The embed resolves against the shared `┼/Bases/Year.base`, which scopes itself to the embedding folder — so the year grid shows this habit's day notes and nothing else.

## No tag is registered

A tag string is derived from the name (`habitTagFromName`) and returned to the caller, but nothing writes it to disk. Habits are identified by **folder**, not by tag: the Week ×3 tracker lists sibling folders (`listHabitRowsInHostFolder`) and both trackers filter with `file.inFolder(this.file.folder)`.

Nothing in the habit code may mutate a `.base` file. An earlier version registered each habit as a tag inside the week tracker's base; against a folder-scoped base that injected a stray `filters.or` branch on every rename. Guarded by `src/habits/no-base-mutation.test.ts`.

## Source

`src/habits/create-habit.ts`, `src/habits/habit-bundle.ts`

## See also

- [[habit-rename-from-folder]] — the rename counterpart
