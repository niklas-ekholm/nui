---
type: Implementation
title: Base
description: Embedding an Obsidian Base, whole or by view name.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Base

Embed an Obsidian Base — database-style views over notes.

```md
![[MyBase.base]]
![[MyBase.base#View Name]]
```

Inline code block:

````md
```base
filters:
  and:
    - file.hasTag("example")
views:
  - type: table
    name: Table
```
````

## Built-in view types

| Type | Purpose |
| ---- | ------- |
| `table` | Rows = files; columns = properties — [[2-elements/table/index|Table]] |
| `cards` | Grid with covers |
| `list` | Bulleted list |
| `map` | Map pins (Maps plugin) |

## Context-aware filters

`this` in filters refers to the embedding note.

For NUI Plugin layouts on embedded bases, see [[2-elements/embed-chrome/index|Embed Chrome]].

