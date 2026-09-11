---
sidebar_position: 1
---

# Boas práticas de banco de dados — Hubee API

> Documento de referência para o time, focado em conceitos: o que é uma
> conexão, banco local vs. banco de produção, para que serve um ORM e como
> configurar as variáveis de ambiente do backend

## Índice

1. [O que é uma conexão com o banco](#1-o-que-é-uma-conexão-com-o-banco)
2. [Banco de dados local](#2-banco-de-dados-local)
3. [Banco de dados de produção](#3-banco-de-dados-de-produção)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [O que é um ORM — e por que usamos o Drizzle](#5-o-que-é-um-orm--e-por-que-usamos-o-drizzle)
6. [O que não fazer](#6-o-que-não-fazer)

---

## 1. O que é uma conexão com o banco

Um banco de dados é um programa separado da API (o Postgres), rodando em
outro processo — às vezes na mesma máquina, às vezes em outro servidor na
internet. Para a API conversar com ele, ela precisa abrir uma **conexão**:
uma "ligação" de rede autenticada, identificada por alguns dados básicos:

- **Host**: endereço onde o banco está rodando (`localhost`, ou um endereço
  na nuvem).
- **Porta**: em qual "porta" do host o Postgres está escutando (padrão
  `5432`).
- **Usuário e senha**: credenciais que autorizam o acesso.
- **Nome do banco**: um mesmo servidor Postgres pode hospedar vários bancos
  diferentes; o nome diz qual deles usar.

Abrir uma conexão nova para cada request seria lento (cada conexão exige uma
negociação de rede) e o Postgres tem um limite de conexões simultâneas. Por
isso a API mantém um **pool de conexões**: um conjunto pequeno de conexões já
abertas, que são reaproveitadas entre requests em vez de abrir/fechar uma a
cada chamada. Isso já está resolvido no código da API — o time só precisa
saber que existe e por que existe, não precisa mexer nisso no dia a dia.

## 2. Banco de dados local

O **banco local** é um Postgres rodando na sua própria máquina, usado
enquanto você desenvolve. Ele é independente do banco de produção: dados,
schema e eventuais erros ficam isolados no seu computador, sem afetar
ninguém. É simples de manipular e resetar e os dados contidos nele não importam
muito no escopo geral, por isso utilizamos esse banco local como seu "playground".

Na `hubee-api`, o banco local sobe via Docker (não precisa instalar Postgres
manualmente), so seguir o passo a passo caso ja tenha os requisitos instalados:

```bash
docker compose up -d
```

Isso cria um container Postgres com os dados já definidos em
`docker-compose.yml` do repositório (usuário, senha e nome do banco fixos
para desenvolvimento — não são segredos, são só valores padrão do ambiente
local). Para verificar que subiu:

```bash
docker compose ps
```

Para derrubar o banco local (os dados ficam guardados em um volume do
Docker, então religar preserva o que já existia):

```bash
docker compose down
```

Com o container no ar, falta apenas apontar a API para ele através das
variáveis de ambiente (seção 4) e aplicar as migrations:

```bash
npm run db:migrate
```

> Não existe "o banco de dev do time" compartilhado — cada pessoa sobe o seu
> próprio banco local. Pode derrubar, apagar o volume e recriar do zero sem
> medo, é descartável.

## 3. Banco de dados de produção

O **banco de produção** é o banco real, usado pela aplicação quando está no
ar para os usuários. No projeto, ele roda no [Neon](https://neon.tech), um
serviço de Postgres na nuvem.

Diferenças importantes em relação ao banco local:

- **Os dados são reais.** Um `DELETE` sem `WHERE`, um `DROP TABLE` ou uma
  migration mal escrita afeta o usuário de verdade, não só o seu ambiente.
- **É compartilhado.** Todo mundo que usa a aplicação em produção está
  apontando para o mesmo banco.
- **Exige conexão criptografada (TLS)**, diferente do banco local.
- **Acesso é restrito.** Credenciais de produção não circulam livremente —
  só quem precisa (ex.: pipeline de deploy) deve ter acesso.

Por isso, o fluxo de trabalho normal do dia a dia — criar tabela, testar
uma migration, rodar `db:push`, derrubar e recriar o banco — acontece
**sempre no banco local**, nunca direto em produção. Produção só recebe
migrations já testadas, através do processo de deploy.

## 4. Variáveis de ambiente

A API não tem nenhuma credencial de banco escrita no código. Em vez disso,
ela lê tudo de variáveis de ambiente, definidas em um arquivo `.env` (que
**não é commitado** — cada pessoa tem o seu, local).

Para começar, copie o modelo:

```bash
cp .env.example .env
```

O `.env.example` do repositório já vem com um bloco comentado para Neon e um
bloco ativo para o Postgres local (o que o `docker compose up -d` da seção 2
sobe). Variáveis usadas pela API:

| Variável      | Para que serve                                                | Valor local (Docker)     | Valor em produção (Neon)                        |
| ------------- | --------------------------------------------------------------- | ------------------------- | ------------------------------------------------- |
| `PORT`        | Porta em que a API sobe                                         | `3000`                    | definida pela plataforma de deploy                |
| `DB_HOST`     | Endereço do Postgres                                             | `localhost`                | host do endpoint Neon (ex.: `ep-xxxx-pooler...`)   |
| `DB_PORT`     | Porta do Postgres                                                | `5433` (mapeada no Docker)| porta informada pelo Neon                          |
| `DB_USER`     | Usuário do banco                                                 | `hubee`                    | usuário informado pelo Neon                        |
| `DB_PASSWORD` | Senha do banco                                                   | `hubee`                    | senha informada pelo Neon                          |
| `DB_NAME`     | Nome do banco (um Postgres pode ter vários)                     | `hubee`                    | nome do banco informado pelo Neon                  |
| `DB_SSL`      | Se a conexão exige TLS                                           | `false`                    | `true` (Neon exige)                                |

Como usar:

- **Desenvolvimento local:** deixe as 6 variáveis `DB_*` do bloco "Postgres
  local" ativas no seu `.env`, exatamente como vêm no `.env.example`. Não é
  preciso criar conta em lugar nenhum — é só rodar o Docker (seção 2).
- **Conexão com o Neon** (só quando realmente precisar validar algo contra o
  banco de produção/staging): comente o bloco local e preencha o bloco do
  Neon com os valores de **Dashboard → Connect → "Parameters only"** no
  [console do Neon](https://console.neon.tech). Lembre de trocar `DB_SSL`
  para `true`.
- **Nunca misture os dois blocos ativos ao mesmo tempo** — a API lê um único
  conjunto de `DB_*`.

A API valida essas variáveis assim que sobe: se alguma estiver faltando ou
inválida, ela **não inicia** e o erro no terminal diz exatamente qual
variável está com problema — isso é proposital, para nunca "subir cego" sem
saber a que banco está conectada.

## 5. O que é um ORM — e por que usamos o Drizzle

Um **ORM** (*Object-Relational Mapper*) é uma camada entre o código da
aplicação e o banco de dados relacional. Em vez de escrever SQL puro como
texto solto espalhado pelo código, você descreve tabelas e consultas usando
construções da própria linguagem (TypeScript, no nosso caso), e o ORM
traduz isso para SQL na hora de executar.

Isso traz alguns ganhos práticos:

- **Tipagem:** o compilador acusa erro se você tentar usar uma coluna que
  não existe, ou passar um tipo errado — antes mesmo de rodar o código.
- **Gestão de schema versionada:** o "formato" das tabelas fica descrito no
  código (schema), e mudanças nele viram *migrations* — arquivos versionados
  que registram, passo a passo, como o banco evoluiu ao longo do tempo.
- **Menos SQL manual repetido:** consultas comuns (buscar por id, filtrar,
  paginar, fazer join) têm uma API mais direta que escrever SQL cru toda
  vez, com menor risco de erro de digitação ou de esquecer de parametrizar
  um valor (o que abriria brecha para injeção de SQL).

O projeto usa o **[Drizzle ORM](https://orm.drizzle.team)**. Diferente de
ORMs mais "pesados", o Drizzle foi escolhido por ser mais próximo do SQL de
verdade (o que ele gera é bem previsível — importante para debugar) e por
rodar bem tanto contra um Postgres local quanto contra o Neon, sem mudar
código entre os dois ambientes.

No dia a dia, o Drizzle aparece através de comandos (`drizzle-kit`), rodados
com `npm run`:

| Comando | O que faz |
| --- | --- |
| `npm run db:generate` | Olha o schema atual e gera um arquivo `.sql` de migration com as mudanças |
| `npm run db:migrate` | Aplica as migrations pendentes no banco apontado pelo `.env` |
| `npm run db:push` | Sincroniza o schema direto no banco, sem gerar arquivo de migration — **só para experimentar no seu banco local**, nunca em banco compartilhado |
| `npm run db:studio` | Abre uma interface visual (no navegador) para olhar as tabelas e os dados do banco conectado |

Fluxo normal ao mudar uma tabela: editar o schema → `db:generate` (gera o
`.sql`) → conferir o `.sql` gerado → `db:migrate` no seu banco local para
testar → commitar o schema junto com a migration gerada → a migration é
aplicada em produção pelo processo de deploy, não manualmente.

## 6. O que não fazer

- **Não commitar o `.env`** nem colar credencial de banco em PR, mensagem ou
  print. O `.env` já está no `.gitignore` — mantenha assim.
- **Não rodar `db:push` contra o banco de produção** (nem contra qualquer
  banco compartilhado). Ele pula o histórico de migrations e pode alterar o
  schema sem deixar rastro do que mudou.
- **Não testar migration direto em produção.** Toda migration nova é
  aplicada primeiro no banco local; só depois de validada segue para
  produção pelo processo normal de deploy.
- **Não editar uma migration que já foi aplicada** em qualquer ambiente
  compartilhado (mesmo que seja só em staging). Se algo estiver errado, a
  correção é uma **migration nova**, não uma edição retroativa.
- **Não rodar comandos destrutivos "para testar"** (`DROP TABLE`,
  `DELETE` sem `WHERE`, `TRUNCATE`) apontando para produção — nem sem querer,
  confira sempre a que banco o seu `.env` está apontando antes de rodar
  qualquer comando de banco.
- **Não compartilhar a senha/credencial de produção** fora do necessário. Se
  uma credencial vazar (log, print, PR), ela deve ser trocada.
- **Não abrir conexão avulsa com o banco** fora do fluxo já existente da
  API (o pool de conexões). Scripts pontuais devem reaproveitar a mesma
  configuração de conexão da aplicação, não inventar uma nova.
