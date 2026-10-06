---
sidebar_position: 3
---

# Autenticação e cadastro

A API permite criar uma conta com nome completo, e-mail e senha e entrar
imediatamente. A intenção de comprar ou organizar eventos é separada do papel de
acesso: escolher organizar não concede permissões de administrador.

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
de emissão e expiração. O login não retorna o usuário; use `/auth/me` para
carregar os dados da conta.

## Usuário logado: `GET /auth/me`

Exige um JWT válido no cabeçalho `Authorization`. Retorna `200` com os campos do
usuário, sem a senha, e acrescenta `profileComplete`:

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
  "deletedAt": null,
  "profileComplete": false
}
```

`profileComplete` é calculado a cada consulta: só é `true` quando CPF **e** data
de nascimento estão preenchidos. O campo não é armazenado no banco e não indica
uma validação cadastral adicional.

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
| `403` | Papel insuficiente em uma rota protegida pelo `RolesGuard`. |
| `404` | Usuário do token não encontrado ao consultar `/auth/me`. |
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
