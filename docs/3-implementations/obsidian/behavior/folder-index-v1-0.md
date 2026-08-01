---
type: Implementation
title: Folder Index (v1.0)
description: How the v1.0 index.md folder hub behaves — a breaking change from the 0.1.x hub-note model.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Folder Index (v1.0)

How the folder index behaves in **NUI Plugin v1.0**, the version running in the N-docs vault. This is a breaking change from the 0.1.x hub-note model documented elsewhere (still in use in NipaNotes).

## Model

Each folder's hub is a single file named `index.md` (not `{FolderName}.md`).

- Clicking a folder title in the file explorer, or a folder segment in the note-header breadcrumb, opens that folder's `index.md`.
- If the `index.md` does not exist, the click creates it, seeded with an H1 only.
- Folder names and note names are independent. There is no automatic renaming to keep a note in sync with its folder.

## Removed vs 0.1.x

- The folder↔hub-note rename upkeep (renaming a folder no longer renames a `{FolderName}.md`, and vice-versa).
- The folder-create auto-hub (creating a folder no longer spawns a same-named note).

## Related conventions

- Inline title is off; every note begins with an H1 equal to its frontmatter `title`.
- Habit bundles still use same-named notes and tags — see the habit behavior notes — and are unaffected by the folder-index change.

## Migration note

Existing `{FolderName}.md` hub-notes were converted to `index.md` when NipaNotes was migrated into N-docs. See `migration-plan.md` at the vault root.
