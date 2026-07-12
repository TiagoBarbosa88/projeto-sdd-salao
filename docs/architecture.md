# Arquitetura — Salão SaaS

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Angular 20, Tailwind CSS |
| Backend | Java 21, Spring Boot 3 |
| Banco | PostgreSQL 16 |
| Migrações | Flyway |
| Auth | JWT (Spring Security) |
| Infra | Docker, Docker Compose |
| API | REST + OpenAPI 3 |

## Estrutura de pastas

```
template-salao/
├── backend/          # API Spring Boot
├── frontend/         # SPA Angular
├── docker/           # Compose e configs
├── api/              # Contrato OpenAPI (fonte da verdade)
├── database/         # Modelagem documentada
├── docs/             # Visão, PRD, arquitetura
└── specs/tasks/      # Tasks incrementais
```

## Camadas backend

```
Controller → Service → Repository → Entity
              ↓
            DTO (request/response com UUID público)
```

## Decisões técnicas

| Decisão | Justificativa |
|---------|---------------|
| UUID público | Evita exposição de IDs sequenciais e facilita integrações |
| Multi-tenant por coluna `tenant_id` | Simplicidade inicial; evolução para schema por tenant se necessário |
| OpenAPI como contrato | Frontend e backend alinhados desde o início |
| Flyway | Versionamento explícito do schema |
| DTOs obrigatórios | Separação entre modelo de persistência e API |

## Integrações (fases futuras)

- **WhatsApp Business API**: confirmações e lembretes.
- **Gateway de pagamento**: reserva com sinal (fase posterior).
- **CDN/SEO**: páginas públicas por tenant.

## Ambientes

| Ambiente | Descrição |
|----------|-----------|
| local | Docker Compose com PostgreSQL + hot reload |
| staging | Deploy automatizado para validação |
| production | Deploy com variáveis seguras e backups |
