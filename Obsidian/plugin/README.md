# NUI Plugin — build tooling

Builds the NUI Plugin from source in **NipaNotes** into `main.js` in the vault.

```bash
npm install
npm run dev    # watch
npm run build  # production
npm test       # embed pipe tests (vault source)
```

**Edit source in NipaNotes only:**  
`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/NipaNotes/.obsidian/plugins/nui/src/`

**Do not edit** `src/` here — this repo holds build tooling only on `main`.

Output: `main.js` in the NipaNotes plugin folder (iCloud-synced).

For publishing, see [RELEASE.md](../RELEASE.md).
