# NUI for Cursor

Preview-first markdown editing with NUI typography when working outside Obsidian.

## Features

- Opens `.md` files in the normal editor; use the Preview button or `Cmd+` `` to open NUI-styled preview beside the source
- `Cmd+` `` (Mac) / `Ctrl+` `` (Windows/Linux) toggles between preview and source
- NUI type scale in markdown preview (headings, blockquotes, links, code)
- Wikilinks (`[[Note]]`, `[[Note|label]]`, `[[Note#heading]]`) render as underlined links and open the matching markdown file in the workspace

## Development

```bash
cd cursor-extension
npm install
npm run build
```

Open this folder in Cursor, press **F5** to launch an Extension Development Host, then open any `.md` file from the repo.

## Override default preview

The extension no longer forces the markdown preview custom editor as default — that editor is unreliable in Cursor and prevents files from opening from the sidebar.

To open markdown in the preview custom editor anyway, add to user settings:

```json
"workbench.editorAssociations": {
  "*.md": "vscode.markdown.preview.editor"
}
```

To keep source mode (recommended), use `"default"` or omit the setting entirely.

## Scope

This extension does not include Obsidian Bases views, `![[embed]]` blocks, or hub-note navigation. It is a lightweight preview layer for editing markdown in Cursor.
