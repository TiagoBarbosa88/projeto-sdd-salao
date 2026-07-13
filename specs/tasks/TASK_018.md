# Task 018 — Deploy

## Objetivo

Containerização de produção e documentação de deploy.

## Dependências

TASK_017

## Arquivos permitidos

- docker/**
- backend/**
- frontend/**
- scripts/**
- docs/**
- specs/tasks/TASK_018.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- specs/tasks/TASK_014.md a TASK_017.md

## Critérios de aceite

- [x] Dockerfile backend e frontend
- [x] docker-compose.prod.yml
- [x] .env.example com variáveis documentadas
- [x] Script ou doc de deploy em docs/

## Testes obrigatórios

```bash
bash scripts/test-all.sh
docker compose -f docker/docker-compose.prod.yml config
```

## Commit esperado

chore(infra): adiciona deploy docker de producao

## Status

DONE
