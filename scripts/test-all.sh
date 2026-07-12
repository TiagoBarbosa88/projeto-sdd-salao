#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/validate-docs.sh"
bash "$ROOT/scripts/mvn-java21.sh" -q test
cd "$ROOT/frontend" && npm test -- --watch=false --browsers=ChromeHeadless
echo "All Phase 1 tests passed."
