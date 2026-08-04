#!/usr/bin/env bash
#
# Fetch a NUI release and install it into an Obsidian vault, in one command.
#
#   curl -fsSL https://raw.githubusercontent.com/niklas-ekholm/nui/main/scripts/install-remote.sh | bash -s -- /path/to/vault
#
# With no vault path, installs into the current directory — run this from
# inside the vault you want updated:
#
#   curl -fsSL https://raw.githubusercontent.com/niklas-ekholm/nui/main/scripts/install-remote.sh | bash -s --
#
# This script downloads the plugin and theme zips for a release, verifies them
# against that release's SHA256SUMS, unpacks them into a temporary directory,
# and runs the install.sh that ships inside each zip. Nothing is left behind.
#
# It writes nothing itself. Every file that lands in the vault is written by the
# release's own install.sh, under the guarantees documented in INSTALL.md:
# data.json, notes, appearance.json, and workspace.json are never touched.
#
# To download the demo vault instead of installing into one you already have,
# see scripts/install-remote-vault.sh.
#
# Options:
#   --version <tag>  install a specific release (default: latest)
#   --plugin-only    install the plugin, skip the theme
#   --theme-only     install the theme, skip the plugin
#   --no-verify      skip checksum verification
#
# Any other option is passed straight through to install.sh, so --force,
# --dry-run, and --all work exactly as they do there.
#
# Piping a script from the network into a shell means trusting whatever is at
# that URL at the moment you run it. To read before running:
#
#   curl -fsSL <url> -o install-remote.sh && less install-remote.sh
#   bash install-remote.sh /path/to/vault
#
# Requires bash. `curl ... | sh` will not work: this script uses arrays.
set -euo pipefail

REPO="niklas-ekholm/nui"
API="https://api.github.com/repos/${REPO}"
DOWNLOAD="https://github.com/${REPO}/releases/download"

VERSION=""
VERIFY=1
COMPONENTS=(plugin theme)
ARGS=()

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }

usage() {
    cat <<'EOF'
Fetch a NUI release and install it into an Obsidian vault.

  install-remote.sh [options] [/path/to/vault]
  install-remote.sh [options] --all

With no vault path (and without --all), installs into the current directory.

Options:
  --version <tag>  install a specific release, e.g. v0.2.4 (default: latest)
  --plugin-only    install the plugin, skip the theme
  --theme-only     install the theme, skip the plugin
  --no-verify      skip checksum verification
  -h, --help       this message

Other options are passed through to the release's install.sh:
  --force          install even when Obsidian has the vault open
  --dry-run        print what would be written, write nothing
  --all            install into every vault in ~/.config/nui/vaults
EOF
}

# ------------------------------------------------------------------ arguments

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            [[ $# -ge 2 ]] || die "--version needs a tag, e.g. --version v0.2.4"
            VERSION="$2"; shift 2 ;;
        --version=*) VERSION="${1#*=}"; shift ;;
        --plugin-only) COMPONENTS=(plugin); shift ;;
        --theme-only) COMPONENTS=(theme); shift ;;
        --no-verify) VERIFY=0; shift ;;
        -h|--help) usage; exit 0 ;;
        -*) ARGS+=("$1"); shift ;;
        *) ARGS+=("$1"); HAVE_TARGET=1; shift ;;
    esac
done

# No positional vault path and no --all: default to the current directory, so
# the script can be run from inside the vault to update.
#
# ${ARGS[@]+"${ARGS[@]}"} (not "${ARGS[@]}") is required: macOS ships bash 3.2,
# and with set -u an empty "${ARGS[@]}" is an unbound-variable error.
if [[ -z "${HAVE_TARGET:-}" ]]; then
    have_all=0
    for a in ${ARGS[@]+"${ARGS[@]}"}; do [[ "${a}" == "--all" ]] && have_all=1; done
    (( have_all )) || ARGS+=(".")
fi

# ---------------------------------------------------------------- environment

command -v curl >/dev/null 2>&1 || die "curl is required"

# bsdtar reads zips, so unzip is preferred but not mandatory. Streaming a zip
# through tar is what is unreliable; extracting a file on disk is fine.
if command -v unzip >/dev/null 2>&1; then
    UNPACK="unzip"
elif tar --version 2>/dev/null | grep -qi bsdtar; then
    UNPACK="bsdtar"
else
    die "need unzip (or bsdtar) to unpack the release"
fi

SHATOOL=""
if command -v shasum >/dev/null 2>&1; then
    SHATOOL="shasum -a 256"
elif command -v sha256sum >/dev/null 2>&1; then
    SHATOOL="sha256sum"
fi

if (( VERIFY )) && [[ -z "${SHATOOL}" ]]; then
    warn "no shasum or sha256sum found; continuing without verification"
    VERIFY=0
fi

# ------------------------------------------------------------------- version

if [[ -z "${VERSION}" ]]; then
    info "Resolving latest release..."
    VERSION="$(curl -fsSL "${API}/releases/latest" \
        | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
        | head -1)" || true
    [[ -n "${VERSION}" ]] || die "could not resolve the latest release.
       GitHub's API rate-limits unauthenticated requests; pass --version v0.2.4 instead."
fi

# Tags carry a leading v, asset filenames do not.
NUMBER="${VERSION#v}"

# ------------------------------------------------------------------ download

TMP="$(mktemp -d "${TMPDIR:-/tmp}/nui-remote.XXXXXX")"
cleanup() { rm -rf "${TMP}"; }
trap cleanup EXIT INT TERM

info "NUI ${VERSION}"

fetch() {
    local name="$1"
    curl -fsSL -o "${TMP}/${name}" "${DOWNLOAD}/${VERSION}/${name}" \
        || die "could not download ${name} from release ${VERSION}"
}

for component in "${COMPONENTS[@]}"; do
    info "  fetching nui-${component}-${NUMBER}.zip"
    fetch "nui-${component}-${NUMBER}.zip"
done

if (( VERIFY )); then
    info "  verifying checksums"
    fetch "SHA256SUMS"
    ( cd "${TMP}" && ${SHATOOL} -c SHA256SUMS --ignore-missing >/dev/null ) \
        || die "checksum verification failed. Downloaded files are not the released ones."
fi

# ------------------------------------------------------------------- install

# Each zip is unpacked into its own directory and installed separately. They
# must not share one: the plugin ships nui/manifest.json and the theme ships
# NUI/manifest.json, which collide on a case-insensitive filesystem — the
# default on macOS.
for component in "${COMPONENTS[@]}"; do
    dir="${TMP}/${component}"
    mkdir -p "${dir}"

    case "${UNPACK}" in
        unzip) unzip -q "${TMP}/nui-${component}-${NUMBER}.zip" -d "${dir}" ;;
        bsdtar) tar -xf "${TMP}/nui-${component}-${NUMBER}.zip" -C "${dir}" ;;
    esac

    [[ -f "${dir}/install.sh" ]] \
        || die "nui-${component}-${NUMBER}.zip contains no install.sh"

    # Invoked through bash rather than executed, so a lost exec bit — zips
    # unpacked by some tools drop it — does not break the install.
    bash "${dir}/install.sh" ${ARGS[@]+"${ARGS[@]}"}
done
