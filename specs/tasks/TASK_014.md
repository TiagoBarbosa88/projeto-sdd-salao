# Task 014 — Auditoria (backend)

## Objetivo

Registrar ações críticas do tenant e expor listagem para ADMIN via API.

## Dependências

TASK_013

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- database/entities.md
- specs/tasks/TASK_014.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/**

## Critérios de aceite

- [x] Flyway V5__audit_log.sql
- [x] Entity AuditLog, AuditAction enum
- [x] AuditService registra login, CRUD serviço, criar/cancelar agendamento
- [x] GET /audit-logs (ADMIN) com filtro opcional por action
- [x] Testes unitários e controller
- [x] OpenAPI e entities.md atualizados

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): adiciona audit log

## Status

DONE
