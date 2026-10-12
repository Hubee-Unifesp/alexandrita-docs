---
sidebar_position: 3
---

# Modelo de permissões de organizador

## Status

Proposta para validação do time (GOL-110). Serve de
base para a história de vínculo com organizações e para a proteção de eventos e
despesas.

## Objetivo

Definir quem pode ler e editar o quê dentro de uma organização, usando as
colunas que `organization_users` já tem (`role`, `permission`, `invite_status`).

## Contexto

- Na data deste spike, as rotas de escrita exigem o `ADMIN` global
  (`@AdminOnly()`). Um organizador comum não consegue
  gerenciar o próprio evento.
- `organization_users` guarda `role` (`admin` | `member`), `permission`
  (`full` | `read_only`) e `invite_status` (`pending` | `accepted` |
  `rejected`), mas nenhuma regra os usa. No banco são `varchar(20)` livres; os
  valores só existem nos DTOs.
- O JWT só leva `sub`, `email` e o `role` global (`USER` | `ADMIN`).
- Criar uma organização não vincula o criador a ela.
- Um evento chega a uma organização por `events.organizer_id` e por
  `organization_events` (`main`, `co_organizer`, `supporter`). Despesas,
  tarefas e tipos de ingresso chegam à organização pelo `event_id`.
- `venues` e `suppliers` não têm organização. Pedidos e pagamentos pertencem
  ao comprador.

## Proposta

### Níveis de acesso

Só conta quem tem vínculo com `invite_status = 'accepted'`. Cada nível inclui
os anteriores.

| Nível    | Quem                              | Pode                                                    |
| -------- | --------------------------------- | ------------------------------------------------------- |
| `read`   | qualquer membro aceito            | ver organização, eventos, despesas e tarefas            |
| `write`  | `permission = full`               | criar, editar e excluir eventos, despesas, tarefas e tipos de ingresso |
| `manage` | `role = admin`                    | editar a organização, gerenciar membros, cancelar evento, vincular outras organizações |

- `permission` controla os dados; `role` controla a gestão da organização.
- `admin` sempre implica `write`. A combinação `admin` + `read_only` deve ser
  rejeitada no DTO.
- O `ADMIN` global continua passando em tudo, como hoje.

### Acesso pelo evento

O papel em `organization_events` limita o teto: `main` e `organizer_id` dão até
`manage`, `co_organizer` até `write`, `supporter` só `read`. O acesso efetivo é
o menor entre o nível do membro e o teto do vínculo; com mais de uma
organização, vale o maior.

### Rota × quem pode acessar

| Rota | Mínimo exigido |
| ---- | -------------- |
| `GET /events`, `GET /events/:id`, `GET /events/:eventId/ticket-types` | Público (rascunho exige `read`) |
| `POST /events` | `write` na organização do `organizerId` |
| `PATCH /events/:id` | `write` |
| `DELETE /events/:id` | `manage` |
| `/events/:eventId/expenses` | `read` (GET), `write` (demais) |
| `/events/:eventId/tasks` | `read` (GET), `write` (demais) |
| `POST/PATCH/DELETE /events/:eventId/ticket-types` | `write` |
| `GET /events/:eventId/organizations` | `read` |
| `POST/DELETE /events/:eventId/organizations` | `manage` da organização principal |
| `POST /organizations` | Logado (criador vira `admin`/`full`/`accepted`) |
| `GET /organizations` | Público (a home usa) |
| `PATCH/DELETE /organizations/:id` | `manage` |
| `GET /organizations/:orgId/users` | `read` |
| `POST /organizations/:orgId/users` | `manage` (cria `pending`) |
| `PATCH /organizations/:orgId/users/:userId` | `manage` para `role`/`permission`; o próprio convidado para `inviteStatus` |
| `DELETE /organizations/:orgId/users/:userId` | `manage`, ou o próprio usuário |
| `/suppliers`, `/venues` (escrita) | ADMIN até existir dono (ver pontos em aberto) |
| `/orders`, `/payments`, `/tickets` | Dono do pedido, fora deste modelo |

Regras do convite: só o convidado aceita ou recusa; ninguém altera a própria
linha; o último `admin` não pode ser removido nem rebaixado.

### Guard

Um `OrganizationAccessGuard` que roda depois do `JwtAuthGuard` e responde se o
usuário pertence à organização do recurso e com que nível. O decorator declara o
nível e de onde sai a organização:

```ts
@Get()
@OrgAccess('read', { from: 'event', param: 'eventId' })
findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {}

@Post()
@OrgAccess('write', { from: 'body', field: 'organizerId' })
create(@Body() dto: CreateEventDto) {}
```

O guard:

1. Deixa passar se a rota não tem `@OrgAccess` ou se o usuário é `ADMIN`.
2. Descobre a organização pelo `orgId` da rota, pelo evento (`organizer_id` +
   `organization_events`) ou pelo body.
3. Busca em `organization_users` o vínculo aceito do usuário.
4. Compara o nível efetivo com o exigido e lança `ForbiddenException` se for
   menor.

O vínculo é consultado no banco a cada requisição, não vai no JWT: o token dura
1 dia e convite aceito ou permissão alterada precisam valer na hora. A consulta
filtra por usuário, mas a chave primária começa por `organization_id`, então um
índice em `organization_users(user_id)` ajudaria. Os
services de despesas, tarefas e tipos de ingresso devem continuar filtrando por
`eventId` e `id` juntos; senão `/events/A/expenses/<id do evento B>` passa no
guard e devolve dado de outra organização.

## Alternativas consideradas

- **Papéis no JWT:** evita consulta, mas fica desatualizado até o token expirar.
- **Permissões granulares (`events:update`):** mais flexível, mas exagerado para
  dois eixos fixos.
- **Checagem em cada service:** repete a regra em vários módulos e é fácil
  esquecer uma rota.

## Pontos em aberto

1. `venues` e `suppliers` precisam de `organization_id`? Sem isso, o dado de uma
   organização é visível e editável por todas.
2. Quem faz check-in de ingresso: `read` ou `write`?
3. Excluir organização exige `manage` ou só o `representative_id`?
4. O `ADMIN` global pode editar dados de qualquer organização ou só ler?
