# SDD Cursor Starter Kit — Salão SaaS

Fluxo obrigatório:

1. Ler START_HERE.md
2. Ler PROJECT_RULES.md
3. Ler docs/vision.md
4. Ler docs/prd.md
5. Ler docs/architecture.md
6. Ler database/entities.md
7. Ler api/openapi.yaml
8. Ler specs/tasks/MASTER_WORKFLOW.md
9. Executar somente a próxima task pendente.

Nunca implemente funcionalidades fora da task atual.

## Fase 1 (concluida)

- Docker PostgreSQL: `bash scripts/infra-health.sh`
- Backend: `bash scripts/mvn-java21.sh spring-boot:run`
- Frontend: `cd frontend && npm start`
- Testes: `bash scripts/test-all.sh`
