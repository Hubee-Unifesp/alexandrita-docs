---
sidebar_position: 1
---

# Boas práticas de banco de dados — Hubee API

> **Nota:** as referências a arquivos de código (ex.: `src/venue`) apontam
> para o repositório da **Hubee API**, não para este repositório de
> documentação — abra-os a partir do repo da API.

> Documento de referência para o time. Consolida boas práticas de **conexão**,
> **uso do ORM**, **migrations**, **tratamento de erros**, **segurança** e
> **especificidades do Neon**, para padronizar o acesso a dados antes de
> espalhar o padrão pelo resto do código.
>
> Contexto: tasks GOL-43 (envs do banco) e GOL-38 (ORM). Stack atual:
> **NestJS 12 + Drizzle ORM (`drizzle-orm/node-postgres`) + `pg` (Pool) + Postgres 16**,
> Neon em nuvem e Postgres local via Docker.
>
> Formato final (Notion/wiki) a definir — este `.md` vive junto do código e pode
> ser colado onde o time decidir.

---

## Índice

1. [O que o código já acerta](#0-o-que-o-código-já-acerta)
2. [Gerenciamento de conexões](#1-gerenciamento-de-conexões)
3. [ORM e organização do acesso a dados](#2-orm-e-organização-do-acesso-a-dados)
4. [Migrations](#3-migrations)
5. [Tratamento de erros e timeouts](#4-tratamento-de-erros-e-timeouts)
6. [Segurança](#5-segurança)
7. [Especificidades do Neon](#6-especificidades-do-neon)
8. [Checklist de adoção](#7-checklist-de-adoção)
9. [Referências](#8-referências)

---

## 0. O que o código já acerta

Para não reinventar o que já está bom, o padrão atual **já segue** boas práticas
importantes — mantenha:

- **Camadas separadas**: `controller` (fino) → `service` (regra de negócio +
  transação) → `repository` (só query). Ver `src/venue` (repo da Hubee API).
- **Injeção do client por token** (`DRIZZLE`), com o `Pool` encapsulado no
  `DatabaseModule` global (`src/database/database.module.ts`).
- **Propagação de transação** via parâmetro `executor: DbExecutor = this.db` nos
  repositories — permite a mesma função rodar solta ou dentro de um
  `db.transaction(...)`. Ver `database.provider.ts` (`src/database/database.provider.ts`).
- **Validação de env no boot** (`env.validation.ts`, em `src/config/env.validation.ts`):
  a API não sobe sem conseguir falar com o banco.
- **`enableShutdownHooks()` + `onModuleDestroy` → `pool.end()`**: encerra o pool
  com elegância.
- **Healthcheck real** (`select 1` pelo ORM) em `/health` (`src/health`).
- **Constraints no banco** (`NOT NULL`, `CHECK max_capacity > 0`, FK com
  `ON DELETE restrict`) — a regra mora no banco, não só no DTO.

As seções abaixo são incrementos sobre essa base.

---

## 1. Gerenciamento de conexões

### 1.1 Sempre pool, nunca conexão avulsa

Abrir/fechar conexão por request é caro (TLS + auth ≈ dezenas de ms) e estoura o
limite do Postgres sob carga. Use **um único `Pool`** por processo (já é o caso).
Nunca instancie `new Client()` em handler de request.

### 1.2 Parâmetros do Pool — configurar explicitamente

O provider atual cria o `Pool` só com credenciais. Adicione limites e timeouts
explícitos (valores de partida para o porte do projeto; ajuste com métricas):

```ts
// src/database/database.provider.ts (evolução sugerida)
const pool = new Pool({
  host: config.get('DB_HOST', { infer: true }),
  port: config.get('DB_PORT', { infer: true }),
  user: config.get('DB_USER', { infer: true }),
  password: config.get('DB_PASSWORD', { infer: true }),
  database: config.get('DB_NAME', { infer: true }),
  ssl: config.get('DB_SSL', { infer: true })
    ? { rejectUnauthorized: true } // Neon usa cert publicamente confiável
    : false,

  // --- Tamanho do pool ---
  max: config.get('DB_POOL_MAX', { infer: true }) ?? 10, // conexões por instância da API
  min: 0, // deixe o Neon escalar a zero quando ocioso

  // --- Timeouts (ver seção 4) ---
  connectionTimeoutMillis: 10_000, // Neon pode ter cold start (~500ms+); seja generoso
  idleTimeoutMillis: 30_000, // fecha conexão ociosa
  statement_timeout: 15_000, // mata query que passar disso (server-side)
  query_timeout: 15_000, // idem, client-side
  idle_in_transaction_session_timeout: 30_000, // mata transação esquecida aberta

  // --- Higiene ---
  maxUses: 7_500, // recicla a conexão após N usos (bom com pooler/load balancer)
  allowExitOnIdle: false, // API long-running: mantenha; scripts CLI: true
});
```

**Como dimensionar `max`:** o limite do Postgres é compartilhado por *todas* as
instâncias da API + migrations + Drizzle Studio + qualquer script. Regra prática:
`max` por instância × nº de instâncias **< 80% do limite do endpoint direto**. No
Neon, prefira o **endpoint com pooler** (seção 6), que aceita até 10.000 clientes
e multiplexa — aí `max` pode ser baixo (5–10) sem risco. Fórmula clássica para o
teto útil de conexões *ativas* no Postgres: `(vCPUs × 2) + spindles`.

### 1.3 Servidor de longa duração vs. serverless

| Cenário | Driver | Estratégia |
| --- | --- | --- |
| **Deploy atual** (`@nestjs/mau` → container AWS de longa duração) | `pg` + `Pool` sobre TCP | **Padrão atual.** Pool persistente entre requests, apontando para o endpoint **pooled** do Neon. |
| Se migrar para Lambda / Cloud Functions | `pg` + `Pool`, `max` baixo (1–2), pool por invocação **ou** reaproveitado no escopo do módulo | Endpoint pooled obrigatório. |
| Se migrar para edge (Cloudflare Workers, Vercel Edge) | `@neondatabase/serverless` (HTTP/WebSocket) | `Pool`/`Client` criados e fechados **dentro do mesmo handler** — WebSocket não sobrevive ao request. |

Enquanto o deploy for container, **não precisamos** do driver serverless do Neon.
Trocar só se/quando o runtime mudar.

### 1.4 Cold start / scale-to-zero

O Neon suspende o compute quando ocioso; a primeira query depois disso paga o
"resume" (centenas de ms a ~alguns s). Consequências:

- `connectionTimeoutMillis` folgado (≥ 10 s), senão o primeiro request após
  ociosidade falha.
- **Não** crie polling artificial (healthcheck de 5 em 5 s, keepalive) só para
  "manter quente" — isso anula o scale-to-zero e gera custo. O `/health` deve ser
  chamado pelo orquestrador/monitor, não em loop pelo front.
- Retry para erro transitório de conexão na borda (seção 4.3) absorve o cold
  start sem estourar erro pro usuário.

### 1.5 Shutdown gracioso

Já implementado. Garanta que **todo** processo que abre pool feche:
scripts one-off devem usar `allowExitOnIdle: true` ou chamar `pool.end()` no
`finally`.

---

## 2. ORM e organização do acesso a dados

### 2.1 Papéis das camadas (contrato do time)

| Camada | Pode | Não pode |
| --- | --- | --- |
| **Controller** | Validar DTO, chamar 1 método de service, mapear resposta | Conhecer Drizzle, montar query, abrir transação |
| **Service** | Regra de negócio, orquestrar repositories, **abrir transações**, lançar `HttpException` (`NotFoundException`, `ConflictException`, ...) | SQL cru, `import` de `drizzle-orm/pg-core` |
| **Repository** | Montar/rodar query com Drizzle, aceitar `executor: DbExecutor`, devolver linhas/entidades | Lançar `HttpException`, decidir regra de negócio, chamar outro repository |

> Hoje o `VenueService` injeta `DRIZZLE` direto para abrir transação — **ok**,
> essa é a exceção permitida (service é o dono da transação). O resto do acesso a
> dados fica no repository.

### 2.2 Convenções de repository

- **Um repository por agregado** (`VenueRepository`, `AddressRepository`), no
  módulo da feature. Exporte o repository só se outro módulo precisar dele dentro
  de uma transação (hoje `AddressModule` exporta o *service*, que repassa o
  `executor` — mantenha esse padrão).
- **Assinatura padrão:** todo método recebe `executor: DbExecutor = this.db` como
  último parâmetro. Nunca use `this.db` direto no corpo se o método puder
  participar de transação.
- **Tipos vêm do schema:** `typeof venues.$inferInsert` / `$inferSelect`, nunca
  redefina o shape à mão.
- **Retorno cru do banco** (linha/relação). Conversão para formato de resposta é
  do service/controller.
- **`updatedAt` no update:** hoje é setado no app (`.set({ ...data, updatedAt: new Date() })`).
  Consistente — mantenha em **todos** os updates. (Alternativa futura: trigger
  `moddatetime` no banco; decidir em conjunto, não misturar.)

### 2.3 Transações

**Quando abrir:** sempre que uma operação escreve em **mais de uma tabela** e
elas precisam ser consistentes entre si (ex.: `VenueService.create` cria endereço
+ local). Também quando um "read-modify-write" precisa de atomicidade.

```ts
return this.db.transaction(async (tx) => {
  const addressId = await this.resolveAddress(dto, tx); // passa tx adiante
  return this.venueRepository.create({ ...dto, addressId }, tx);
});
```

Regras:

- **Passe o `tx` para todos os repositories** dentro do bloco. Esquecer = a query
  roda fora da transação (bug silencioso).
- **Transação curta.** Nada de chamada HTTP, envio de e-mail, leitura de arquivo
  ou `await` de coisa lenta dentro do bloco — segura conexão e pode dar
  `idle_in_transaction` timeout.
- **Validação/erro dentro do bloco** faz rollback automático (o `throw` do
  `NotFoundException` em `resolveAddressForUpdate` já se aproveita disso).
- **Aninhamento** (`tx.transaction(...)`) vira *savepoint* no Drizzle — funciona,
  mas evite depender disso; prefira um único nível.
- **Isolamento:** o default (`READ COMMITTED`) serve para quase tudo. Para
  contadores/estoque de ingressos sob concorrência, use
  `SELECT ... FOR UPDATE` (`.for('update')` no Drizzle) ou
  `db.transaction(fn, { isolationLevel: 'serializable' })` **com retry** em
  `40001` (seção 4.2).

### 2.4 Evitar N+1

Sintoma: um `findMany` seguido de um `for` que faz `findById` por item.

**Errado:**
```ts
const venues = await venueRepo.findAll(filters);
for (const v of venues) {
  v.address = await addressRepo.findById(v.addressId); // 1 + N queries
}
```

**Certo — join explícito** (padrão já usado em `VenueRepository.findAll`):
```ts
executor
  .select({ venue: venues, address: addresses })
  .from(venues)
  .innerJoin(addresses, eq(venues.addressId, addresses.id))
  .where(/* ... */);
```

**Certo — relational query** (padrão já usado em `VenueRepository.findById`):
```ts
executor.query.venues.findMany({
  with: { address: true }, // Drizzle resolve numa query só, sem N+1
  where: /* ... */,
});
```

**Certo — batch por chave** quando os IDs vêm de outro lugar:
```ts
import { inArray } from 'drizzle-orm';
const rows = await executor.select().from(addresses)
  .where(inArray(addresses.id, addressIds)); // 1 query para N ids
```

### 2.5 Paginação

Nenhum endpoint de listagem deve devolver tabela inteira. `VenueController.findAll`
já filtra, mas **não pagina** — adicionar antes de a base crescer.

- **Offset** (`.limit(n).offset(n*p)`): simples, ok para telas admin com poucas
  páginas. Fica lento em offset alto.
- **Keyset / cursor** (`where(gt(venues.createdAt, cursor)).orderBy(...).limit(n)`):
  preferível para feed público / scroll infinito. Escala bem.
- Sempre com `ORDER BY` **determinístico** (inclua uma coluna única como
  desempate, ex.: `createdAt, id`).

### 2.6 Índices

Toda coluna usada em `WHERE`, `JOIN` ou `ORDER BY` frequente precisa de índice.
Casos concretos hoje:

- **FKs**: `venues.address_id` — o Postgres **não** cria índice de FK
  automaticamente. Adicionar (agiliza join e o `ON DELETE restrict`).
- **`VenueRepository.findAll`** filtra `addresses.state` (`eq`) e `addresses.city`
  (`ilike`):
  - `state`: índice btree simples resolve.
  - `city` com `ILIKE 'texto'` (sem curinga): btree em `lower(city)` +
    comparar `lower(...)`, **ou** coluna `citext`. Se for evoluir para
    `ILIKE '%texto%'`, aí precisa de índice **GIN com `pg_trgm`**.

Declare índices **no schema do Drizzle** (`index()/uniqueIndex()` no
`pgTable`) e **nomeie você mesmo** — nome explícito torna migration e rollback
previsíveis. Para índice em produção sem lock, gere migration custom com
`CREATE INDEX CONCURRENTLY` (não roda dentro de transação → precisa de migration
dedicada; rodar pela conexão **direta**, não pelo pooler).

### 2.7 Prepared statements e o pooler

O driver `node-postgres` **não** usa prepared statements por padrão (só se você
chamar `.prepare()` no Drizzle). O PgBouncer do Neon roda em **transaction mode**,
que não suporta prepared statement fora de transação nem `LISTEN/NOTIFY` nem
tabela temporária entre queries. Conclusão prática:

- Não use `.prepare()` do Drizzle enquanto estivermos no endpoint pooled.
- `LISTEN/NOTIFY`, se um dia precisar, exige conexão **direta**.

### 2.8 Onde a regra mora

Prefira **constraint no banco** a validação só no app para invariantes de dados:
`NOT NULL`, `UNIQUE`, `CHECK`, FK. O DTO valida entrada do usuário; a constraint
garante integridade mesmo com bug/no script/na migration de dados. O projeto já
faz isso (`venues_max_capacity_positive`) — manter para todo invariante novo
(ex.: `UNIQUE` em e-mail de usuário, `CHECK` em datas de evento).

---

## 3. Migrations

### 3.1 `generate` (versionado) — nunca `push` no compartilhado

| Comando | Uso | Regra |
| --- | --- | --- |
| `npm run db:generate` | Gera arquivo SQL a partir do schema | **Sempre** para qualquer mudança que vá para `develop`/`main` |
| `npm run db:migrate` | Aplica migrations pendentes | Local, e no branch/ambiente via pipeline |
| `npm run db:push` | Sincroniza schema direto, sem arquivo | **Só** em branch de exploração pessoal e descartável. **Nunca** em banco compartilhado, staging ou produção — ele pula o histórico e pode omitir mudança silenciosamente |
| `npm run db:studio` | Inspeção | Local; fecha o processo depois (segura conexão) |

### 3.2 Nomenclatura

Passe `--name` — o nome aleatório (`0000_worthless_mach_iv`) não diz nada em PR:

```bash
npm run db:generate -- --name add_events_table
npm run db:generate -- --name venues_add_slug_unique_index
```

Formato: `verbo_alvo_detalhe`, minúsculo, sem data (o prefixo `NNNN` do Drizzle já
ordena). Uma migration = **uma intenção**.

### 3.3 Versionamento e review

- **Commitar sempre** o `.sql` **e** a pasta `src/database/migrations/meta/`
  (`_journal.json` + snapshot). Sem o meta, o Drizzle regenera errado.
- **Ler o SQL gerado no PR** antes de aprovar. Não confie cego — DDL destrutivo
  (drop de coluna, mudança de tipo, `NOT NULL` em tabela populada) aparece aqui.
- **Nunca editar uma migration já aplicada** em qualquer ambiente compartilhado.
  Correção = nova migration para frente.
- **Migration de schema e migration de dados separadas** quando possível (uma
  adiciona coluna nullable; outra faz backfill; outra torna `NOT NULL`).

### 3.4 Rollback

O Drizzle **não gera** arquivo de "down". Estratégia:

1. **Forward-only:** para reverter, escreva a migration inversa **como uma nova
   migration** (`drop` do que foi criado etc.). Teste no branch antes.
2. **Erro de dados** (deletou/atualizou errado): use **Point-in-Time Restore /
   branch do Neon** (seção 6), não SQL manual.
3. **Deploy quebrado:** o mais seguro é *roll forward* (corrigir e nova migration)
   + restore do Neon se houve corrupção de dados.
4. **Mudanças destrutivas** sempre testadas em branch/staging primeiro; de
   preferência em duas fases (deprecar → depois remover) para não quebrar a
   versão anterior da API durante o deploy.

### 3.5 Onde rodar

- **Aplicação de migration usa a conexão DIRETA** (endpoint sem `-pooler`), não o
  pooler — PgBouncer transaction mode quebra parte do DDL (`CREATE INDEX
  CONCURRENTLY`, etc.). Ver seção 6.2 para separar as duas URLs.
- **Não rodar migration no start da API** em produção (race entre instâncias).
  Rodar como **passo dedicado do pipeline** antes do deploy, ou manualmente.
- Local: `db:migrate` no fluxo normal; `db:push` só no seu branch de rascunho.

### 3.6 Seed

- Script idempotente (`ON CONFLICT DO NOTHING` / checagem antes de inserir),
  versionado em `src/database/seed/` (a criar).
- Seed de **dev** (dados de exemplo) ≠ seed de **produção** (dados de referência:
  categorias, estados). Separar.
- No Neon, semear o **branch pai** faz os branches filhos herdarem via
  copy-on-write — não precisa semear cada preview.

---

## 4. Tratamento de erros e timeouts

### 4.1 Timeouts recomendados

| Parâmetro | Onde | Valor inicial | Protege de |
| --- | --- | --- | --- |
| `connectionTimeoutMillis` | Pool | `10_000` | Esperar conexão para sempre (cold start do Neon) |
| `idleTimeoutMillis` | Pool | `30_000` | Conexão ociosa segurando slot |
| `statement_timeout` | Pool/servidor | `15_000` | Query travada consumindo CPU do banco |
| `query_timeout` | Pool/cliente | `15_000` | Cliente esperando resposta que não vem |
| `idle_in_transaction_session_timeout` | Pool/servidor | `30_000` | Transação aberta e esquecida (lock + slot) |
| HTTP request timeout (app) | Nest/infra | `30_000` | Request pendurado no cliente |

Ajustar por caso: relatório pesado pode ter `statement_timeout` maior num pool
separado; nunca "desligar" (`0`).

### 4.2 Mapa de erros do Postgres → resposta da API

Traduza `error.code` (SQLSTATE) para `HttpException` **no service** (ou num
filtro global). Nunca vaze o erro cru do driver pro cliente.

| SQLSTATE | Significado | Resposta sugerida |
| --- | --- | --- |
| `23505` | unique_violation | `409 ConflictException` ("registro já existe") |
| `23503` | foreign_key_violation | `409` ou `422` ("referência inválida / em uso") |
| `23502` | not_null_violation | `400 BadRequestException` (bug de DTO — logar) |
| `23514` | check_violation | `400`/`422` ("valor fora da regra") |
| `40001` | serialization_failure | **retry** (até N vezes, backoff); depois `409` |
| `40P01` | deadlock_detected | **retry**; depois `409` |
| `57014` | query_canceled (`statement_timeout`) | `503`/`504` ("tente novamente") + logar |
| `53300` | too_many_connections | `503` + alarme (pool/limite mal dimensionado) |
| `08006`/`08003`/`ECONNRESET`/`ETIMEDOUT`/`ENOTFOUND`/`ECONNREFUSED` | conexão caiu / DNS / recusada | **retry** transitório; depois `503` |
| `28P01` | senha inválida | `503` no boot + alarme (credencial errada) |
| `3D000` | banco inexistente | `503` no boot + alarme |

O `HealthService.describeError` já sabe que o Drizzle embrulha o erro do driver e
a causa real fica em `error.cause` — reaproveitar essa lógica no mapeamento.

### 4.3 Retry para erro transitório

Só para erros **idempotentes/transitórios** (`40001`, `40P01`, cold start,
`ECONNRESET`). Nunca para `23505` & cia.

```ts
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= tries || !isTransient(err)) throw err;
      await sleep(2 ** i * 100 + Math.random() * 100); // backoff + jitter
    }
  }
}
```

Envolva a **transação inteira**, não uma query isolada dela.

### 4.4 Erros de pool

Já existe `pool.on('error', ...)` logando conexão ociosa que caiu — **manter**.
Isso evita crash do processo por erro assíncrono de socket. Não jogar esse erro
pro usuário; é telemetria.

### 4.5 Healthcheck

`/health` faz `select 1` — bom. Recomendações:

- Endpoint separado de **liveness** (processo vivo) e **readiness** (banco
  responde). Só readiness toca o banco.
- Timeout curto próprio no healthcheck (ex.: 3 s) para não ficar pendurado.
- Não expor `error` do banco cru em ambiente público (hoje volta no corpo do
  503) — ok em dev/interno; considerar esconder detalhe em prod.

---

## 5. Segurança

### 5.1 Segredos e variáveis de ambiente

- `.env` está no `.gitignore` ✅. **Nunca** commitar `.env`, dump com credencial,
  connection string em código ou em log.
- `.env.example` só com chaves e valores **fake/placeholder** ✅.
- Em produção, segredo vem do **secret manager** da plataforma (variáveis do
  Mau/AWS), não de arquivo no container.
- Validar no boot (já feito) — falha explícita > subir cego.
- **Rotação:** senha do banco é rotacionável no Neon; trocar se vazar em log/PR.
  Evitar usuário único "dono de tudo" para toda a vida do projeto.
- Não colocar credencial em URL que vá pra log. Se migrar para
  `DATABASE_URL`, cuidado com libs que logam a config.

### 5.2 Least privilege — papéis do Postgres

Não usar o role "owner" do Neon (que cria/altera schema) para a **API em runtime**.
Separar:

| Role | Uso | Permissões |
| --- | --- | --- |
| `hubee_owner` (owner do Neon) | migrations, DDL, criação de roles | dono do schema |
| `hubee_app` | conexão da API em runtime | `CONNECT`, `USAGE` no schema, `SELECT/INSERT/UPDATE/DELETE` nas tabelas. **Sem** `CREATE`, sem `DROP`, sem `TRUNCATE` |
| `hubee_readonly` (opcional) | BI, dashboards, debugging | só `SELECT` |

```sql
-- rodado uma vez pelo owner
CREATE ROLE hubee_app LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE hubee TO hubee_app;
GRANT USAGE ON SCHEMA public TO hubee_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hubee_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hubee_app;
-- tabelas futuras herdam:
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hubee_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO hubee_app;
```

A API usa `DB_USER=hubee_app`; o `drizzle.config.ts`/pipeline de migration usa o
owner. (Se o plano do Neon não deixar criar role agora, registrar como dívida e
pelo menos **não** compartilhar a senha do owner fora do time.)

### 5.3 TLS

- Neon **exige** TLS. Usar `ssl: { rejectUnauthorized: true }` (verifica o
  certificado) em vez de `ssl: true` solto. Local sem SSL (`DB_SSL=false`) ✅.
- Não desabilitar verificação de certificado ("`rejectUnauthorized: false`") para
  "resolver" erro de TLS — isso abre para MITM.

### 5.4 Injeção de SQL

- Drizzle parametriza tudo por padrão — **manter o uso do query builder**.
- Ao usar a template tag `sql` do Drizzle, **interpolar valores como
  parâmetro**, nunca concatenar string:

  ```ts
  sql`... where id = ${id}`
  ```

  `sql.raw(...)` só para identificadores/DDL controlados pelo código, jamais
  com entrada de usuário.
- `ParseUUIDPipe` nos params de rota (já usado) barra lixo antes de chegar na
  query.

### 5.5 Dados sensíveis

- **Não logar linhas inteiras** do banco (`logger.debug(user)`), nem parâmetros de
  query em produção. Logar `id`/contexto, não o conteúdo.
- Desligar log verboso de SQL em produção. O `drizzle({ logger: true })` só em
  dev; se ligar em prod, garantir que não vai para log persistente com PII.
- PII (e-mail, telefone, documento, endereço) e segredo de pagamento: minimizar
  coluna, considerar hash/máscara quando não precisar do valor original, e
  **nunca** em URL, mensagem de erro ou evento de telemetria.
- Senha de usuário da plataforma: só hash forte (`argon2`/`bcrypt`), nunca
  reversível.
- `returning()` em `INSERT/UPDATE`: retornar só as colunas necessárias, não
  `*`, quando a tabela tiver campo sensível.

---

## 6. Especificidades do Neon

### 6.1 Endpoint pooled vs. direto

O Neon dá **dois hostnames** para o mesmo banco:

| Endpoint | Hostname | Usar para |
| --- | --- | --- |
| **Pooled** | `...-pooler.<region>.aws.neon.tech` | **Runtime da API** (todo tráfego normal). PgBouncer, até 10k clientes, pool interno ≈ 90% do `max_connections` |
| **Direto** | `...<region>.aws.neon.tech` (sem `-pooler`) | **Migrations**, `CREATE INDEX CONCURRENTLY`, scripts admin, `LISTEN/NOTIFY`, qualquer coisa com estado de sessão. Limitado a `max_connections` (100–4000 conforme compute) |

> `max_connections` escala com o **tamanho do compute**; o pooler interno é
> proporcional. Aumentar compute sozinho não resolve se o gargalo for
> `default_pool_size` — nesse caso é ticket pro suporte do Neon.

### 6.2 Duas URLs na config

Recomendação para GOL-43: além das vars atuais, separar host de runtime e host de
migration.

```dotenv
# App (runtime) — endpoint COM -pooler
DB_HOST=ep-xxxx-pooler.sa-east-1.aws.neon.tech
# Migrations / drizzle-kit — endpoint SEM -pooler
DB_HOST_DIRECT=ep-xxxx.sa-east-1.aws.neon.tech
DB_SSL=true
```

- `database.provider.ts` (API) → `DB_HOST`.
- `drizzle.config.ts` (migrations) → `DB_HOST_DIRECT` (com fallback para
  `DB_HOST` no local, onde os dois são iguais).
- Local com Docker: `DB_HOST=localhost`, `DB_HOST_DIRECT=localhost`, `DB_SSL=false`
  — nada muda.

(Alternativa: adotar `DATABASE_URL` + `DATABASE_URL_UNPOOLED`, que é o formato que
o Neon entrega pronto. Decidir em conjunto; o importante é **runtime no pooler,
migration no direto**.)

### 6.3 Branching — um banco por contexto

Branch no Neon é cópia copy-on-write instantânea e barata. Modelo sugerido:

| Branch | Origem | Vida | Uso |
| --- | --- | --- | --- |
| `main`/`production` | — | permanente | produção. Ninguém roda migration à mão aqui |
| `develop` | reset periódico de `production` | permanente | integração; pipeline aplica migrations aqui primeiro |
| `dev/<pessoa>` | `develop` | enquanto útil | cada dev tem o seu; quebrar sem medo, resetar do pai |
| `preview/pr-<n>` | `develop` | vida do PR | criado pelo CI ao abrir PR, **deletado no merge/close**. Roda as migrations do PR e os testes e2e contra dados realistas |
| `ci/<run-id>` | `develop` | vida do job | testes automatizados isolados; **expira**/é deletado ao fim |

Boas práticas de branching:

- **Efêmero de verdade:** setar **expiração automática** e deleção programática
  para `preview/*` e `ci/*` — senão acumula custo e ruído.
- **Testes em paralelo** (Jest/Playwright com workers): se todos batem no mesmo
  branch, disputam as mesmas linhas. Para isolamento real, **um branch por
  worker**, criado no início e deletado no fim.
- **Seed no pai** (`develop`): os filhos herdam via copy-on-write, custo/tempo de
  CI ficam constantes independadamente do nº de PRs.
- **Migration nova roda primeiro num branch** (o do PR), nunca direto em
  `production`.

### 6.4 Restore em vez de rollback manual

- **Point-in-Time Restore:** o Neon guarda histórico (retention conforme plano);
  dá para restaurar o banco para um instante antes do erro, ou criar um branch
  "naquele ponto" para inspecionar/extrair dados.
- Fluxo para incidente de dados: criar branch no timestamp bom → validar →
  promover / copiar dados. Não sair rodando `UPDATE` de correção às cegas em
  produção.

### 6.5 Custo / operação

- `min: 0` no pool + não fazer polling artificial → o compute do Neon **escala a
  zero** quando ocioso (economia). Aceitar o cold start ocasional (mitigado por
  timeout folgado + retry).
- Drizzle Studio e conexões de debug contam no limite — fechar quando não usar.
- Monitorar: nº de conexões ativas, tempo de query, taxa de `57014`/`53300`. Se
  aparecer `53300`, o `max` do pool × nº de instâncias está alto demais para o
  compute/endpoint.

---

## 7. Checklist de adoção

**Conexão**
- [ ] `Pool` com `max`, `min: 0`, `connectionTimeoutMillis`, `idleTimeoutMillis`,
      `statement_timeout`, `query_timeout`, `idle_in_transaction_session_timeout`,
      `maxUses` explícitos
- [ ] `ssl: { rejectUnauthorized: true }` quando `DB_SSL=true`
- [ ] API aponta para o endpoint **pooled** do Neon
- [ ] `pool.end()` garantido em todo processo (API já; scripts com `finally`)

**ORM / acesso a dados**
- [ ] Todo método de repository aceita `executor: DbExecutor = this.db`
- [ ] Nenhum `HttpException` em repository; transação só no service
- [ ] Zero `for` com query dentro — usar `join` / `with` / `inArray`
- [ ] Toda listagem paginada, com `ORDER BY` determinístico
- [ ] Índice para toda FK e toda coluna de filtro (`state`, `city`, ...)
- [ ] Sem `.prepare()` do Drizzle enquanto no pooler

**Migrations**
- [ ] Só `db:generate` + `db:migrate` no fluxo compartilhado; `db:push` só em branch pessoal
- [ ] `--name` descritivo em toda migration; uma intenção por arquivo
- [ ] `.sql` **e** `meta/` commitados; SQL revisado no PR
- [ ] Migration roda pela conexão **direta**, como passo de pipeline (não no boot da API)
- [ ] Reverter = nova migration para frente; dado corrompido = restore do Neon

**Erros / timeouts**
- [ ] Mapa SQLSTATE → `HttpException` no service ou filtro global
- [ ] `withRetry` só em erro transitório (`40001`, `40P01`, cold start, `ECONNRESET`), envolvendo a transação inteira
- [ ] `pool.on('error')` mantido
- [ ] `/health` só readiness toca o banco, com timeout próprio

**Segurança**
- [ ] `.env` fora do git; segredo de prod no secret manager
- [ ] Role `hubee_app` sem DDL para o runtime; owner só para migration
- [ ] Sem log de linha/parâmetro com PII; SQL logger só em dev
- [ ] Template tag `sql` sempre com valor parametrizado; `sql.raw` nunca com input de usuário

**Neon**
- [ ] `DB_HOST` (pooled) e `DB_HOST_DIRECT` (direto) separados
- [ ] Branch por dev, branch por PR (com expiração/deleção automática), seed no branch pai
- [ ] Migration nova validada em branch antes de `production`

---

## 8. Referências

- [Neon — Choosing your connection method](https://neon.com/docs/connect/choose-connection)
- [Neon — Connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon — Database branching workflow primer](https://neon.com/docs/get-started/workflow-primer)
- [Neon — Branching: one branch per preview / per test run](https://neon.com/branching/ci-preview-workflows)
- [Neon — Branching with preview environments (GitHub Actions)](https://neon.com/blog/branching-with-preview-environments)
- [Neon — Postgres roles: what to know before you begin](https://neon.com/blog/postgres-roles)
- [Neon — Point-in-time restore](https://neon.com/docs/introduction/point-in-time-restore)
- [Drizzle ORM — Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle Kit — overview](https://orm.drizzle.team/docs/kit-overview) · [`push`](https://orm.drizzle.team/docs/drizzle-kit-push)
- [Drizzle ORM — Performance / prepared statements](https://orm.drizzle.team/docs/perf-queries)
- [Drizzle with Local and Serverless Postgres (Neon)](https://neon.com/guides/drizzle-local-vercel)
- [Drizzle ORM PostgreSQL Best Practices Guide (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)
- [Drizzle Migrations Rollback — discussão oficial #1339](https://github.com/drizzle-team/drizzle-orm/discussions/1339)
- [node-postgres — Pooling](https://node-postgres.com/features/pooling)
- [PostgreSQL — Error Codes (SQLSTATE)](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [PostgreSQL — GRANT / least privilege](https://www.postgresql.org/docs/current/sql-grant.html)
