#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OBSIDIAN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VAULT_ROOT="${HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents/NipaNotes"
VAULT_PLUGIN="${VAULT_ROOT}/.obsidian/plugins/nui"
VAULT_THEME="${VAULT_ROOT}/.obsidian/themes/NUI"
VAULT_INDEX="${VAULT_ROOT}/index"

REPO_PLUGIN="${OBSIDIAN_DIR}/plugin"
REPO_THEME="${OBSIDIAN_DIR}/theme"
REPO_STARTER="${OBSIDIAN_DIR}/starter-vault/index"

if [[ ! -d "${VAULT_PLUGIN}/src" ]]; then
	echo "error: vault plugin source not found at ${VAULT_PLUGIN}" >&2
	exit 1
fi

if [[ ! -d "${VAULT_THEME}" ]]; then
	echo "error: vault theme not found at ${VAULT_THEME}" >&2
	exit 1
fi

if [[ ! -d "${VAULT_INDEX}" ]]; then
	echo "error: vault index folder not found at ${VAULT_INDEX}" >&2
	exit 1
fi

echo "Syncing plugin from vault..."
rsync -a --delete \
	--exclude '.DS_Store' \
	--exclude 'data.json' \
	--exclude 'node_modules/' \
	"${VAULT_PLUGIN}/src/" "${REPO_PLUGIN}/src/"
rsync -a \
	"${VAULT_PLUGIN}/main.js" \
	"${VAULT_PLUGIN}/manifest.json" \
	"${VAULT_PLUGIN}/styles.css" \
	"${REPO_PLUGIN}/"

if [[ -f "${REPO_PLUGIN}/manifest.json" ]]; then
	python3 - <<'PY' "${REPO_PLUGIN}/manifest.json"
import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as handle:
    data = json.load(handle)
data["description"] = "NUI layouts and behaviour for Obsidian."
with open(path, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent="\t")
    handle.write("\n")
PY
fi

echo "Syncing theme from vault..."
mkdir -p "${REPO_THEME}"
rsync -a \
	"${VAULT_THEME}/theme.css" \
	"${VAULT_THEME}/manifest.json" \
	"${REPO_THEME}/"
if [[ -d "${VAULT_THEME}/fonts" ]]; then
	rsync -a "${VAULT_THEME}/fonts/" "${REPO_THEME}/fonts/"
fi

echo "Syncing starter vault bases..."
mkdir -p "${REPO_STARTER}"
rsync -a \
	"${VAULT_INDEX}/Contents.base" \
	"${VAULT_INDEX}/Timeline.base" \
	"${VAULT_INDEX}/Tracker.base" \
	"${VAULT_INDEX}/Year.base" \
	"${VAULT_INDEX}/Tasks.base" \
	"${REPO_STARTER}/"

echo "Sync complete."
echo "  plugin: ${REPO_PLUGIN}"
echo "  theme:  ${REPO_THEME}"
echo "  starter index: ${REPO_STARTER}"
