# Changelog

All notable changes to NUI — the plugin, the theme, and the example vault, which
share one version number.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
NUI uses [semantic versioning](https://semver.org/spec/v2.0.0.html). While the
version stays below 1.0.0, expect breaking changes in minor releases.

## [Unreleased]

### Added

- **Collapse properties** setting: the info icon beside a note title toggles whether properties stay visible, and the choice persists across notes.
- Hotkeys aligned across the plugin and example vault: opt-in defaults `Mod+Alt+` `` (show or hide chrome) and `Mod+Escape` (go to parent folder); example vault binds `Mod+` `` for toggle source mode.

### Changed

- Collapsible properties use a Lucide **info** icon with sizing tuned to align beside the note title.

## [0.2.0] — 2026-07-27

The first published release. Plugin, theme, and example vault move into one
repository and start on a single version number, clearing the theme's earlier
`0.1.1` and the plugin's `0.1.0`.

### Added

- Example vault at `vault-example/`, which is also the development vault. Ships in the
  release zip ready to open, with the plugin and theme already installed.
- `install.sh`, shipped inside every release zip. It detects its own payload —
  plugin files, a theme folder, or a full vault — and installs whatever it
  finds into a target vault without touching that vault's `data.json`,
  its content, or its workspace layout.
- Release automation on pushes to `prod`, producing a vault zip, a plugin-only
  zip, a theme-only zip, and `SHA256SUMS`.
- `scripts/check-vault.mjs`, which verifies that every view type used by a
  `.base` file in the example vault is one the plugin actually registers.

### Changed

- The theme no longer bundles the `Bookish` typefaces. Blockquotes fall back to
  a Georgia system stack; Settings → Appearance → Font still overrides it for
  anyone with their own licensed copies.
- `check-no-personal-paths.mjs` now takes directories to scan and runs over the
  example vault as well as the plugin source.

### Removed

- The release-branch mirror workflow, which duplicated plugin and theme sources
  onto branches that were never merged back.

[unreleased]: https://github.com/niklas-ekholm/nui/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/niklas-ekholm/nui/releases/tag/v0.2.0
