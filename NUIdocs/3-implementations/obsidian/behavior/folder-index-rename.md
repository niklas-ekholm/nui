---
type: Implementation
title: Folder Index Rename
description: Folder names and index.md are independent — a rename syncs nothing, by design.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Folder Index Rename

Status: **removed in v1.0.** Parent: [[3-implementations/obsidian/behavior/index|Behavior]]. Model: [[folder-index-v1-0]].

## What happens now

Nothing. Every hub is named `index.md`, so a folder rename cannot make its hub's name stale and there is nothing to sync. Renaming `Old/` → `New/` leaves `New/index.md` exactly where it was.

The plugin still registers a `vault.on("rename")` listener in `FolderIndexManager`, but it only refreshes note-header state — the breadcrumb and title labels that display a folder index under its parent folder's name (`displayBasenameForNotePath`). It renames nothing.

## What was removed

The 0.1.x line kept `{Folder}/{Folder}.md` hub notes, so folder and hub names had to be pushed back and forth: rename the folder and the hub followed; rename the hub and the folder followed. That two-way sync, its stale-hub retries, and its collision notices are all gone. The 0.1.x behaviour still ships in NipaNotes and is documented there.

| Then (0.1.x) | Now (v1.0) |
| ------------ | ---------- |
| Renaming a folder renamed its hub note | Hub keeps the name `index.md` |
| Renaming the hub note renamed its folder | Renaming `index.md` just makes an ordinary note, and the folder loses its hub |
| Note names were coupled to folder names | Independent — which is what lets NUIdocs use lowercase-hyphen filenames |

Habit bundles are the exception that still cares about names, because their day notes carry the habit name in the filename: [[habit-rename-from-folder]].

## Source

`src/navigation/folder-index.ts` (`registerRenameHandler`, `registerHeaderSync`), `src/navigation/folder-index-path.ts`
