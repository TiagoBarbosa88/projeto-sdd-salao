# Task 016 — SEO + página pública

## Objetivo

Página pública por slug do tenant com meta tags e API read-only de serviços ativos.

## Dependências

TASK_015

## Arquivos permitidos

- backend/**
- frontend/**
- api/openapi.yaml
- specs/tasks/TASK_016.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- docker/** (reservado para TASK_018)

## Critérios de aceite

- [x] GET /public/tenants/{slug} e GET /public/tenants/{slug}/services (sem auth)
- [x] Rota frontend pública com title, description e og tags
- [x] Testes backend e frontend

## Testes obrigatórios

```bash
bash scripts/test-all.sh
```

## Commit esperado

feat: adiciona pagina publica com seo por tenant

## Status

DONE
