---
type: Implementation
title: Habit Rename From Index Note
description: Legacy-only path — renaming a habit by renaming a same-named hub note, which no v1.0 bundle has.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Habit Rename From Index Note

Rename a habit by renaming its hub note, pulling the folder name along with it.

Status: **legacy only — unreachable for v1.0 bundles.** Parent: [[3-implementations/obsidian/behavior/index|Behavior]].

## Why it no longer fires

`isHabitHubIndexRename` requires the renamed file to have been a *same-named* folder note (`Chess/Chess.md`) and explicitly returns `false` when `oldPath` is a folder index path. Since [[folder-index-v1-0]] every hub is `index.md`, so:

- Renaming `Habits/Chess/index.md` → anything is not treated as a habit rename.
- Only a bundle still carrying a legacy `{Folder}/{Folder}.md` hub — none in this vault — can trigger it.

Rename the **folder** instead: [[habit-rename-from-folder]].

The code is kept because 0.1.x bundles in NipaNotes still use same-named hubs, and a bundle imported from there should still rename correctly.

## Detection (legacy bundles)

`vault.on("rename")` in `HabitRenameManager` when all of:

- `oldPath` is **not** an `index.md` path
- `oldPath` was a same-named folder note (`isSameNamedFolderNote`)
- the parent folder is a direct child of `Habits`

## Steps

1. `syncing = true`
2. Abort if a folder named `newName` already exists elsewhere under the habits root
3. Rename sibling filenames containing `oldName`, patching day-note frontmatter list entries
4. Rename the folder `oldName/` → `newName/`
5. `syncing = false`, then refresh every mounted tracker view

No `.base` file is touched — see [[habit-create]].

## Corner cases

| Case | Behaviour |
| ---- | --------- |
| Bundle uses `index.md` | Not detected — this is every v1.0 habit |
| Target habit name exists | Throws before any rename; notice, no partial state |
| Whitespace-only change | No-op after trim |
| Day notes with body text | Only a matching bare frontmatter list entry is patched; the body is never scanned |

## Source

`src/habits/rename-habit.ts`, `src/habits/habit-rename-manager.ts`

Shares `syncHabitRename` with [[habit-rename-from-folder]].
