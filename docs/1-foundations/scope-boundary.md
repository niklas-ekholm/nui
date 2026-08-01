---
type: Foundation
title: Scope Boundary
description: A root inside which component tokens override host chrome, letting notes and data views share one tree.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Scope Boundary

A **scope boundary** is a root inside which component tokens override host chrome. Notes and data views can share one tree but use different text colours.

In Obsidian, custom views wrap content in `.nui-text-scope` so bar titles and chart labels use **content** / **ui** tokens from the theme, not Obsidian’s default form colours.

Plugin layout CSS must not set hex colours — only structure. Colour comes from the theme inside the scope root.

## See also

- Palette and typography mapping for the scope root live in [[nui-theme]].
- Per-subtree token rules are defined in [[scope-isolation]].

