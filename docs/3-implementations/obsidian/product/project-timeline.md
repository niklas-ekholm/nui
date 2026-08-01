---
type: Implementation
title: Project Timeline
description: Timeline of dated project notes in the embedding folder.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Project Timeline

Timeline of dated project notes in the embedding folder.

```md
![[Timeline.base|wide]]
![[Timeline.base|compact]]
```

## Layout

[[2-elements/timeline/index|Timeline]] — horizontal bars from start/end properties.

## Typical filters

```yaml
filters:
  and:
    - file.path != this.file.path
views:
  - type: nui-timeline
    name: Timeline
    filters:
      and:
        - file.inFolder(this.file.folder)
```

## Vault usage

- Base: `┼/Bases/Timeline.base`
- Host: folder index note — embed at the end of the note
- Vault index (`index/index.md`): default in-column embed; folder dashboards use `|wide`

## Width and height

**Width** — pipe token: `|wide` for pane breakout (stays inside open sidebars).

**Height** — pipe tokens: `|compact` (480px internal scroll), `|full-tasks` (full layout with task rows). Embedded timelines default to full height without a pipe. Base default: `layout: full`.
