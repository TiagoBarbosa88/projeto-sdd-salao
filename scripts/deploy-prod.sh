#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
COMPOSE_FILE="$ROOT/docker/docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo .env nao encontrado. Copie .env.example para .env e configure as variaveis."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config >/dev/null
echo "Compose validado."

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
echo "Stack de producao iniciada. Acesse http://localhost:${WEB_PORT:-80}"
