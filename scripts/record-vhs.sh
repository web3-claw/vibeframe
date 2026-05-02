#!/usr/bin/env bash
#
# scripts/record-vhs.sh — Re-render the VHS demos in assets/demos/.
#
# Prerequisites (all macOS / Linux):
#   - vhs       — `brew install vhs` (macOS) or download from
#                 https://github.com/charmbracelet/vhs/releases (Linux)
#   - vibe      — `npm install -g @vibeframe/cli@latest`
#   - claude    — `claude` on PATH; Claude Code drives both recordings
#   - API keys required by DEMO-quickstart.md / DEMO-dogfood.md in env
#
# What it produces:
#   assets/demos/quickstart-claude-code.mp4 — public quickstart recording
#   assets/demos/dogfood-claude-code.mp4    — fuller contributor dogfood recording
#
# Both recordings make real provider calls. Set ONLY=quickstart or ONLY=dogfood
# to render one tape.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v vhs >/dev/null 2>&1; then
  echo "✗ vhs not found on PATH." >&2
  echo "  Install: brew install vhs   (or https://github.com/charmbracelet/vhs/releases)" >&2
  exit 1
fi

if ! command -v vibe >/dev/null 2>&1; then
  echo "✗ vibe not found on PATH." >&2
  echo "  Build locally: pnpm -F @vibeframe/cli build && export PATH=\$REPO_ROOT/packages/cli/dist:\$PATH" >&2
  echo "  Or install:    npm install -g @vibeframe/cli" >&2
  exit 1
fi

case "${ONLY:-all}" in
  quickstart)
    ALL_TAPES=("assets/demos/quickstart-claude-code.tape")
    ;;
  dogfood)
    ALL_TAPES=("assets/demos/dogfood-claude-code.tape")
    ;;
  all)
    ALL_TAPES=(
      "assets/demos/quickstart-claude-code.tape"
      "assets/demos/dogfood-claude-code.tape"
    )
    ;;
  *)
    echo "✗ ONLY must be one of: quickstart, dogfood, all" >&2
    exit 1
    ;;
esac

if ! command -v claude >/dev/null 2>&1; then
  echo "✗ claude not found on PATH." >&2
  echo "  Install Claude Code, or run the tape manually with a compatible host." >&2
  exit 1
fi

for tape in "${ALL_TAPES[@]}"; do
  echo "→ Recording $tape ..."
  vhs "$tape"
  echo
done

echo "✓ Done. Demos written under assets/demos/."
echo "  Review:"
ls -la assets/demos/*.mp4 2>/dev/null || echo "  (no demos produced — check the vhs output above)"
