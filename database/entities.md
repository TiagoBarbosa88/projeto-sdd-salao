# Entidades

Todas as entidades expõem `publicId` (UUID) na API. IDs numéricos são internos.

## Tenant

Representa um salão (tenant do sistema multi-tenant).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| publicId | UUID | Identificador público |
| name | String | Nome do salão |
| slug | String | URL amigável (único) |
| description | String | Descrição pública |
| phone | String | Telefone de contato |
| whatsapp | String | WhatsApp do salão |
| address | String | Endereço |
| logoUrl | String | URL do logo |
| seoTitle | String | Título SEO |
| seoDescription | String | Descrição SEO |
| seoImageUrl | String | Imagem Open Graph |
| active | Boolean | Tenant ativo |
| createdAt | OffsetDateTime | Criação |

## User

Usuário do sistema (pode pertencer a múltiplos tenants).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| publicId | UUID | Identificador público |
| email | String | Login (único) |
| passwordHash | String | Senha criptografada |
| name | String | Nome completo |
| active | Boolean | Usuário ativo |
| createdAt | OffsetDateTime | Criação |

## TenantUser

Associação usuário ↔ tenant com perfil.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| tenantId | Long | FK → Tenant |
| userId | Long | FK → User |
| role | Enum | ADMIN, PROFESSIONAL, CLIENT |

## Service

Serviço oferecido pelo salão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| publicId | UUID | Identificador público |
| tenantId | Long | FK → Tenant |
| name | String | Nome do serviço |
| description | String | Descrição |
| durationMinutes | Integer | Duração |
| price | BigDecimal | Preço |
| active | Boolean | Disponível para agendamento |

## Appointment

Agendamento de serviço.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| publicId | UUID | Identificador público |
| tenantId | Long | FK → Tenant |
| serviceId | Long | FK → Service |
| professionalId | Long | FK → User (profissional) |
| clientId | Long | FK → User (cliente, nullable para visitante) |
| guestName | String | Nome do visitante sem login |
| guestPhone | String | WhatsApp do visitante |
| bufferMinutes | Integer | Pausa aplicada após o atendimento |
| startAt | OffsetDateTime | Início |
| endAt | OffsetDateTime | Fim |
| status | Enum | SCHEDULED, CONFIRMED, CANCELLED, COMPLETED |
| createdAt | OffsetDateTime | Criação |

## TenantSchedulingSettings

Regras globais de agenda por tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| tenantId | Long | FK → Tenant (unique) |
| zoneId | String | Fuso horário (ex.: America/Sao_Paulo) |
| bufferMinutes | Integer | Pausa entre atendimentos |
| slotIntervalMinutes | Integer | Granularidade dos slots |
| dayStartTime | Time | Início do expediente público |
| dayEndTime | Time | Fim do expediente público |

## ProfessionalProfile

Perfil agendável vinculado a TenantUser (ADMIN ou PROFESSIONAL).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| publicId | UUID | Identificador público |
| tenantUserId | Long | FK → TenantUser |
| bookable | Boolean | Aceita agendamentos |
| phone | String | Contato interno |
| active | Boolean | Profissional ativo |

## ProfessionalWorkingPeriod

Horário semanal de trabalho (dayOfWeek 1=segunda … 7=domingo).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| publicId | UUID | Identificador público |
| tenantUserId | Long | FK → TenantUser |
| dayOfWeek | Integer | Dia da semana ISO |
| startTime | Time | Início |
| endTime | Time | Fim |

## ProfessionalBlockedPeriod

Férias, pausas ou bloqueios pontuais.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| publicId | UUID | Identificador público |
| tenantUserId | Long | FK → TenantUser |
| startAt | OffsetDateTime | Início |
| endAt | OffsetDateTime | Fim |
| reason | String | Motivo |
| blockType | Enum | VACATION, BREAK, OTHER |

## Relacionamentos

```
Tenant 1──N TenantUser N──1 User
Tenant 1──N Service
Tenant 1──N Appointment
Service 1──N Appointment
User (professional) 1──N Appointment
User (client) 1──N Appointment
Tenant 1──1 TenantSchedulingSettings
TenantUser 1──1 ProfessionalProfile
TenantUser 1──N ProfessionalWorkingPeriod
TenantUser 1──N ProfessionalBlockedPeriod
Tenant 1──N AuditLog
User (actor) 1──N AuditLog
```

## AuditLog

Registro de ações críticas para auditoria do tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Long | PK interna |
| publicId | UUID | Identificador público |
| tenantId | Long | FK → Tenant |
| actorUserId | Long | FK → User (nullable) |
| action | Enum | LOGIN, SERVICE_CREATED, SERVICE_UPDATED, SERVICE_DEACTIVATED, APPOINTMENT_CREATED, APPOINTMENT_CANCELLED |
| entityType | String | Tipo da entidade afetada |
| entityPublicId | UUID | ID público da entidade |
| metadata | String | Dados adicionais (texto) |
| createdAt | OffsetDateTime | Momento do evento |

## Índices sugeridos

- `tenant.slug` (unique)
- `user.email` (unique)
- `appointment(tenant_id, professional_id, start_at)` (conflito de agenda)
- `service(tenant_id, active)`
- `audit_log(tenant_id, created_at)` (consulta por tenant)
