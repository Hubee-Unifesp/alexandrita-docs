---
sidebar_position: 1
---

# Introdução ao Backend

Esta seção reúne a documentação técnica do backend do projeto Hubee
(repositório [`hubee-api`](https://github.com/Hubee-Unifesp/hubee-api)):
arquitetura, APIs, integrações, decisões técnicas (ADRs) e guias de setup do
ambiente de desenvolvimento.

## Stack

- [Node.js](https://nodejs.org/) 20+ com [TypeScript](https://www.typescriptlang.org/).
- [NestJS 12](https://nestjs.com/) — framework, organizado em módulos por
  domínio.
- [PostgreSQL](https://www.postgresql.org/) — [Neon](https://neon.tech/) em
  produção, container Docker (`postgres:16-alpine`) em desenvolvimento local.
- [Drizzle ORM](https://orm.drizzle.team) sobre o driver `node-postgres` —
  mesmo client aponta tanto para Neon quanto para Postgres local, sem mudar
  código.
- [class-validator](https://github.com/typestack/class-validator) e
  [class-transformer](https://github.com/typestack/class-transformer) —
  validação e transformação de DTOs (`ValidationPipe` global com
  `whitelist`/`forbidNonWhitelisted`).
- [bcrypt](https://www.npmjs.com/package/bcrypt) — hashing de senhas.
- [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)
  — testes unitários e e2e.
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) + [Prettier](https://prettier.io/)
  — lint e formatação.
- [Husky](https://typicode.github.io/husky/) + [Commitlint](https://commitlint.js.org/)
  — hooks de commit no padrão [Conventional Commits](https://www.conventionalcommits.org/).

## Arquitetura

Aplicação NestJS organizada em módulos por domínio, cada um com seu
controller, service e (quando acessa dados) repository:

```
src/
  address/               # endereços
  fornecedores/          # fornecedores
  organizacao-usuarios/  # vínculo organização <-> usuários
  organization/          # organizações
  usuarios/              # usuários
  venue/                 # locais de evento
  health/                # healthcheck (GET /health)
  database/              # client Drizzle, schema e migrations
  config/                # validação das variáveis de ambiente no boot
```

O bootstrap (`src/main.ts`) habilita CORS (origens configuráveis via
`CORS_ORIGINS`), validação global de DTOs e shutdown hooks — para fechar o
pool de conexões do Postgres de forma limpa ao encerrar o processo.

## Banco de dados

- `src/database/schema/` — definição das tabelas (`index.ts` é o ponto de
  entrada lido pelo `drizzle-kit`).
- `src/database/migrations/` — migrations geradas.
- `src/database/database.module.ts` — módulo global que expõe o client pelo
  token `DRIZZLE`, injetável via `@Inject(DRIZZLE)`.

| Comando               | O que faz                                       |
| ---------------------- | ------------------------------------------------ |
| `npm run db:generate`  | Gera migrations a partir do schema               |
| `npm run db:migrate`   | Aplica as migrations pendentes no banco          |
| `npm run db:push`      | Sincroniza o schema direto no banco (só em dev)  |
| `npm run db:studio`    | Abre o Drizzle Studio para inspecionar os dados  |

O endpoint `GET /health` executa um `select 1` via Drizzle e retorna o status
da conexão com o banco (`200` com latência, ou `503` com o motivo da falha).

## Variáveis de ambiente

A aplicação valida as variáveis no boot: se alguma estiver faltando ou for
inválida, a API não sobe e o erro aponta qual é.

| Variável      | Descrição                                                   |
| ------------- | ------------------------------------------------------------ |
| `PORT`        | Porta da API (padrão `3000`)                                |
| `DB_HOST`     | Host do Postgres                                             |
| `DB_PORT`     | Porta do Postgres (padrão `5432`, `5433` no Docker Compose local) |
| `DB_USER`     | Usuário                                                       |
| `DB_PASSWORD` | Senha                                                         |
| `DB_NAME`     | Nome do banco                                                 |
| `DB_SSL`      | `true` para o Neon (exige TLS), `false` para Postgres local  |
| `CORS_ORIGINS`| Origens permitidas no CORS, separadas por vírgula            |

Veja [`.env.example`](https://github.com/Hubee-Unifesp/hubee-api/blob/main/.env.example)
no repositório do backend.

## Rodando localmente

```bash
# sobe um Postgres local em docker (porta 5433)
docker compose up -d

npm install
cp .env.example .env   # preencha os dados de conexão do banco
npm run start:dev
```

A API sobe em `http://localhost:3000`.

## Testes

```bash
npm run test       # unitários
npm run test:e2e   # end-to-end (Supertest)
npm run test:cov   # com cobertura
```

## Integração contínua

O workflow `Code Quality` (GitHub Actions) roda em todo push/PR para `main` e
`develop`: verificação do Prettier (`prettier --check`) e lint (`npm run
lint`, via oxlint).

## O que documentar aqui

- Contratos de API (endpoints, request/response, autenticação).
- Decisões técnicas relevantes e seus motivos (ADRs).
- Integrações com serviços externos.

## Exemplo de estrutura sugerida

```
docs/backend/
  intro.md
  arquitetura.md
  apis/
    autenticacao.md
    usuarios.md
  decisoes-tecnicas/
    2026-01-escolha-do-banco-de-dados.md
```
