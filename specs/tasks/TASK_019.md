# Task 019 — Configuracao e disponibilidade (backend)

## Objetivo

Modelo de dados e APIs para perfil do salao/SEO, profissionais agendaveis, horarios semanais, ferias/bloqueios, pausa entre atendimentos e calculo de slots livres.

## Dependencias

TASK_016

## Arquivos permitidos

- backend/**
- database/**
- api/openapi.yaml
- docs/prd.md
- specs/tasks/**

## Critérios de aceite

- [ ] Migration V6 com perfil tenant, settings, agenda profissional e guest booking
- [ ] APIs autenticadas de configuracao e disponibilidade
- [ ] Validacao de conflitos com pausa e horario comercial 09:00-22:00
- [ ] Testes backend

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): configuracao do salao e motor de disponibilidade

## Status

DONE
