---
type: Element
title: Search Field
description: Fixed-width underline filter input with an optional clear control.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Search Field

Fixed-width underline field for filtering lists or charts. Optional **×** clear control at the end.

## Purpose

Search Field element — filter input with optional clear control.

## Uses foundations

- Extends [[text-input]]
- [[ghost-chrome]] for **×** control

## Appearance

Extends [[text-input]] — bottom rule, fixed width. Leading search icon at the start. **×** appears when text is non-empty.

## States

| State | Appearance |
| ----- | ---------- |
| Empty | No **×** |
| Has text | **×** at trailing edge; **Escape** clears |
| Cleared | Filter removed; all rows visible |

## Tokens

**border**, **ui**, **content**.

## Used in

- [[filter-field]]

