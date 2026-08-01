---
type: Implementation
title: Habit Rename From Folder
description: Renaming a habit by renaming its folder, at any depth, which renames its day notes to match.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Habit Rename From Folder

Rename a habit by renaming its folder in the file explorer, at any depth. This is the only rename path for a v1.0 habit bundle.

Status: live. Parent: [[3-implementations/obsidian/behavior/index|Behavior]].

## Example

`Habits/Untitled/` → `Habits/Chess/`, and `2026-07-10 Untitled.md` becomes `2026-07-10 Chess.md`. The `index.md` hub keeps its filename; the habit name survives only as its H1, which is not rewritten.

## Detection

`vault.on("rename")` in `HabitRenameManager` (`src/habits/habit-rename-manager.ts`), when the renamed folder passes `isHabitBundleRename` — that is, it sits **anywhere inside** the habits root *and* is a habit bundle (has a hub note). `oldName` comes from the `oldPath` basename, `newName` from `folder.name`.

Depth is not assumed. `Habits/Chess/` and `Habits/Liikunta/Aamujumppa/` both rename. The gate is deliberately the same predicate the trackers use to build rows (`isHabitBundleFolder`), so **anything that shows up as a habit row renames like one**. Plain subfolders inside a habit — attachments and the like — have no hub note and are skipped.

The root is the `DEFAULT_CALENDAR_FOLDER` constant, currently hardcoded to `Habits`.

## Steps

1. `syncing = true` — suppresses the manager's own recursion (the folder is already at `newName/` when the handler runs)
2. Collect this habit's **own** files (`listOwnFilesInHabitFolder`) — the walk stops at nested habit bundles
3. Rename every one whose basename contains `oldName`, replacing that substring (`replaceHabitNameInBasename`) and keeping the file in its own parent folder; date prefixes and any other suffix survive
4. For each renamed day note, patch a matching bare list entry in its frontmatter (`patchDayNoteContent`)
5. Sync a legacy `{oldName}.md` hub to `{newName}.md`, but only when the folder has no `index.md`
6. `syncing = false`, then refresh every mounted tracker view

No `.base` file is touched — see [[habit-create]].

## Nesting

A habit can group other habits: `Habits/Liikunta/` holds `Aamujumppa/` and embeds `![[Tracker.base#Week]]` to board them. Renaming either level works, and the two do not interfere:

| Rename | Renames | Leaves alone |
| ------ | ------- | ------------ |
| `Habits/Liikunta` → `Liike` | `Liikunta`'s own day notes | `Aamujumppa/`'s day notes — they are named after `Aamujumppa` |
| `Habits/Liikunta/Aamujumppa` → `Iltajumppa` | That sub-habit's day notes | Everything above it |

Obsidian emits one rename event for the folder that moved, not for its descendants, so a group rename cannot cascade.

## Corner cases

| Case | Behaviour |
| ---- | --------- |
| Name unchanged after trim | No-op |
| Folder moved without renaming | No-op — `oldName === newName` |
| Folder moved out of the habits root | Skipped; the new path is not inside the root |
| Non-habit subfolder renamed | Skipped — no hub note, so it is not a habit row either |
| Target habit name exists | Obsidian blocks the folder rename before the handler runs |
| Sibling target filename already taken | Throws; a notice names the conflicting file, and earlier renames stay applied |
| Folder has `index.md` | Step 5 skipped — `index.md` is name-independent |
| Sub-habit name contains the parent's name | Not affected: the walk never enters a nested bundle |

## Source

`src/habits/rename-habit.ts`, `src/habits/habit-rename-manager.ts`, `src/habits/habit-path.ts` (pure path contract, unit tested)

Shares `syncHabitRename` with [[habit-rename-from-index-note]].
