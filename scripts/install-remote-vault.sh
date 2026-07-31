#!/usr/bin/env bash
#
# Fetch the NUI example vault — plugin and theme already installed, ~40 notes
# of demo content — without downloading a zip by hand first.
#
#   curl -fsSL https://raw.githubusercontent.com/niklas-ekholm/nui/main/scripts/install-remote-vault.sh \
#     | bash -s --
#
# Downloads the release's vault zip, verifies it against that release's
# SHA256SUMS, and unpacks it. With no directory argument, unpacks into the
# current directory; otherwise into the directory given. Either way it lands
# as nui-vault-<version>/ inside that directory — open that folder in
# Obsidian via "Open folder as vault".
#
# This is the demo vault, not an installer for a vault you already have. For
# that, see scripts/install-remote.sh.
#
# Options:
#   --version <tag>  install a specific release (default: latest)
#   --no-verify      skip checksum verification
#
# Requires bash. `curl ... | sh` will not work: this script uses arrays.
set -euo pipefail

REPO="niklas-ekholm/nui"
API="https://api.github.com/repos/${REPO}"
DOWNLOAD="https://github.com/${REPO}/releases/download"

VERSION=""
VERIFY=1
DEST="."

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }

usage() {
    cat <<'EOF'
Fetch the NUI example vault.

  install-remote-vault.sh [options] [directory]

With no directory, unpacks into the current directory.

Options:
  --version <tag>  install a specific release, e.g. v0.2.2 (default: latest)
  --no-verify      skip checksum verification
  -h, --help       this message
EOF
}

# ------------------------------------------------------------------ arguments

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            [[ $# -ge 2 ]] || die "--version needs a tag, e.g. --version v0.2.2"
            VERSION="$2"; shift 2 ;;
        --version=*) VERSION="${1#*=}"; shift ;;
        --no-verify) VERIFY=0; shift ;;
        -h|--help) usage; exit 0 ;;
        -*) die "unknown option: $1" ;;
        *) DEST="$1"; shift ;;
    esac
done

# ---------------------------------------------------------------- environment

command -v curl >/dev/null 2>&1 || die "curl is required"

[[ -d "${DEST}" ]] || die "not a directory: ${DEST}"

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
       GitHub's API rate-limits unauthenticated requests; pass --version v0.2.2 instead."
fi

# Tags carry a leading v, asset filenames do not.
NUMBER="${VERSION#v}"
ZIP_NAME="nui-v${NUMBER}.zip"

# ------------------------------------------------------------------ download

TMP="$(mktemp -d "${TMPDIR:-/tmp}/nui-remote-vault.XXXXXX")"
cleanup() { rm -rf "${TMP}"; }
trap cleanup EXIT INT TERM

info "NUI ${VERSION} example vault"

fetch() {
    local name="$1"
    curl -fsSL -o "${TMP}/${name}" "${DOWNLOAD}/${VERSION}/${name}" \
        || die "could not download ${name} from release ${VERSION}"
}

info "  fetching ${ZIP_NAME}"
fetch "${ZIP_NAME}"

if (( VERIFY )); then
    info "  verifying checksum"
    fetch "SHA256SUMS"
    ( cd "${TMP}" && ${SHATOOL} -c SHA256SUMS --ignore-missing >/dev/null ) \
        || die "checksum verification failed. Downloaded file is not the released one."
fi

# ------------------------------------------------------------------- unpack

case "${UNPACK}" in
    unzip) unzip -q "${TMP}/${ZIP_NAME}" -d "${DEST}" ;;
    bsdtar) tar -xf "${TMP}/${ZIP_NAME}" -C "${DEST}" ;;
esac

info "  unpacked to ${DEST%/}/nui-vault-${NUMBER}/"
info "  open it in Obsidian: Open folder as vault"
