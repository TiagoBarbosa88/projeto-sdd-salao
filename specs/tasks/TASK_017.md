# Task 017 — WhatsApp

## Objetivo

Adapter de notificações WhatsApp com implementação mock/dev e disparo em confirmação/lembrete de agendamento.

## Dependências

TASK_016

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- specs/tasks/TASK_017.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/** (salvo config placeholder)

## Critérios de aceite

- [ ] Interface WhatsAppNotifier + MockWhatsAppNotifier
- [ ] Disparo ao criar/confirmar agendamento (dev log)
- [ ] Config por tenant (placeholder em tenant ou properties)
- [ ] Testes do adapter e integração mínima

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): adiciona notificacoes whatsapp mock

## Status

TODO
