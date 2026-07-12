# Task 009 — Appointments (backend)

## Objetivo

Agendamentos com validação de conflito (RN01) e bloqueio de serviço inativo (RN02).

## Dependências

TASK_008

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- specs/tasks/TASK_009.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/**

## Critérios de aceite

- [x] Flyway V4__appointments.sql
- [x] Entity Appointment, AppointmentStatus enum
- [x] GET /appointments, POST /appointments, PATCH /appointments/{publicId}/cancel
- [x] RN01 conflito de agenda, RN02 serviço inativo bloqueado
- [x] ADMIN/PROFESSIONAL criam; CLIENT cria para si; listagem filtrada por role
- [x] Testes incluindo cenário de conflito
- [x] OpenAPI atualizado

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): adiciona agendamentos com validacao de conflito

## Status

DONE
