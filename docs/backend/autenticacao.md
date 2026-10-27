---
sidebar_position: 3
title: Autenticação e cadastro
description: Cadastro, login, dados do usuário logado e autorização por papel global e por organização na hubee-api.
---

# Autenticação e cadastro

A API permite criar uma conta com nome completo, e-mail e senha e entrar
imediatamente. A intenção de comprar ou organizar eventos é separada do papel de
acesso: escolher organizar não concede permissões de administrador nem de
organizador. As permissões de organizador vêm do vínculo com uma organização
(veja [Autorização por organização](#autorização-por-organização)).

## Configuração

No `.env` do repositório `hubee-api`, configure `JWT_SECRET` com um segredo
forte. A variável já consta no `.env.example` e é obrigatória no início da
aplicação. Não versione o segredo real.

```dotenv
JWT_SECRET=troque-por-um-segredo-forte
```

Os tokens são assinados com esse segredo e expiram em um dia. As requisições
protegidas devem enviar o token no cabeçalho:

```http
Authorization: Bearer <access_token>
```

## Cadastro: `POST /auth/register`

O cadastro aceita os seguintes campos:

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `fullName` | Sim | Nome completo com até 200 caracteres; espaços nas extremidades são removidos e o resultado não pode ser vazio. |
| `email` | Sim | E-mail válido, convertido para minúsculas e sem espaços nas extremidades. |
| `password` | Sim | Senha entre 6 e 20 caracteres. |
| `signupIntent` | Não | `BUY` para comprar ou `ORGANIZE` para organizar. |

```json
{
  "fullName": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha123",
  "signupIntent": "ORGANIZE"
}
```

A resposta tem status `201` e contém `access_token` e `user`. O servidor sempre
grava `role = USER`; o campo `role` não é aceito no corpo do cadastro. A senha é
armazenada como hash bcrypt e omitida do usuário retornado.

Exemplo de resposta:

```json
{
  "access_token": "<token JWT>",
  "user": {
    "id": "b75bc7ce-51e0-4c22-984e-5d5c753a2908",
    "fullName": "Maria Silva",
    "email": "maria@example.com",
    "phone": null,
    "cpf": null,
    "birthDate": null,
    "role": "USER",
    "signupIntent": "ORGANIZE",
    "status": "ACTIVE",
    "createdAt": "2026-10-02T12:00:00.000Z",
    "updatedAt": "2026-10-02T12:00:00.000Z",
    "deletedAt": null
  }
}
```

CPF e data de nascimento são opcionais no cadastro, pois a exigência desses
dados pertence ao fluxo de compra. Se `signupIntent` for omitido, fica `null`.

## Login: `POST /auth/login`

```json
{
  "email": "maria@example.com",
  "password": "senha123"
}
```

Com credenciais válidas e usuário com status `ACTIVE`, retorna `200`:

```json
{
  "access_token": "<token JWT>"
}
```

Usuário inexistente, senha incorreta ou status diferente de `ACTIVE` retorna
`401`, com a mensagem `Credenciais inválidas`. Usuários excluídos logicamente
não são encontrados pelo login.

O JWT inclui `sub` (ID do usuário), `email` e `role`, além dos campos temporais
de emissão e expiração. O login não retorna o usuário; use `/auth/me` ou
`/users/me` para carregar os dados da conta.

## Usuário logado: `GET /auth/me` e `GET /users/me`

As duas rotas exigem um JWT válido no cabeçalho `Authorization` e retornam o
mesmo conteúdo (`MeResponseDto`). Respondem `200` com os campos do usuário, sem
a senha e sem `deletedAt`, e acrescentam `profileComplete` e `organizations`:

```json
{
  "id": "b75bc7ce-51e0-4c22-984e-5d5c753a2908",
  "fullName": "Maria Silva",
  "email": "maria@example.com",
  "phone": null,
  "cpf": null,
  "birthDate": null,
  "role": "USER",
  "signupIntent": "ORGANIZE",
  "status": "ACTIVE",
  "createdAt": "2026-10-02T12:00:00.000Z",
  "updatedAt": "2026-10-02T12:00:00.000Z",
  "profileComplete": false,
  "organizations": [
    {
      "orgId": "5f1c2f0e-8a4b-4c1d-9e57-2b6a3d8f0c11",
      "organizationName": "Atlética Unifesp",
      "role": "member",
      "permission": "full",
      "level": "write"
    }
  ]
}
```

`profileComplete` é calculado a cada consulta: só é `true` quando CPF **e** data
de nascimento estão preenchidos. O campo não é armazenado no banco e não indica
uma validação cadastral adicional.

`organizations` lista as organizações em que o usuário tem vínculo em
`organization_users` com convite aceito (`invite_status = 'accepted'`),
ordenadas pelo nome. Vínculos pendentes ou recusados não aparecem. Um comprador
sem vínculo recebe `organizations: []`. Cada item traz:

| Campo | Descrição |
| --- | --- |
| `orgId` | ID da organização. |
| `organizationName` | Nome da organização. |
| `role` | Papel na organização: `admin` ou `member`. |
| `permission` | Permissão na organização: `full` ou `read_only`. |
| `level` | Nível efetivo calculado a partir de `role` e `permission`: `read`, `write` ou `manage`. |

O front-end usa `organizations` para decidir o que mostrar (menu de
organizador, seletor de organização, botões de criar ou cancelar evento). Isso
é só experiência de uso: a API confere o vínculo de novo em cada requisição
protegida.

## Guards e decorators

Importe `AuthModule` no módulo que declara as rotas protegidas. Ele exporta
`JwtAuthGuard`, `RolesGuard` e `JwtModule`.

- `JwtAuthGuard` verifica assinatura e expiração com `JwtService.verifyAsync`,
  valida as claims esperadas e coloca `{ id, email, role }` em `request.user`.
- `@CurrentUser()` fornece esse objeto ao handler. O decorator deve ser usado
  em uma rota protegida pelo guard.
- `@Roles('ADMIN')` declara os papéis permitidos no handler ou controller.
- `RolesGuard` verifica o papel autenticado e retorna `403` quando não é
  permitido. Sem metadados de papéis, não restringe o acesso.

Exemplo de aplicação em um controller:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin')
admin(@CurrentUser() user: AuthenticatedUser) {
  return { id: user.id, email: user.email, role: user.role };
}
```

O guard de autenticação deve executar antes do guard de papéis. A inclusão dos
guards no módulo não protege automaticamente todas as rotas: a proteção é
aplicada com `@UseGuards`.

O papel usado pelo `RolesGuard` vem do JWT. A consulta `/auth/me` lê os dados
atuais no banco. O bloqueio de usuários inativos ocorre no login; o guard não
consulta o status da conta a cada requisição.

Na prática, os controllers usam decorators que já combinam os guards e
documentam as respostas `401`/`403` no Swagger:

| Decorator | Quem passa | Uso |
| --- | --- | --- |
| `@Authenticated()` | Qualquer usuário logado. | Rotas do próprio usuário; o service confere se o recurso é dele. |
| `@AdminOnly()` | Só `role = ADMIN`. | Rotas de administração da plataforma. |
| `@OrgAccess(level, source)` | `ADMIN` ou membro da organização com pelo menos `level`. | Rotas de organizador, como criar e editar eventos. |

## Autorização por organização

A API trabalha com três perfis de acesso. O papel global (`role` do JWT) e o
vínculo com organizações são independentes:

| Perfil | Como é identificado | O que pode |
| --- | --- | --- |
| **Comprador** | `role = USER` sem vínculo aceito em nenhuma organização. | Comprar e consultar os próprios pedidos, ingressos e perfil. |
| **Organizador** | `role = USER` com vínculo aceito em `organization_users`. | O que o comprador pode, mais as ações permitidas pelo nível na organização do recurso. |
| **Administrador da plataforma** | `role = ADMIN`. | Tudo, em qualquer organização. Também é o único que destaca eventos na home (`featured`). |

O `signupIntent = 'ORGANIZE'` escolhido no cadastro não muda nada nessa tabela:
só o vínculo aceito torna o usuário organizador. As regras de negócio completas
estão na [Matriz de Permissões (RBAC)](../regras-negocio/matriz-permissoes-rbac.md).

### Níveis de acesso

O nível vem das colunas `role` e `permission` do vínculo. Cada nível inclui os
anteriores:

| Nível | Vínculo (`role` / `permission`) | Exemplo de uso na API |
| --- | --- | --- |
| `read` | `member` com `read_only` | Ver os eventos da organização, inclusive rascunhos. |
| `write` | `member` com `full` | Criar e editar eventos da organização. |
| `manage` | `admin` com `full` | Também cancelar eventos. |

A combinação `admin` com `read_only` é inválida pela matriz de permissões e não
deve ser gravada.

### `@OrgAccess` e `OrganizationAccessGuard`

`@OrgAccess(level, source)` aplica `JwtAuthGuard` e `OrganizationAccessGuard`. O
`source` diz de onde sai a organização que está sendo acessada:

| `source` | Organização usada | Exemplo |
| --- | --- | --- |
| `{ from: 'org', param? }` (padrão) | Param da rota com o ID da organização (padrão `orgId`). | `@OrgAccess('manage')` |
| `{ from: 'event', param? }` | `organizer_id` do evento do param (padrão `eventId`). | `@OrgAccess('write', { from: 'event', param: 'id' })` |
| `{ from: 'body', field? }` | Campo do body com o ID da organização (padrão `organizerId`). | `@OrgAccess('write', { from: 'body', field: 'organizerId' })` |

O guard segue esta ordem:

1. Sem usuário autenticado: `401`.
2. `role = ADMIN`: libera.
3. ID da organização (ou do evento) ausente ou fora do formato UUID: `400`.
4. Evento inexistente: `404`.
5. Sem vínculo aceito na organização:
   - com `source` `event`, responde `404`, igual a um evento inexistente, para
     não revelar que o evento existe;
   - nas outras origens, `403`.
6. Vínculo com nível menor que o exigido: `403`.

O vínculo é lido do banco a cada requisição, e não do JWT. Um convite aceito ou
uma permissão alterada valem na próxima requisição, sem novo login.

### Regras aplicadas aos eventos

| Rota | Quem pode | Quem não pode recebe |
| --- | --- | --- |
| `POST /events` | `ADMIN` ou membro com `write` na organização do `organizerId` do body. | `403` |
| `PATCH /events/:id` | `ADMIN` ou membro com `write` na organização dona do evento. | `404` se não é membro; `403` se é membro só com `read` |
| `PATCH /events/:id` com `status: cancelled` | `ADMIN` ou membro com `manage`. | `403` |
| `DELETE /events/:id` (cancela) | `ADMIN` ou membro com `manage`. | `404` se não é membro; `403` se é membro sem `manage` |
| `featured` no body do `POST`/`PATCH` | Só `ADMIN`. | `403` |
| `GET /events` | Público. Só `ADMIN` e membros da organização filtrada em `?organizerId=` veem eventos não publicados. | Para os demais, o filtro `status` é ignorado e só aparecem eventos publicados |
| `GET /events/:id` | Público para eventos publicados. Os demais só para `ADMIN` e membros da organização. | `404` |

Evento cancelado não pode ser alterado (`422`).

## Normalização do e-mail

Cadastro, edição de usuário e login removem espaços nas extremidades e
convertem o e-mail para minúsculas. Por exemplo, ` MARIA@Example.COM ` passa a
`maria@example.com`.

A normalização ocorre antes da busca por duplicidade e da gravação. Assim, um
cadastro com maiúsculas pode entrar com o mesmo e-mail em minúsculas, e uma
edição não cria uma conta distinta apenas pela capitalização. Essa mudança não
reescreve automaticamente os e-mails antigos já armazenados.

## Modelo de usuários e migration

A migration `0001_authentication_base.sql` altera a tabela `users`:

| Antes | Depois |
| --- | --- |
| `first_name` e `last_name` | `full_name`, `varchar(200)` obrigatório. |
| `profile_type` | `role`, `USER` ou `ADMIN`, obrigatório e com padrão `USER`. |
| Sem intenção separada | `signup_intent`, `BUY` ou `ORGANIZE`, opcional. |
| CPF e nascimento | `cpf` e `birth_date` aceitam `NULL`. |

Os nomes existentes são combinados, com um espaço entre nome e sobrenome,
antes da remoção das colunas antigas. Se o nome combinado ultrapassar 200
caracteres, ajuste esse registro antes de aplicar a migration. O papel `ADMIN`
é preservado; os demais valores antigos de `profile_type` passam a `USER`.

Os índices únicos parciais de e-mail e CPF continuam considerando apenas
registros sem `deleted_at`. O PostgreSQL permite múltiplos valores `NULL` no
índice de CPF, permitindo cadastros sem esse dado.

Nos contratos de usuários, use `fullName` e `signupIntent`. As respostas passam
a expor `role`; os campos `firstName`, `lastName` e `profileType` são removidos.
Os DTOs de criação e edição não permitem atribuir `role`.

## Erros e testes

| Status | Situação |
| --- | --- |
| `400` | Payload inválido ou campo não permitido no cadastro. |
| `401` | Credenciais inválidas, token ausente, inválido ou expirado. |
| `403` | Papel insuficiente (`RolesGuard`) ou nível insuficiente na organização (`OrganizationAccessGuard`). |
| `404` | Usuário do token não encontrado ao consultar `/auth/me` ou `/users/me`, ou evento de uma organização da qual o usuário não é membro. |
| `409` | E-mail ou CPF já cadastrado em um usuário não excluído. |

Os testes de autenticação incluem validação dos guards, cadastro, login,
`/auth/me`, normalização e duplicidade de e-mail. Os testes HTTP usam PostgreSQL
em memória com PGlite e aplicam as migrations para verificar a persistência e a
preservação dos dados antigos.

No repositório `hubee-api`:

```bash
npm test -- --runInBand src/auth
npm run build
npm run lint
```
