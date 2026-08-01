---
type: Implementation
title: Note
description: Embedding a note whole, by heading, or by block.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Note

Embed a Markdown note to show its content inline. The embedded note updates when the source file changes.

| Variant | Syntax | Shows |
| ------- | ------ | ----- |
| Full note | `![[note]]` | Entire note body |
| Heading | `![[note#Heading]]` | Content under that heading |
| Block | `![[note#^block-id]]` | Single paragraph, list, blockquote, or table |
| List | `![[note#^list-id]]` | A list with a block anchor |

## Block identifiers

Add `^id` at the end of a block to make it embeddable:

```md
- Item one
- Item two

^my-list-id
```

Then: `![[My note#^my-list-id]]`

