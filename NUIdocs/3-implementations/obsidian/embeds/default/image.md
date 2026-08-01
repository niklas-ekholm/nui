---
type: Implementation
title: Image
description: Embedding vault or external images with size options.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Image

Embed images from the vault or an external URL.

```md
![[photo.png]]
![[photo.png|640x480]]
![[photo.png|400]]
![[photo.png|wide]]
```

Pipe tokens after `|` are parsed left to right:

| Token | Meaning |
| ----- | ------- |
| bare number | width in px (Obsidian-compatible) |
| `640x480` | legacy image dimensions |
| `wide` | editor pane width; breaks out of readable column |

External: `![Alt|250](https://example.com/image.png)`

NUI Theme §7 applies borderless styling and pane breakout when `|wide` is present.
