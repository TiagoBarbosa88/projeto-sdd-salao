# Task 007 — Frontend auth (Angular)

## Objetivo

Página de login, AuthService, interceptor JWT, guard de rotas e home com dados do usuário autenticado.

## Dependências

TASK_006

## Arquivos permitidos

- frontend/**
- specs/tasks/TASK_007.md
- specs/tasks/TASK_INDEX.md

## Arquivos proibidos

- backend/**

## Critérios de aceite

- [x] Página /login com formulário email/senha (Tailwind, tema escuro)
- [x] AuthService: login(), logout(), isAuthenticated(), token em localStorage
- [x] authInterceptor adiciona Authorization Bearer
- [x] authGuard protege rotas do shell (redirect /login)
- [x] /login público, rotas do shell protegidas
- [x] Home exibe info do usuário logado
- [x] Teste básico do login component

## Testes obrigatórios

```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

## Commit esperado

feat(frontend): adiciona login auth guard e interceptor

## Status

DONE
