# Task 015 — Auditoria (UI)

## Objetivo

Tela admin listando eventos de auditoria com filtro por ação.

## Dependências

TASK_014

## Arquivos permitidos

- frontend/**
- specs/tasks/TASK_015.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- backend/** (salvo ajuste mínimo de contrato se necessário)

## Critérios de aceite

- [ ] Rota /audit acessível para ADMIN
- [ ] Lista eventos com ação, entidade, ator e data
- [ ] Filtro por tipo de ação
- [ ] Testes de componente

## Testes obrigatórios

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

## Commit esperado

feat(frontend): adiciona tela de auditoria

## Status

TODO
