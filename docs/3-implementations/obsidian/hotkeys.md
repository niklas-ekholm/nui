---
type: Implementation
title: Hotkeys
description: Obsidian keybindings in use — customised defaults plus NUI Plugin commands.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Hotkeys

Obsidian keybindings in this vault. Source: `.obsidian/hotkeys.json`, which records only customised bindings.

## Purpose

Vault keybinding reference — customised Obsidian defaults plus NUI Plugin commands. Canonical source is `hotkeys.json`; anything absent from it is an Obsidian default.

---

## Navigation and commands

| Shortcut | What it does |
| -------- | ------------ |
| ⌘P | Quick switcher |
| ⌘⇧P | Command palette |
| ⌘Enter | Follow link under cursor |
| ⌘N | Create new unique note (ZK prefixer) |
| ⌘⇧N | New Obsidian window |

---

## Sidebars and chrome

| Shortcut | What it does |
| -------- | ------------ |
| ⌘⇧E | Toggle left sidebar |
| ⌥⌘B | Toggle right sidebar |
| ⌥⌘E | Toggle ribbon |
| ⌘= | Zoom in |
| ⌘- | Zoom out |

---

## Editor — headings and blocks

| Shortcut | What it does |
| -------- | ------------ |
| ⌥⌘0 | Set paragraph (remove heading) |
| ⌥⌘1–6 | Set heading level 1–6 |
| ⌘⇧7 | Toggle numbered list |
| ⌘⇧8 | Toggle bullet list |
| ⌘⇧9 | Toggle checkbox |
| ⌘⇧0 | Clear formatting |
| ⌘⇧C | Toggle inline code |
| ⌘' | Toggle Live Preview / Source mode |
| ⌘\` | Add metadata property |

---

## Editor — lines and folding

| Shortcut | What it does |
| -------- | ------------ |
| ⌥↑ | Move line up |
| ⌥↓ | Move line down |
| ⌃⌥↑ | Fold all |
| ⌃⌥↓ | Unfold all |
| ⌘⇧Backspace | Delete paragraph |

---

## NUI Plugin — folder navigation

| Shortcut | Command | What it does |
| -------- | ------- | ------------ |
| ⌘Esc | `nui:go-to-parent-folder` | Open the parent folder's index |

---

## NUI Plugin — multi-cursor

Implemented by the plugin itself (`src/editor/cursors.ts`), not by a community plugin — `nui` is the only entry in `community-plugins.json`. Desktop only: these are gated behind `Platform.isDesktopApp` because they need a hardware keyboard.

| Shortcut | Command | What it does |
| -------- | ------- | ------------ |
| ⌥⌘↑ | `nui:add-cursor-above` | Add cursor on line above |
| ⌥⌘↓ | `nui:add-cursor-below` | Add cursor on line below |
| ⌘D | `nui:add-next-match-to-selections` | Add next match of selection to cursors |
| ⌥⇧↑ | `nui:copy-line-up` | Copy current line up |
| ⌥⇧↓ | `nui:copy-line-down` | Copy current line down |

---

## NUI Plugin — unbound commands

Registered and reachable from the command palette, with no key assigned:

| Command | What it does |
| ------- | ------------ |
| `nui:open-folder-index` | Open the current folder's `index.md` |
| `nui:create-folder-index` | Create and open an `index.md` for the current folder |
| `nui:turn-note-into-folder` | Convert a note into a folder with the note as its index |
| `nui:toggle-hide-chrome` | Toggle workspace chrome visibility |

---

## Intentionally unbound

Defaults removed on purpose — avoid reclaiming unless explicitly decided.

| Default Obsidian action |
| ----------------------- |
| Open link in new tab |
| Go forward in navigation history |
| Create new note |
| Create new note in new pane |

---

## Key overlap map

| Key pattern | Used by |
| ----------- | ------- |
| ⌥↑ / ⌥↓ | Move line up / down |
| ⌥⇧↑ / ⌥⇧↓ | Copy line (NUI Plugin) |
| ⌥⌘↑ / ⌥⌘↓ | Add cursor (NUI Plugin) |
| ⌃⌥↑ / ⌃⌥↓ | Fold / unfold all |
| ⌘D | Add next match (NUI Plugin) |
| ⌘N | New unique note |
| ⌘⇧N | New window |
| ⌘Esc | Parent folder (NUI Plugin) |
| ⌥⌘0–6 | Headings / paragraph |
| ⌘⇧0–9 | Formatting toggles |

## Roadmap

- None — update when hotkeys change

