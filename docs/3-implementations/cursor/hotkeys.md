---
type: Implementation
title: Hotkeys
description: Cursor extension keybindings — preview toggle and editor association overrides.
generated: { by: okf-enforcer/0.5, at: 2026-08-08T00:00:00Z }
---

# Hotkeys

Keybindings contributed by the NUI Cursor extension. Source: `cursor-extension/package.json` → `contributes.keybindings`.

## Purpose

Reference for preview-first editing shortcuts. User keybinding overrides in Cursor/VS Code take precedence over extension defaults.

---

## NUI extension

| Shortcut | Command | When |
| -------- | ------- | ---- |
| ⌘` (Mac) / Ctrl+` | `nui.toggleMarkdownPreview` | `.md` file in source editor **or** markdown preview custom editor |

Toggles between VS Code markdown preview and the default text editor in the **same view column**.

---

## Override default preview

The extension sets a configuration default so new `.md` tabs open in preview:

```json
"workbench.editorAssociations": {
  "*.md": "vscode.markdown.preview.editor"
}
```

To open markdown in source mode by default, add the same key to **user** settings with `"default"` instead:

```json
"workbench.editorAssociations": {
  "*.md": "default"
}
```

User settings win over extension `configurationDefaults`.

---

## Related Obsidian bindings

Obsidian vault hotkeys live in [[3-implementations/obsidian/hotkeys|Obsidian Hotkeys]]. The Cursor extension does not mirror Obsidian's ⌘` row or NUI Plugin editor commands — only the preview toggle above.

## Roadmap

- None
