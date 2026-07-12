# PRD — Salão SaaS

## Personas

### Marina — Dona do salão
Precisa ver agenda do dia, faturamento e desempenho dos profissionais.

### Carla — Profissional
Consulta sua agenda, bloqueia horários e registra atendimentos.

### Lucas — Cliente
Agenda serviços online, recebe confirmações e remarca quando necessário.

## Requisitos funcionais

### RF01 — Multi-tenant
Cada salão possui dados isolados por tenant. Usuários pertencem a um ou mais tenants.

### RF02 — Autenticação e autorização
Login com JWT. Perfis: ADMIN (dono), PROFESSIONAL, CLIENT.

### RF03 — Cadastro de serviços
CRUD de serviços com nome, descrição, duração, preço e status ativo/inativo.

### RF04 — Agenda
Agendamentos vinculados a profissional, serviço, cliente e horário. Validação de conflitos.

### RF05 — Dashboard
Métricas: agendamentos do dia, receita estimada, taxa de ocupação.

### RF06 — Página pública e agendamento visitante
URL por tenant (`/` no ambiente local e `/s/:slug`) com SEO configurável. Visitante escolhe serviço, profissional, data/horário e confirma com nome + WhatsApp sem login. Painel autenticado em `/app`.

### RF07 — Configurações do salão
ADMIN gerencia salão/SEO, profissionais agendáveis, horários semanais, pausa entre atendimentos, bloqueios e férias.

### RF08 — WhatsApp (futuro)
Envio de confirmação e lembrete de agendamento.

## Requisitos não funcionais

- **RNF01**: API REST documentada em OpenAPI 3.
- **RNF02**: UUID público em todas as entidades expostas; IDs internos nunca expostos.
- **RNF03**: Valores monetários com BigDecimal; datas com OffsetDateTime (UTC).
- **RNF04**: Cobertura de testes em regras de negócio críticas.
- **RNF05**: Containerização com Docker para desenvolvimento e deploy.

## Regras de negócio

- RN01: Um agendamento não pode sobrepor outro do mesmo profissional.
- RN02: Serviço inativo não pode ser agendado.
- RN03: Apenas ADMIN pode gerenciar profissionais e configurações do tenant.
- RN04: Cliente só visualiza e gerencia seus próprios agendamentos.
- RN05: Cancelamento deve respeitar antecedência mínima configurável pelo tenant.
- RN06: Slots públicos respeitam duração do serviço + pausa, horário do profissional e bloqueios entre 09:00 e 22:00 (America/Sao_Paulo).
- RN07: Agendamento visitante revalida disponibilidade no backend; conflito retorna erro amigável.
- RN08: Dados internos (telefone/e-mail de profissionais) não são expostos na API pública.
