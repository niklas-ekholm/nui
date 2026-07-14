# NUI for Obsidian

Obsidian implementation of NUI — plugin, theme, starter vault, and build tooling.

## Install (recipients)

**Easiest:** download `nui-starter-vault-<version>.zip` from Releases, unzip, open as vault in Obsidian.

**Existing vault:**

| Component | Install path |
|-----------|--------------|
| Plugin | `.obsidian/plugins/nui/` — see [plugin/README.md](plugin/README.md) |
| Theme | `.obsidian/themes/NUI/` — see [theme/README.md](theme/README.md) |
| Vault content | Copy `starter-vault/index/` into your vault |

## Layout

| Path | Role |
| ---- | ---- |
| `plugin/` | NUI Plugin source + built `main.js` (shareable) |
| `theme/` | NUI Theme CSS (shareable) |
| `starter-vault/` | Minimal demo vault template |
| `scripts/` | Sync, build, and release scripts |
| `dist/` | Release zips (generated, gitignored) |

## Development (NipaNotes)

Source of truth lives in the NipaNotes iCloud vault:

- Plugin: `NipaNotes/.obsidian/plugins/nui/`
- Theme: `NipaNotes/.obsidian/themes/NUI/`
- Bases: `NipaNotes/index/*.base`

```bash
cd plugin
npm install
npm run dev      # watch build → NipaNotes plugin folder
npm run build    # production build
npm run sync     # copy plugin, theme, bases → this repo
npm run release  # build starter vault + create dist zips
```

After building on Mac, reload the plugin in Obsidian. Files sync to Obsidian Mobile via iCloud.

## Release workflow

```bash
cd plugin
npm run build
npm run sync
npm run release
```

Produces in `dist/`:

- `nui-plugin-<version>.zip`
- `nui-theme-<version>.zip`
- `nui-starter-vault-<version>.zip`

Commit and push, then attach zips to a GitHub Release.

## Mobile

Touch layout and embed fixes are documented in NipaNotes NUIdocs.
