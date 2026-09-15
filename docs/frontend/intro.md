---
sidebar_position: 1
---

# Introdução ao Frontend

Esta seção reúne a documentação técnica do frontend do projeto Hubee
(repositório [`hubee-webpage`](https://github.com/Hubee-Unifesp/hubee-webpage)):
arquitetura, padrões de UI, decisões técnicas e guias de setup.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) — framework React com
  renderização no servidor.
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/) — estilização utility-first.
- [Axios](https://axios-http.com/) — cliente HTTP para consumir a
  [API do Hubee](../backend/intro.md).
- [ESLint](https://eslint.org/) (`eslint-config-next`) — lint de código.
- [Husky](https://typicode.github.io/husky/) + [Commitlint](https://commitlint.js.org/)
  — hooks de commit para garantir mensagens no padrão
  [Conventional Commits](https://www.conventionalcommits.org/).

> Testes automatizados ainda não estão configurados no projeto (`test:ci` é
> um placeholder por enquanto).

## Estrutura do projeto

```
src/
  app/          # rotas e páginas (Next.js App Router)
  hooks/        # hooks React reutilizáveis (ex.: useHealthCheck)
  lib/api/      # cliente HTTP e chamadas à API (client.ts, health.ts)
```

## Variáveis de ambiente

| Variável              | Descrição                                                      |
| ---------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL base da [Hubee API](../backend/intro.md). Local: `http://localhost:3000`. |

Veja [`.env.example`](https://github.com/Hubee-Unifesp/hubee-webpage/blob/main/.env.example)
no repositório do frontend.

## Rodando localmente

```bash
npm install
npm run dev
```

Por padrão sobe em `http://localhost:3000`, mas como a
[API](../backend/intro.md) já usa essa porta, ao rodar os dois ao mesmo tempo
o Next.js migra automaticamente para `http://localhost:3001` (porta também
liberada por padrão no CORS da API). A aplicação consome a API configurada em
`NEXT_PUBLIC_API_URL`.

## Integração contínua

O workflow `Frontend CI` (GitHub Actions) roda em todo push/PR para `main` e
`develop`: lint (`npm run lint`), testes (`npm run test:ci`) e build
(`npm run build`).

## O que documentar aqui

- Arquitetura geral do frontend (rotas, gerenciamento de estado, camada de
  dados).
- Padrões de componentes e design system.
- Decisões técnicas relevantes e seus motivos (ADRs).
- Convenções de código e boas práticas.

## Exemplo de estrutura sugerida

```
docs/frontend/
  intro.md
  arquitetura.md
  design-system.md
  decisoes-tecnicas/
    2026-01-escolha-do-framework.md
```
