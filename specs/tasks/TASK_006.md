# Task 006 — Multi-tenant context (backend)

## Objetivo

Expor contexto de tenant por requisição autenticada e endpoint GET /auth/me com usuário, tenant e role.

## Dependências

TASK_005

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- specs/tasks/TASK_006.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/**

## Critérios de aceite

- [x] TenantContext (ThreadLocal UUID tenantPublicId)
- [x] JwtAuthenticationFilter define tenant a partir do JWT
- [x] JWT inclui tenantPublicId e role
- [x] GET /auth/me retorna user + tenant + role (UUID público)
- [x] /auth/me exige Bearer token
- [x] Testes com e sem token passam

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(auth): adiciona contexto multi-tenant e endpoint me

## Status

DONE
