---
sidebar_position: 7
title: Fornecedores
description: Contratos de API, controle de acesso de organizador (@OrganizerOnly), filtros de busca e avaliações de fornecedores em /suppliers (GOL-202, GOL-245, GOL-246, GOL-250 e GOL-251).
---

# Fornecedores

O módulo de **fornecedores** (`/suppliers`) da `hubee-api` provê o cadastro, a listagem filtrada e ordenada, o detalhamento, a atualização, a remoção lógica (`deleted_at`) de empresas e prestadores de serviço utilizados na montagem de eventos (tasks **GOL-202** e **GOL-250**), bem como o registro e a consulta de **avaliações por organizadores** em `/suppliers/:id/reviews` (tasks **GOL-245** e **GOL-246**).

---

## 1. Controle de Acesso e Autorização (`@OrganizerOnly`)

Os fornecedores formam um **catálogo compartilhado** da plataforma (sem coluna `organization_id` na tabela `suppliers`). Todas as rotas do `SuppliersController` são protegidas pelo decorator `@OrganizerOnly()`, que combina `JwtAuthGuard` e `OrganizerGuard`:

| Quem chama | Permissão | Resposta |
| :--- | :--- | :--- |
| Visitante sem token ou com token inválido/expirado | Negado | `401 Unauthorized` |
| Comprador comum (`role = 'USER'` sem vínculo ativo em nenhuma organização) | Negado | `403 Forbidden` |
| Usuário com convite pendente ou recusado (`pending` / `rejected`) | Negado | `403 Forbidden` |
| **Organizador** (`role = 'USER'` com vínculo `invite_status = 'accepted'` em pelo menos uma organização) | **Liberado** | `200 OK` / `201 Created` / `204 No Content` |
| **Administrador da plataforma** (`role = 'ADMIN'`) | **Liberado** | `200 OK` / `201 Created` / `204 No Content` |

---

## 2. Endpoints

### 2.1. Cadastrar Fornecedor (`POST /suppliers`)

Cria um novo fornecedor ativo. Valida unicidade de `cnpjCpf` e `email` entre os registros não removidos (`deleted_at IS NULL`).

#### Corpo da Requisição (`CreateSupplierDto`)

| Campo | Tipo | Obrigatório | Validação |
| :--- | :--- | :---: | :--- |
| `companyName` | `string` | Sim | Não vazio (`trim` automático). |
| `cnpjCpf` | `string` | Sim | Apenas números, entre 11 e 14 dígitos (`trim` automático). |
| `phone` | `string` | Não | Texto opcional (até 20 caracteres). |
| `email` | `string` | Não | Formato de e-mail válido. |
| `category` | `string` | Não | Texto opcional (ex.: `Buffet`, `Som e iluminação`, `Fotografia`). |

#### Exemplo de Requisição

```json
{
  "companyName": "Buffet Sabor Real",
  "cnpjCpf": "11222333000181",
  "phone": "11988887777",
  "email": "contato@saborreal.com.br",
  "category": "Buffet"
}
```

#### Resposta de Sucesso (`201 Created` — `SupplierResponseDto`)

O campo interno `deletedAt` é sempre omitido na resposta pública via `toResponse(SupplierResponseDto, ...)`, e os campos agregados de avaliação (`ratingAverage` e `ratingCount`) passam a compor o contrato público:

```json
{
  "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "companyName": "Buffet Sabor Real",
  "cnpjCpf": "11222333000181",
  "phone": "11988887777",
  "email": "contato@saborreal.com.br",
  "category": "Buffet",
  "ratingAverage": null,
  "ratingCount": 0,
  "createdAt": "2026-11-05T19:00:00.000Z",
  "updatedAt": "2026-11-05T19:00:00.000Z"
}
```

#### Respostas de Erro

- **`400 Bad Request`:** Falha na validação do payload (ex.: `cnpjCpf` com letras ou fora de 11–14 dígitos).
- **`409 Conflict`:** CNPJ/CPF ou e-mail já pertencente a outro fornecedor ativo:
  ```json
  {
    "message": "Já existe um fornecedor com este CNPJ/CPF ou E-mail.",
    "error": "Conflict",
    "statusCode": 409
  }
  ```

---

### 2.2. Listar e Filtrar Fornecedores (`GET /suppliers`)

Retorna todos os fornecedores ativos (`deleted_at IS NULL`) com a média arredondada e a contagem de avaliações (`ratingAverage` e `ratingCount`), permitindo filtragem por nome, categoria ou nota mínima e ordenação customizada.

#### Query Params (`QuerySupplierDto`)

| Parâmetro | Tipo | Obrigatório | Comportamento |
| :--- | :--- | :---: | :--- |
| `search` | `string` | Não | Busca parcial *case-insensitive* (`ILIKE %search%`) em `companyName`. Máximo de 255 caracteres; não aceita string vazia. |
| `category` | `string` | Não | Filtro *case-insensitive* (`ILIKE category`) pela coluna `category`. Máximo de 100 caracteres; não aceita string vazia. |
| `minRating` | `number` | Não | Filtra fornecedores com média arredondada (`ROUND(AVG(rating), 1)`) maior ou igual ao valor informado (de `1` a `5`). |
| `sortBy` | `'rating' \| 'companyName' \| 'createdAt'` | Não | Define a ordenação dos resultados. Em `rating`, ordena da maior média para a menor deixando fornecedores sem avaliações (`ratingAverage: null`) por último. |

#### Exemplo de Consulta com Filtros

```bash
curl -H "Authorization: Bearer <TOKEN_ORGANIZADOR>" \
  "http://localhost:3000/suppliers?search=Sabor&category=Buffet&minRating=4&sortBy=rating"
```

#### Fornecedores Bem Avaliados (`minRating` + `sortBy=rating`)

Combinar `minRating` e `sortBy=rating` retorna o ranking dos fornecedores mais bem avaliados:

```bash
curl -H "Authorization: Bearer <TOKEN_ORGANIZADOR>" \
  "http://localhost:3000/suppliers?sortBy=rating&minRating=4"
```

- **Filtro:** `minRating` compara com a média arredondada em 1 casa decimal. Fornecedores sem avaliações (`ratingAverage: null`) nunca atendem ao filtro e ficam fora do resultado.
- **Ordenação:** `ratingAverage` decrescente. Em caso de empate, vale a maior `ratingCount` e, persistindo o empate, `companyName` em ordem alfabética.
- **Sem `sortBy`:** a ordem dos resultados não é garantida. Os valores `companyName` (A–Z) e `createdAt` (mais recentes primeiro) também são aceitos.

#### Resposta de Sucesso (`200 OK` — `SupplierResponseDto[]`)

Além dos dados cadastrais, cada fornecedor traz os campos agregados de avaliação:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `ratingAverage` | `number \| null` | Média das notas (1 a 5) com 1 casa decimal, ou `null` quando não há avaliações. |
| `ratingCount` | `number` | Quantidade total de avaliações recebidas (`0` quando não há). |

```json
[
  {
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "companyName": "Buffet Sabor Real",
    "cnpjCpf": "11222333000181",
    "phone": "11988887777",
    "email": "contato@saborreal.com.br",
    "category": "Buffet",
    "ratingAverage": 4.8,
    "ratingCount": 12,
    "createdAt": "2026-11-05T19:00:00.000Z",
    "updatedAt": "2026-11-05T19:00:00.000Z"
  },
  {
    "id": "f0e1d2c3-b4a5-4968-8776-655443322110",
    "companyName": "Som e Luz Eventos",
    "cnpjCpf": "22333444000155",
    "phone": null,
    "email": null,
    "category": "Som e iluminação",
    "ratingAverage": 4.2,
    "ratingCount": 5,
    "createdAt": "2026-11-06T10:00:00.000Z",
    "updatedAt": "2026-11-06T10:00:00.000Z"
  }
]
```

#### Respostas de Erro

- **`400 Bad Request`:** `minRating` não numérico ou fora do intervalo de `1` a `5`, ou `sortBy` fora de `rating`, `companyName` e `createdAt`.
- **`401 Unauthorized`:** Token JWT ausente, inválido ou expirado.
- **`403 Forbidden`:** Usuário sem vínculo ativo como organizador nem papel `ADMIN`.

---

### 2.3. Detalhar Fornecedor (`GET /suppliers/:id`)

Retorna um fornecedor ativo pelo seu UUID.

- **`200 OK`:** Retorna `SupplierResponseDto`.
- **`400 Bad Request`:** `id` não é um UUID válido.
- **`404 Not Found`:** Fornecedor inexistente ou removido logicamente (`"Fornecedor não encontrado."`).

---

### 2.4. Editar Fornecedor (`PATCH /suppliers/:id`)

Atualiza parcialmente os dados de um fornecedor ativo (`UpdateSupplierDto`).

- Verifica conflito (`409 Conflict`) caso o novo `cnpjCpf` ou `email` já pertença a outro fornecedor ativo (`id != :id`).
- **`200 OK`:** Retorna o `SupplierResponseDto` atualizado.
- **`404 Not Found`:** Fornecedor inexistente ou removido.

---

### 2.5. Remover Fornecedor (`DELETE /suppliers/:id`)

Realiza a exclusão lógica preenchendo `deleted_at` com a data/hora atual. O registro deixa de aparecer na listagem e seu CNPJ/CPF e e-mail ficam liberados para novo cadastro.

- **`204 No Content`:** Removido com sucesso (sem corpo).
- **`404 Not Found`:** Fornecedor inexistente ou já removido.

---

## 3. Avaliação de Fornecedores (`GOL-245`)

Os organizadores podem registrar uma nota e um comentário opcional para fornecedores ativos do catálogo, bem como consultar o histórico de avaliações de cada fornecedor. As notas registradas alimentam os campos agregados `ratingAverage` e `ratingCount` retornados em `GET /suppliers` e `GET /suppliers/:id`.

### Regras de Negócio e Autorização (RBAC)

- **Controle de acesso (`@OrganizerOnly()`):** Assim como o restante do `SuppliersController`, as rotas de avaliação são protegidas por `JwtAuthGuard` + `OrganizerGuard`. Qualquer **organizador** (`role = 'USER'` com vínculo `invite_status = 'accepted'` em pelo menos uma organização, independentemente de seu nível ser `read`, `write` ou `manage`) ou **administrador global** (`role = 'ADMIN'`) pode avaliar e listar avaliações. Visitantes sem token recebem `401 Unauthorized`, enquanto compradores comuns e usuários com convite `pending`/`rejected` recebem `403 Forbidden`.
- **Uma avaliação por organizador por fornecedor (*upsert*):** A tabela `supplier_reviews` possui restrição de unicidade em `(supplier_id, user_id)`. Caso o mesmo usuário envie um novo `POST /suppliers/:id/reviews`, o registro anterior é atualizado em vez de duplicado.
- **Integridade com exclusão lógica:** Não é possível avaliar nem listar avaliações de fornecedores inexistentes ou removidos logicamente (`deleted_at IS NOT NULL`).

---

### 3.1. Avaliar Fornecedor (`POST /suppliers/:id/reviews`)

Registra a avaliação do usuário autenticado para o fornecedor `:id` ou atualiza a avaliação existente caso ele já tenha avaliado esse fornecedor anteriormente.

#### Parâmetros de Rota

| Parâmetro | Tipo | Obrigatório | Validação |
| :--- | :--- | :---: | :--- |
| `id` | `string (uuid)` | Sim | UUID válido (`ParseUUIDPipe`) de um fornecedor ativo (`deleted_at IS NULL`). |

#### Corpo da Requisição (`CreateSupplierReviewDto`)

O DTO passa pelo `ValidationPipe` global com `whitelist: true` e `forbidNonWhitelisted: true` (campos extras não mapeados são rejeitados com `400 Bad Request`).

| Campo | Tipo | Obrigatório | Validação / Comportamento |
| :--- | :--- | :---: | :--- |
| `rating` | `number` (`integer`) | Sim | Número inteiro obrigatório entre `1` e `5`. |
| `comment` | `string` | Não | Texto opcional até `500` caracteres (`trim` automático nas pontas). Quando omitido ou enviado como string vazia (`""` ou apenas espaços), é salvo como `null`. |

#### Exemplo de Requisição

```json
{
  "rating": 5,
  "comment": "Buffet pontual e muito bem servido."
}
```

#### Respostas de Sucesso (`201 Created` / `200 OK` — `SupplierReviewResponseDto`)

- **`201 Created`:** Retornado na **primeira avaliação** do usuário autenticado para aquele fornecedor.
- **`200 OK`:** Retornado quando o mesmo usuário **atualiza** sua avaliação anterior para aquele fornecedor.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `string (uuid)` | Identificador único da avaliação. |
| `supplierId` | `string (uuid)` | UUID do fornecedor avaliado. |
| `userId` | `string (uuid)` | UUID do organizador/administrador que avaliou (extraído do token JWT). |
| `userName` | `string` | Nome completo (`fullName`) do usuário que avaliou. |
| `rating` | `number` | Nota inteira de `1` a `5`. |
| `comment` | `string \| null` | Comentário da avaliação (ou `null` quando não informado/vazio). |
| `createdAt` | `string (ISO 8601)` | Data e hora de criação da avaliação. |
| `updatedAt` | `string (ISO 8601)` | Data e hora da última atualização da avaliação. |

```json
{
  "id": "c7a9d3e2-4f1b-48b2-9c3d-1a2b3c4d5e6f",
  "supplierId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "userId": "b75bc7ce-51e0-4c22-984e-5d5c753a2908",
  "userName": "Maria Silva",
  "rating": 5,
  "comment": "Buffet pontual e muito bem servido.",
  "createdAt": "2026-11-15T19:00:00.000Z",
  "updatedAt": "2026-11-15T19:00:00.000Z"
}
```

#### Respostas de Erro

- **`400 Bad Request`:** Falha na validação de `id` (UUID inválido), `rating` (ausente, decimal, string ou fora de `1..5`), `comment` (não-string ou acima de 500 caracteres) ou envio de campos extras não permitidos:
  ```json
  {
    "message": [
      "A nota deve ser entre 1 e 5.",
      "O comentário deve ter no máximo 500 caracteres."
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **`401 Unauthorized`:** Requisição sem header `Authorization: Bearer <token>` ou com token inválido/expirado.
- **`403 Forbidden`:** Usuário autenticado sem vínculo ativo em nenhuma organização (comprador comum ou convite `pending`/`rejected`):
  ```json
  {
    "message": "Acesso restrito a organizadores de eventos",
    "error": "Forbidden",
    "statusCode": 403
  }
  ```
- **`404 Not Found`:** Fornecedor inexistente ou removido logicamente (`deleted_at IS NOT NULL`):
  ```json
  {
    "message": "Fornecedor não encontrado.",
    "error": "Not Found",
    "statusCode": 404
  }
  ```

---

### 3.2. Listar Avaliações do Fornecedor (`GET /suppliers/:id/reviews`)

Retorna todas as avaliações registradas para o fornecedor ativo `:id`, ordenadas da avaliação mais recente para a mais antiga (`updatedAt DESC, id DESC`), já incluindo o nome do avaliador (`userName`).

#### Exemplo de Consulta

```bash
curl -H "Authorization: Bearer <TOKEN_ORGANIZADOR>" \
  "http://localhost:3000/suppliers/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/reviews"
```

#### Resposta de Sucesso (`200 OK` — `SupplierReviewResponseDto[]`)

```json
[
  {
    "id": "c7a9d3e2-4f1b-48b2-9c3d-1a2b3c4d5e6f",
    "supplierId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "userId": "b75bc7ce-51e0-4c22-984e-5d5c753a2908",
    "userName": "Maria Silva",
    "rating": 5,
    "comment": "Buffet pontual e muito bem servido.",
    "createdAt": "2026-11-15T19:00:00.000Z",
    "updatedAt": "2026-11-15T19:00:00.000Z"
  },
  {
    "id": "9f8e7d6c-5b4a-4321-8765-abcdef123456",
    "supplierId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "userId": "d1e2f3a4-b5c6-47d8-9e0f-112233445566",
    "userName": "João Santos",
    "rating": 4,
    "comment": null,
    "createdAt": "2026-11-14T16:30:00.000Z",
    "updatedAt": "2026-11-14T16:30:00.000Z"
  }
]
```

*(Quando o fornecedor ativo ainda não possui avaliações, a rota retorna `200 OK` com um array vazio `[]`.)*

#### Respostas de Erro

- **`400 Bad Request`:** Parâmetro `:id` não está no formato UUID.
- **`401 Unauthorized`:** Token JWT ausente, inválido ou expirado.
- **`403 Forbidden`:** Usuário sem vínculo ativo como organizador nem papel `ADMIN` (`"Acesso restrito a organizadores de eventos"`).
- **`404 Not Found`:** Fornecedor inexistente ou removido logicamente (`"Fornecedor não encontrado."`).

---

## 4. Testando via Bruno (`hubee-collections`)

A pasta `FORNECEDORES/` no repositório [`hubee-collections`](./collections.md) reúne as requisições prontas usando `{{baseUrl}}`, `{{tokenOrganizador}}` e `{{supplierId}}`:

1. `POST CRIAR FORNECEDOR.yml` — Cadastra o fornecedor e salva o `id` em `{{supplierId}}`.
2. `GET LISTAR FORNECEDORES.yml` — Lista fornecedores ativos (com filtros opcionais).
   - `GET LISTAR FORNECEDORES BEM AVALIADOS.yml` — Lista em `GET /suppliers?sortBy=rating&minRating=4` os fornecedores com nota mínima 4, da maior média para a menor, e valida `ratingAverage` e a ordenação.
3. `GET BUSCAR FORNECEDOR.yml` — Detalha `{{supplierId}}`.
4. `PATCH ATUALIZAR FORNECEDOR.yml` — Atualiza os dados do fornecedor `{{supplierId}}`.
5. `POST AVALIAR FORNECEDOR.yml` — Registra ou atualiza a avaliação do organizador autenticado em `POST /suppliers/:id/reviews` (`201` ou `200`).
6. `GET LISTAR AVALIACOES DO FORNECEDOR.yml` — Lista as avaliações de `{{supplierId}}` em `GET /suppliers/:id/reviews` (`200`).
7. `DELETE REMOVER FORNECEDOR.yml` — Realiza a remoção lógica (`deleted_at`) de `{{supplierId}}` (`204 No Content`).
