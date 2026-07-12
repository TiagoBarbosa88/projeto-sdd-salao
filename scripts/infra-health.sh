#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose.yml"
if [[ ! -f "$COMPOSE_FILE" ]]; then echo "FAIL: compose not found"; exit 1; fi
if ! docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q salao-postgres; then
  docker compose -f "$COMPOSE_FILE" up -d
fi
for _ in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U salao -d salao >/dev/null 2>&1; then
    echo "OK: PostgreSQL saudavel"; exit 0
  fi
  sleep 2
done
echo "FAIL: timeout"; exit 1
