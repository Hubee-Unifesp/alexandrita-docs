---
sidebar_position: 2
---

# Collections de Testes de API (Bruno)

O repositório [`hubee-collections`](https://github.com/Hubee-Unifesp/hubee-collections)
reúne requisições prontas para testar manualmente os endpoints da
[Hubee API](./intro.md), organizadas com o [Bruno](https://www.usebruno.com/)
— um cliente de API open-source (alternativa ao Postman/Insomnia) que guarda
as requisições como arquivos versionáveis em Git.

## Instalação

1. Instale o [Bruno](https://www.usebruno.com/downloads).
2. Clone o repositório:

   ```bash
   git clone https://github.com/Hubee-Unifesp/hubee-collections.git
   ```

## Como usar

1. Abra o Bruno e selecione **Open Collection**.
2. Escolha a pasta do repositório clonado.
3. No seletor de ambiente (canto superior direito), escolha um dos ambientes
   disponíveis:

   | Ambiente     | `baseUrl`                          |
   | ------------ | ----------------------------------- |
   | `local`      | `http://localhost:3000`             |
   | `production` | `https://hubee-api-1.onrender.com`  |

   Em **Environments**, preencha as variáveis secretas de login. O Bruno
   guarda o valor delas só na sua máquina, sem gravar no arquivo:

   | Variáveis | Usuário |
   | --- | --- |
   | `emailAdmin` / `senhaAdmin` | role `ADMIN` da plataforma |
   | `emailOrganizador` / `senhaOrganizador` | membro com `permission = full` na organização `organizerId` |
   | `emailComprador` / `senhaComprador` | usuário comum, com CPF e data de nascimento no perfil |

4. Rode os três logins da pasta `AUTH`. Eles salvam `tokenAdmin`,
   `tokenOrganizador` e `tokenComprador`, e cada pasta herda o token do perfil
   que as rotas dela exigem.
5. Para usar o ambiente `local`, a [API precisa estar rodando](./intro.md#rodando-localmente)
   nessa máquina — sem ela no ar, as requisições falham por conexão recusada.

> ⚠️ **Cuidado com o ambiente `production`**: ele aponta para a API real em
> produção. Requisições de escrita (`POST`, `PATCH`, `DELETE`) alteram dados
> de verdade no banco de produção — não são isoladas nem revertidas
> automaticamente. Use `production` só para leitura/verificação pontual, e
> nunca para rodar requisições de criar/remover (como as de `USUARIOS`, que
> criam e removem registros). Veja [Boas práticas de banco de dados](../boas-praticas-guias/boas-praticas-banco-de-dados.md)
> para entender a diferença entre banco local e de produção.

## Estrutura

A collection usa só o formato OpenCollection (`.yml`). Cada pasta é um recurso
da [Hubee API](./intro.md) e, dentro dela, as requisições seguem a ordem
**criar → listar → buscar → atualizar → remover**:

```
HEALTH/                   # GET /health
AUTH/                     # registro, logins (admin, organizador, comprador) e /auth/me
USUARIOS/                 # CRUD administrativo de /users
MINHA CONTA/              # /users/me: perfil, avatar, senha e exclusão
ORGANIZACOES/             # CRUD de /organizations e validação RBAC
MEMBROS DA ORGANIZACAO/   # /organizations/:orgId/users
LOCAIS/                   # CRUD de /venues
EVENTOS/                  # CRUD de /events, capa e resumo
  CENARIOS DE BUSCA/      # testes da busca pública (paginação, filtros, 400)
ORGANIZACOES DO EVENTO/   # /events/:eventId/organizations
LOTES DE INGRESSO/        # /events/:eventId/ticket-types
PEDIDOS/                  # /orders e /users/me/orders
PAGAMENTOS/               # checkout (/payments) e /orders/:orderId/payments
INGRESSOS/                # /tickets, /users/me/tickets e /orders/:orderId/tickets
FORNECEDORES/             # CRUD de /suppliers
DESPESAS DO EVENTO/       # /events/:eventId/expenses
TAREFAS DO EVENTO/        # /events/:eventId/tasks
assets/                   # imagem de exemplo para os uploads
environments/             # local e production
```

Cada requisição que cria um recurso salva o id numa variável do ambiente
(`venueId`, `eventId`, `orderId`…), e as seguintes já usam esse id nos
parâmetros de path. A aba **Docs** de cada requisição traz a rota, quem pode
acessar, os campos do body e as respostas esperadas. O fluxo completo de compra
e a ordem de execução estão no README do repositório.

### Exemplos de Requisições de Gerenciamento de Eventos e Lotes

Consulte a documentação completa em [Gerenciamento de Eventos e Lotes de Ingressos](./eventos-e-lotes.md). As requisições das pastas `EVENTOS/` e `LOTES DE INGRESSO/` exercitam o fluxo do organizador em sequência:

- **`EVENTOS/POST CRIAR EVENTO`** (`POST {{baseUrl}}/events`): cria o evento em rascunho (`draft`) com `Bearer {{tokenOrganizador}}` e salva `{{eventId}}`.
- **`EVENTOS/POST CRIAR EVENTO SEM PERMISSAO`** (`POST {{baseUrl}}/events`): valida o `403 Forbidden` ao tentar criar evento com `Bearer {{tokenComprador}}`.
- **`EVENTOS/PATCH ATUALIZAR EVENTO`** (`PATCH {{baseUrl}}/events/:id`): atualiza os dados e publica o evento `{{eventId}}` (`status: "published"`).
- **`LOTES DE INGRESSO/POST CRIAR LOTE`** (`POST {{baseUrl}}/events/:eventId/ticket-types`): cadastra um lote no evento `{{eventId}}` e salva `{{ticketTypeId}}`.
- **`LOTES DE INGRESSO/GET LISTAR LOTES`** (`GET {{baseUrl}}/events/:eventId/ticket-types`): lista os lotes do evento com o saldo calculado `available`.
- **`LOTES DE INGRESSO/PATCH ATUALIZAR LOTE`** (`PATCH {{baseUrl}}/events/:eventId/ticket-types/:id`): atualiza nome, preço e quantidade do lote `{{ticketTypeId}}`.
- **`LOTES DE INGRESSO/DELETE REMOVER LOTE`** (`DELETE {{baseUrl}}/events/:eventId/ticket-types/:id`): remove o lote sem vínculos (`204 No Content`).
- **`EVENTOS/DELETE CANCELAR EVENTO`** (`DELETE {{baseUrl}}/events/:id`): cancela o evento `{{eventId}}` exigindo nível `manage` (`204 No Content`).

### Exemplos de Requisições de Compra e Ingressos

- **Criar Pedido (`POST /orders`)**:
  - **Headers**: `Authorization: Bearer {{tokenComprador}}`
  - **Body**: `{ "items": [{ "ticketTypeId": "{{ticketTypeId}}", "quantity": 1 }] }`
  - **Respostas**: `201 Created` com total calculado pelo servidor; `422 Unprocessable Entity` se lote estiver esgotado.
- **Checkout / Pagamento (`POST /payments`)**:
  - **Headers**: `Authorization: Bearer {{tokenComprador}}`
  - **Body**: `{ "orderId": "{{orderId}}", "paymentMethod": "pix" }`
  - **Respostas**: `201 Created` com status `confirmado` e emissão atômica de ingressos.
- **Consultar Ingressos (`GET /tickets`)**:
  - **Headers**: `Authorization: Bearer {{tokenComprador}}`
  - **Respostas**: `200 OK` trazendo a lista de ingressos com QR code criptográfico de 64 caracteres e dados aninhados de evento e lote.

## Convenções

- Somente arquivos `.yml` (OpenCollection): o Bruno lê um formato por coleção,
  então não crie `.bru` nem `bruno.json`. Nunca versione tokens, senhas ou
  chaves de API: use variáveis secretas no ambiente (`secret: true`).
- Pastas em caixa alta e sem acento; requisições com o verbo HTTP seguido da
  ação (`POST CRIAR LOTE`, `GET LISTAR LOTES`, `PATCH ATUALIZAR LOTE`,
  `DELETE REMOVER LOTE`).
- Rotas usam `{{baseUrl}}` e parâmetros de path (`/events/:id`). Filtros
  opcionais de query ficam cadastrados, mas desativados.
- O token fica no `folder.yml` de cada pasta e as requisições usam
  `auth: inherit`.
- Ao criar ou alterar uma rota na API, atualize a requisição na pasta do
  recurso, com body de exemplo e `docs` no mesmo formato das demais. As regras
  completas estão no `AGENTS.md` do repositório.
