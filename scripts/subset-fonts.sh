#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FONT_DIR="${REPO_ROOT}/cast_bootstrap5/static/cast_bootstrap5/fonts"
UNICODE_RANGE="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"

if ! command -v pyftsubset &>/dev/null; then
  echo "Error: pyftsubset not found. Install with: pip install fonttools brotli" >&2
  exit 1
fi

for FONT in Inter-Variable Inter-Variable-Italic JetBrainsMono-Variable JetBrainsMono-Variable-Italic; do
  if [[ ! -f "${FONT_DIR}/${FONT}.woff2" ]]; then
    echo "Error: ${FONT_DIR}/${FONT}.woff2 not found" >&2
    exit 1
  fi
done

for FONT in Inter-Variable Inter-Variable-Italic JetBrainsMono-Variable JetBrainsMono-Variable-Italic; do
  echo "Subsetting ${FONT}..."
  pyftsubset "${FONT_DIR}/${FONT}.woff2" \
    --unicodes="${UNICODE_RANGE}" \
    --output-file="${FONT_DIR}/${FONT}.woff2" \
    --flavor=woff2
done

echo "Done. New sizes:"
ls -lh "${FONT_DIR}"/*.woff2
