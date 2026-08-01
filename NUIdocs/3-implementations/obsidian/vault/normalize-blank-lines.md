---
type: Implementation
title: Normalize Blank Lines
description: Script enforcing a predictable blank-line frame across every text file.
generated: { by: okf-enforcer/0.5, at: 2026-07-25T00:00:00Z }
---

# Normalize Blank Lines

Every text file in the vault keeps a predictable blank-line frame at the top and bottom. This helper script enforces it across the vault in one pass.

## Purpose

Bulk-fix blank lines after imports, template edits, or manual drift — without hand-editing hundreds of notes.

## Rules

| Case | Top | After YAML frontmatter | Bottom |
| ---- | --- | ---------------------- | ------ |
| No frontmatter | One blank line | — | One blank line |
| YAML frontmatter (`---` … `---`) | Frontmatter on line 1 — no blank line before | One blank line | One blank line |

A lone `---` in the body (horizontal rule) is **not** frontmatter. Only an opening and closing `---` pair at the start of the file counts.

Skipped: binary files (`.png`, `.DS_Store`, etc.) and non-UTF-8 files.

## Script

Path: `Sites/NUIrepo/Obsidian/scripts/normalize-vault-blank-lines.py` — **needs confirming.** NUIrepo now targets the legacy NipaNotes 0.1.x line and plugin build tooling moved to `~/Sites/nui-build`; the script may have moved with it. Pass the vault path explicitly either way.

Requires Python 3. Its built-in default is the old NipaNotes path, so pass this vault's path explicitly.

```bash
python3 Sites/NUIrepo/Obsidian/scripts/normalize-vault-blank-lines.py
python3 Sites/NUIrepo/Obsidian/scripts/normalize-vault-blank-lines.py --dry-run
python3 Sites/NUIrepo/Obsidian/scripts/normalize-vault-blank-lines.py /path/to/N-docs
```

`--dry-run` lists files that would change without writing.

## Roadmap

- None

