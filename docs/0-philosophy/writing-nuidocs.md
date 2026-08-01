---
type: Principle
title: Writing NUI docs
description: Editorial guide for NUI docs spec notes — structure, cross-links, and when a See also section earns its place.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Writing NUI docs

Editorial guide for notes under [[index|Documentation]].

## Purpose

How to write spec notes — structure, cross-links, and when **See also** earns a place.

## See also

Follow [[Markdown style#See also]]: explained prerequisites only, 0–2 items, delete the section when nothing qualifies.

**Hub and index notes** (`[[index|Documentation]]`, `[[0-philosophy/index|0 Philosophy]]`, `[[1-foundations/index|1 Foundations]]`, etc.) use **In this section** for navigation — not **See also**.

**Good examples in this tree:**

- [[notification]] — why [[accessibility]] matters when notifications ship
- [[modal]] — philosophy constraint on dialog use
- [[scope-boundary]] — theme vs isolation split

**Prefer the body** when the link fits a section naturally (e.g. live vault settings in **Principles**, not an orphan **See also**).

## Index note order

1. Opening blurb
2. **In this section** (`![[Contents.base#Files]]` or `#Navigation` on top-level hubs)
3. **Purpose**
4. Body sections
5. **Roadmap** (last)

## Describing what is not built

A note describing code that does not exist yet is **speculative** and must be marked as such — frontmatter `status`, a banner under the H1, and a description suffix. See [[speculative-documentation|Speculative Documentation]]. An unmarked note is a claim about shipped code.

Do not write "Not yet implemented" into prose as the only signal. It is invisible to a filter, easy to leave behind after the feature ships, and easy to miss when skimming.

## Roadmap

- None

