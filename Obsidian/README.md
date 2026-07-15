# NUI for Obsidian — build tooling

`main` is slim: esbuild/npm tooling only. All plugin and theme source lives in **NipaNotes**.

## Daily dev

```bash
cd plugin
npm install
npm run dev      # watch → NipaNotes/.obsidian/plugins/nui/main.js
npm run build    # production build
```

Edit plugin: `NipaNotes/.obsidian/plugins/nui/src/`  
Edit theme: `NipaNotes/.obsidian/themes/NUI/theme.css`

Reload the plugin in Obsidian after building. iCloud syncs to mobile.

## Layout (main branch)

| Path | Role |
| ---- | ---- |
| `plugin/` | esbuild, TypeScript, `npm run build` |
| `scripts/` | Vault helper scripts (normalize notes) |
| `RELEASE.md` | How to create a release branch when publishing |

## Publishing

See [RELEASE.md](RELEASE.md). Release branches hold mirrors, starter vault, and zips — not merged back to `main`.
