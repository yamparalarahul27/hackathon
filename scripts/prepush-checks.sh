#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[pre-push] Running lint"
npm run lint

echo "[pre-push] Running typecheck"
npm run typecheck

echo "[pre-push] Running build"
npm run build

echo "[pre-push] Running runtime audit (high+)"
npm run audit:high

echo "[pre-push] All checks passed"
