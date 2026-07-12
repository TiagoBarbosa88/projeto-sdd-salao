# Task 001 — Documentação base do produto

## Objetivo

Definir a documentação fundamental do sistema de gestão de salões (visão, requisitos, arquitetura, entidades e contrato inicial da API) para habilitar as próximas tasks de implementação.

## Dependências

Nenhuma.

## Arquivos permitidos

- docs/vision.md
- docs/prd.md
- docs/architecture.md
- database/entities.md
- api/openapi.yaml
- scripts/validate-docs.sh
- specs/tasks/TASK_001.md

## Arquivos proibidos

- backend/**
- frontend/**
- docker/**
- Código de aplicação

## Critérios de aceite

- [x] docs/vision.md descreve visão, público, objetivos, diferenciais e roadmap.
- [x] docs/prd.md contém requisitos funcionais, não funcionais, regras de negócio e personas.
- [x] docs/architecture.md define stack, camadas, decisões técnicas e integrações.
- [x] database/entities.md modela entidades principais e relacionamentos.
- [x] api/openapi.yaml contém metadados, servidores e estrutura inicial (sem endpoints implementados).
- [x] scripts/validate-docs.sh valida presença e conteúdo mínimo dos arquivos.

## Testes obrigatórios

```bash
bash scripts/validate-docs.sh
```

## Commit esperado

docs: define documentacao base do produto

## Status

DONE
