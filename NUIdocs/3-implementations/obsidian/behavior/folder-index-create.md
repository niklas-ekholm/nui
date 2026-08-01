---
type: Implementation
title: Folder Index Create
description: Hubs are created on demand when a folder is opened, not when it is created.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Folder Index Create

Creates a folder's `index.md` the first time something asks to open it.

Status: live. Parent: [[3-implementations/obsidian/behavior/index|Behavior]]. Model: [[folder-index-v1-0]].

## Trigger

There is **no** `vault.on("create")` handler — creating a folder does not spawn a hub. Creation is lazy, driven by `openFolderIndex` → `createFolderIndex` in `src/navigation/folder-index.ts` (`FolderIndexManager`):

| Entry point | Behaviour |
| ----------- | --------- |
| Click a folder title in the file explorer | Open `index.md`, creating it silently if absent |
| Click a folder segment in the note-header breadcrumb | Same |
| `nui:create-folder-index` command | Create and open, with a notice |
| `nui:open-folder-index` command | Open, creating if absent |
| Week ×3 **+** | Creates the habit folder *and* its index directly — [[habit-create]] |

`createFolderIndex` opens an existing hub rather than failing, so the entry points are idempotent.

## Shape

`{Folder}/index.md`, seeded with an H1 and nothing else:

```md
# {FolderName}
```

`buildFolderIndexContent` supplies it. No frontmatter, no template, no base embeds — see [[3-implementations/obsidian/product/index|Product]] if you want views in a hub.

## Suppress

Programmatic folder creation wraps `vault.createFolder` in `withFolderIndexCreateSuppressed` (`src/navigation/folder-index-suppress.ts`) so a batch does not open hubs mid-flight:

- `create-subfolder.ts`
- `create-habit.ts`
- `turn-into-project-folder.ts`
- `import-folder.ts`
- Week / month / year tracker day-note parent ensures

## Source

`src/navigation/folder-index.ts`, `src/navigation/folder-index-path.ts`, `src/navigation/folder-index-suppress.ts`, `src/navigation/create-subfolder.ts`
