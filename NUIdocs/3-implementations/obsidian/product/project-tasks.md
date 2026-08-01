---
type: Implementation
title: Project Tasks
description: Open tasks collected from GFM checkboxes in the embedding folder.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Project Tasks

Open tasks from GFM checkboxes in the embedding folder.

```md
![[Tasks.base#Open]]
![[Tasks.base#All]]
```

## Data contract

Tasks are standard markdown checkboxes in project notes:

```markdown
- [ ] Fix stale README paths
- [x] Implement habit rename from folder
```

The base is a **read/write lens** — source of truth stays in the checkbox line in its host note. No plugin-specific task syntax.

## Layout

`nui-task-list` — checkbox, task text, muted source note link. Toggle updates the source line in the vault.

## Typical filters

```yaml
filters:
  and:
    - file.inFolder(this.file.folder)
```

## Vault usage

- Base: `┼/Bases/Tasks.base`
- Host: folder index note — embed at the end of the note
- `index.md` scopes to all of `index/`; project hubs scope to their subtree

## Views in one base

**Open** (`showCompleted: false`) for dashboards; **Ongoing** (`projectScope: ongoing`) for tasks in projects with a timeline bar covering today; **All** (`showCompleted: true`) for full history.

Ongoing scans `index/` for dated notes — no separate timeline folder list.
