---
type: Implementation
title: Habit Delete
description: Deleting a habit is deleting its folder — no bookkeeping is needed or performed.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Habit Delete

Status: **nothing to implement.** Parent: [[3-implementations/obsidian/behavior/index|Behavior]].

## Behaviour

Delete the habit folder. The habit disappears from every tracker on the next render, because rows are derived from the folder tree at render time (`listHabitRowsInHostFolder`) rather than from a stored list.

There is no delete handler in the plugin, and none is needed.

## Why this used to be a task

Under the tag-registry design each habit also had an entry in the week tracker's `.base`, so deleting a folder left an orphaned tag behind — hence the old `removeTagFromWeeklyHabitsBase` and `pruneOrphanedHabitTagsFromWeeklyBase` helpers, and this note's former "planned" status. Both are gone with the registry; see [[habit-create]].

## Leftovers a delete does not clean

| Leftover | Consequence |
| -------- | ----------- |
| `![[Year.base#{year}]]` embeds in notes outside the habit | Unresolved embed; harmless |
| Wikilinks to the deleted habit's `index.md` | Broken link, which OKF §5.3 treats as not-yet-written |

## See also

- [[habit-create]], [[habit-rename-from-folder]]
