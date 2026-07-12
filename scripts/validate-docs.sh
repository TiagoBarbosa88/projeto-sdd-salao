#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIN_LINES=10

check_file() {
  local file="$1"
  local label="$2"

  if [[ ! -f "$file" ]]; then
    echo "FAIL: $label não encontrado ($file)"
    exit 1
  fi

  local lines
  lines=$(wc -l < "$file" | tr -d ' ')
  if [[ "$lines" -lt "$MIN_LINES" ]]; then
    echo "FAIL: $label com conteúdo insuficiente ($lines linhas, mínimo $MIN_LINES)"
    exit 1
  fi

  echo "OK: $label"
}

check_file "$ROOT/docs/vision.md" "docs/vision.md"
check_file "$ROOT/docs/prd.md" "docs/prd.md"
check_file "$ROOT/docs/architecture.md" "docs/architecture.md"
check_file "$ROOT/database/entities.md" "database/entities.md"
check_file "$ROOT/api/openapi.yaml" "api/openapi.yaml"

if ! grep -q "Salão SaaS" "$ROOT/api/openapi.yaml"; then
  echo "FAIL: api/openapi.yaml sem título esperado"
  exit 1
fi

echo "Todos os documentos base estão válidos."
