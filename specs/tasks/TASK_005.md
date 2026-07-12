# Task 005 — Auth JWT e schema de identidade

## Objetivo

Criar tabelas Tenant/User/TenantUser, endpoints de registro e login com JWT, e Spring Security configurado.

## Dependências

TASK_004

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- database/entities.md
- specs/tasks/TASK_005.md
- specs/tasks/TASK_INDEX.md

## Critérios de aceite

- [x] Migration V2 cria tenant, app_user, tenant_user
- [x] POST /auth/register cria salão + admin
- [x] POST /auth/login retorna JWT
- [x] Endpoints protegidos exigem Bearer token
- [x] DTOs expõem apenas UUID público
- [x] Testes passam com profile test

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(auth): adiciona registro login e jwt

## Status

DONE
