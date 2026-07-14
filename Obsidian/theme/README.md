# NUI Theme

Visual design layer for **NUI** in Obsidian — flat chrome, muted UI, typography, links, tables, and Bases styling.

Works with the **NUI Plugin** (custom Bases views: habit grid, timeline, cards). Plugin CSS is layout and behaviour only; colours for those views live in theme.css §10.

## Install

### From release zip

1. Download `nui-theme-<version>.zip`
2. Unzip → copy the `NUI` folder to your vault's `.obsidian/themes/NUI/`
3. Settings → Appearance → Themes → select **NUI**

### From this repo

Copy the `theme/` folder contents to `.obsidian/themes/NUI/` in your vault.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Theme metadata (folder name must match `name`) |
| `theme.css` | All vault-wide appearance rules |
| `fonts/` | Optional Bookish variable fonts for blockquotes |

## Editing colours

All hex values live in **theme.css §0**. Everything below §0 uses `var(--n-*)` and `var(--nui-*)` only.

## Starter vault

For a turnkey demo, use the [starter vault](../starter-vault/README.md) which includes this theme pre-installed.
