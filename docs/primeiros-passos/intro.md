---
sidebar_position: 1
---

# O que você precisa fazer para começar

Guia rápido para quem está começando agora: o que instalar, quais
repositórios existem e como colocar os três projetos rodando localmente
antes da primeira tarefa.

## 1. Os repositórios do projeto

O Hubee é dividido em três repositórios:

| Repositório       | Stack                                    | O que é                                    |
| ------------------ | ----------------------------------------- | -------------------------------------------- |
| `hubee-api`         | Node.js, TypeScript, NestJS, Drizzle, PostgreSQL | API que sustenta a plataforma                |
| `hubee-webpage`     | Next.js, React, TypeScript, Tailwind CSS    | Site/página web do Hubee                     |
| `alexandrita-docs`  | Docusaurus                                | Este site — a documentação do time           |

Você provavelmente vai precisar dos três: `alexandrita-docs` para consultar
regras e decisões enquanto desenvolve, além de documentar, e `hubee-api`/`hubee-webpage` conforme
a frente em que estiver atuando.

## 2. Pré-requisitos

- Conta no GitHub com acesso aos repositórios do time — peça para alguém já
  no projeto te adicionar antes de tentar clonar se você não tiver acesso.
- [Node.js](https://nodejs.org/) 20 ou superior, com `npm`.
- [Git](https://git-scm.com/).
- [Docker](https://www.docker.com/) — usado pelo `hubee-api` para subir o
  Postgres local (não precisa instalar Postgres manualmente).

## 3. Clonando e rodando cada projeto

Sugiro ter uma pasta dedicana no seu computador para abrigar os repositórios
a fim de manter a organização, como por exemplo:
`Repos/Hubee`

### `hubee-api`

```bash
git clone https://github.com/Hubee-Unifesp/hubee-api.git
cd hubee-api
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run start:dev
```

A API sobe em `http://localhost:3000`. Confirme que subiu e que a conexão
com o banco está saudável:

```bash
curl http://localhost:3000/health
```

Para entender o que cada uma dessas variáveis/comandos faz de verdade (o
que é o banco local, para que serve o Drizzle, o que não fazer), veja
[Boas práticas de banco de dados](../boas-praticas-guias/boas-praticas-banco-de-dados.md).

**(Opcional) Consultando o banco com o DBeaver**

Se quiser olhar as tabelas/dados sem passar pelo Drizzle Studio
(`npm run db:studio`), dá pra conectar o Postgres local em qualquer cliente
visual, como o [DBeaver](https://dbeaver.io/) (gratuito). Com o
`docker compose up -d` rodando, use os dados do `docker-compose.yml`:

| Campo    | Valor       |
| -------- | ----------- |
| Host     | `localhost` |
| Porta    | `5433`      |
| Banco    | `hubee`     |
| Usuário  | `hubee`     |
| Senha    | `hubee`     |

### `hubee-webpage`

```bash
git clone https://github.com/Hubee-Unifesp/hubee-webpage.git
cd hubee-webpage
npm install
npm run dev
```

Abre em `http://localhost:3000` (se a API estiver rodando ao mesmo tempo,
suba em portas diferentes ou um serviço de cada vez).

### `alexandrita-docs` (este site)

```bash
git clone https://github.com/Hubee-Unifesp/alexandrita-docs.git
cd alexandrita-docs
npm install
npm start
```

Veja [CONTRIBUTING.md](https://github.com/Hubee-Unifesp/alexandrita-docs/blob/main/CONTRIBUTING.md)
do repositório para o passo a passo de como adicionar ou editar páginas.

## 4. Fluxo de trabalho e padrão de commits

Nos repositórios de código (`hubee-api` e `hubee-webpage`):

- **Branches** partem de `develop` e seguem o padrão
  `tipo/GOL-N-slug-curto`, por exemplo `feature/GOL-42-login`. O `N` é o
  número da tarefa no board do time (prefixo `GOL`) — pegue sua tarefa lá
  antes de começar a codar.
- **Commits** seguem o padrão `tipo(GOL-N): mensagem curta`, por exemplo
  `feat(GOL-42): adiciona validação de login`. Isso é validado
  automaticamente pelo commitlint (hook `commit-msg` do Husky) — um commit
  fora do padrão é bloqueado. O `tipo` segue a convenção de
  [Conventional Commits](https://www.conventionalcommits.org/); os mais
  usados no dia a dia são:

  | Tipo       | Quando usar                                                        |
  | ---------- | -------------------------------------------------------------------- |
  | `feat`     | Nova funcionalidade                                                 |
  | `fix`      | Correção de bug                                                     |
  | `chore`    | Tarefa de manutenção que não muda código de produção (configs, deps, build) |
  | `refactor` | Mudança na estrutura do código sem alterar comportamento             |
  | `docs`     | Mudança só de documentação                                          |
  | `test`     | Criação/ajuste de testes                                            |
  | `style`    | Formatação (espaço, ponto e vírgula, etc.), sem mudar lógica         |
- Antes do `push`, o Husky roda `npm run lint` automaticamente (hook
  `pre-push`).
- Abra um Pull Request para `develop` e peça revisão; só depois de
  aprovado faz o merge. `main` reflete o que está em produção.

## 5. Onde encontrar o resto da documentação

Depois do ambiente no ar, o resto do conhecimento do time está organizado
por categoria neste site:

- [Boas Práticas e Guias](../boas-praticas-guias/boas-praticas-banco-de-dados.md) — o primeiro lugar para procurar antes de perguntar no chat.
- [Backend](../backend/intro.md) — arquitetura, APIs e decisões técnicas.
- [Frontend](../frontend/intro.md) — arquitetura, componentes e padrões de UI.
- [Infra](../infra/intro.md) — ambientes, deploy, monitoramento e operação.
- [Regras de Negócio](../regras-negocio/intro.md) — regras, fluxos e decisões de produto.
- [Spikes](../spikes/intro.md) — investigações técnicas e sessões de estudo.

## 6. Checklist rápido

- [ ] Tenho acesso aos repositórios do time no GitHub.
- [ ] Node 20+, Docker e Git instalados.
- [ ] `hubee-api` rodando localmente e `/health` respondendo `status: ok`.
- [ ] `hubee-webpage` rodando localmente.
- [ ] `alexandrita-docs` (este site) rodando localmente.
- [ ] Entendi o padrão de branch/commit (`GOL-N`) e sei onde fica o board de tarefas do time.
