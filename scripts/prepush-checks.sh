#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[pre-push] Verifying lockfile sync (npm ci --dry-run)"
npm ci --dry-run --ignore-scripts 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "[pre-push] FAILED: package-lock.json is out of sync. Run 'npm install' to fix."
  exit 1
fi

echo "[pre-push] Running lint"
npm run lint

echo "[pre-push] Running typecheck"
npm run typecheck

echo "[pre-push] Running build"
npm run build

echo "[pre-push] Running runtime advisory gate"
npm run audit:gate

echo "[pre-push] All checks passed"
