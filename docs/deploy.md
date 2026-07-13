# Deploy de producao

Guia para subir o Salao SaaS com Docker Compose em ambiente de producao ou staging.

## Pre-requisitos

- Docker Engine 24+ e Docker Compose v2
- Arquivo `.env` na raiz do repositorio (copie de `.env.example`)
- Porta `WEB_PORT` livre no host (padrao: 80)

## Variaveis obrigatorias

| Variavel | Descricao |
|----------|-----------|
| `POSTGRES_DB` | Nome do banco PostgreSQL |
| `POSTGRES_USER` | Usuario do banco |
| `POSTGRES_PASSWORD` | Senha forte do banco |
| `JWT_SECRET` | Segredo JWT com no minimo 32 caracteres |

## Subir stack

```bash
cp .env.example .env
# Edite .env com senhas reais

bash scripts/deploy-prod.sh
```

Ou manualmente:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
```

## Validar

- Frontend: `http://localhost/` (ou `WEB_PORT` configurada)
- API health: `http://localhost/api/v1/health`
- Actuator: `http://localhost/api/v1/actuator/health`

## Arquitetura

```
Browser -> nginx (web:80) -> Spring Boot (api:8080)
                          -> PostgreSQL (postgres:5432)
```

O container `web` serve o Angular e faz proxy de `/api/*` para o backend.
O PostgreSQL fica apenas na rede interna Docker.

## Operacao

Parar:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env down
```

Ver logs:

```bash
docker compose -f docker/docker-compose.prod.yml logs -f api web
```

Backup do banco (exemplo):

```bash
docker exec salao-postgres-prod pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

## Desenvolvimento local

Para desenvolvimento com hot reload, use o compose de dev apenas com PostgreSQL:

```bash
docker compose -f docker/docker-compose.yml up -d
bash scripts/mvn-java21.sh spring-boot:run
cd frontend && npm start
```

## WhatsApp

Em producao o adapter padrao e `mock` (log). Para integracao real com WhatsApp Business API,
implemente um bean `WhatsAppNotifier` alternativo e defina `SALAO_WHATSAPP_PROVIDER=api`.
