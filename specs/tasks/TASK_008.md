# Task 008 — Services CRUD (backend)

## Objetivo

CRUD de serviços do salão com isolamento por tenant e autorização ADMIN para mutações.

## Dependências

TASK_006

## Arquivos permitidos

- backend/**
- api/openapi.yaml
- specs/tasks/TASK_008.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- frontend/**

## Critérios de aceite

- [x] Flyway V3__services.sql com tabela service
- [x] Entity SalonService, repository, ServiceCatalogService, ServiceController
- [x] GET /services, GET /services/{publicId}, POST, PUT, DELETE (soft deactivate)
- [x] Tenant isolation via TenantContext
- [x] DTOs com UUID publicId, BigDecimal price
- [x] Apenas ADMIN pode criar/atualizar/deletar
- [x] Testes ServiceControllerTest e ServiceCatalogServiceTest
- [x] OpenAPI atualizado

## Testes obrigatórios

```bash
bash scripts/mvn-java21.sh test
```

## Commit esperado

feat(backend): adiciona crud de servicos

## Status

DONE
