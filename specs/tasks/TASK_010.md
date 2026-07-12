# Task 010 — Dashboard (backend)

## Objetivo

Endpoint de resumo operacional do dia com métricas para o tenant atual.

## Dependências

TASK_009

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- specs/tasks/TASK_010.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/**

## Critérios de aceite

- [x] GET /dashboard/summary com appointmentsToday, estimatedRevenue, occupancyRate
- [x] Baseado em agendamentos do tenant no dia UTC atual
- [x] DashboardController + DashboardService + testes
- [x] OpenAPI atualizado

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): adiciona dashboard summary

## Status

DONE
