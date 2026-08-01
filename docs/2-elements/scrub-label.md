---
type: Element
title: Scrub Label
description: Draggable label that scrubs its bound numeric or date value in place.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Scrub Label

Draggable label showing a numeric or date value. Drag vertically to scrub the bound value.

## Purpose

Scrub Label element — drag-to-edit numeric or date value in place.

## Uses foundations

- [[drag-to-edit]]
- [[ghost-chrome]], [[two-tier-text]]

## Appearance

**small** text; underline or minimal chrome. Shows formatted value (e.g. `DD.MM`, **XS**–**XL**).

## States

| State | Appearance |
| ----- | ---------- |
| Idle | Muted label |
| Scrubbing | Body cursor lock; value updates live |
| Hover | Content colour |

## Tokens

**ui**, **content**; role: interactive label.

## Used in

- [[2-elements/timeline/index|Timeline]] — date range edges, row size

