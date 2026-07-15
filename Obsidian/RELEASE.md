# Release branch workflow

`main` is slim — build tooling only. Plugin source, theme, and starter vault live in **NipaNotes**.

When Niklas asks to publish:

```bash
git checkout main
git pull
git checkout -b release/vX.Y.Z

# Restore release scripts from last publish tag (update tag if needed)
git checkout v0.1.1 -- Obsidian/scripts/sync-from-vault.sh \
  Obsidian/scripts/build-starter-vault.sh \
  Obsidian/scripts/package-release.sh

# Temporarily restore package scripts
# (or edit package.json: add sync, release, package — see v0.1.1)

cd Obsidian/plugin
npm run package    # build → sync → zips in Obsidian/dist/

git add -A
git commit -m "Release vX.Y.Z"
gh release create vX.Y.Z Obsidian/dist/*.zip --title "vX.Y.Z" --notes "..."
git checkout main
```

Release branches hold publish mirrors (`plugin/src/`, `theme/`, `starter-vault/`). Do not merge them back into `main`.
