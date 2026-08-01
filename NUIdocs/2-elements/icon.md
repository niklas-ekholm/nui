---
type: Element
status: speculative
title: Icon
description: "Pictograms and UI symbols at consistent size and stroke weight. Speculative — not built."
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Icon

> [!warning] Speculative — not built.
> This note is the design, written to be built against. Nothing here describes shipped code.

IBM UI icons analog — pictograms and UI symbols for toolbars, status, and empty states.

## Purpose

Icon element for consistent symbol sizing and stroke weight. Obsidian currently uses Lucide via native UI; NUI defines no icon set of its own.

## Uses foundations

- [[color]] — **ui** at rest, **content** on hover
- [[typography]] — align to toolbar **small** size

## Implementation

No general icon set exists in NUI Theme or NUI Plugin. Obsidian uses Lucide via native UI.

Fold disclosure uses [[collapse-chevron]] — fixed `10px` glyph on Obsidian `right-triangle`, not toolbar icon size tokens.


## Roadmap

- Define icon size steps and stroke rules
- Decide whether NUI ships custom icons or documents host icons only

