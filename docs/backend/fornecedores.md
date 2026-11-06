---
sidebar_position: 7
title: Fornecedores
description: Contratos de API, controle de acesso de organizador (@OrganizerOnly) e filtros de busca para fornecedores em /suppliers (GOL-202).
---

# Fornecedores

O módulo de **fornecedores** (`/suppliers`) da `hubee-api` provê o cadastro, a listagem filtrada, o detalhamento, a atualização e a remoção lógica (`deleted_at`) de empresas e prestadores de serviço utilizados na montagem de eventos (task **GOL-202**).

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

O campo interno `deletedAt` é sempre omitido na resposta pública via `toResponse(SupplierResponseDto, ...)`:

```json
{
  "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "companyName": "Buffet Sabor Real",
  "cnpjCpf": "11222333000181",
  "phone": "11988887777",
  "email": "contato@saborreal.com.br",
  "category": "Buffet",
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

Retorna todos os fornecedores ativos (`deleted_at IS NULL`), permitindo filtragem opcional por nome da empresa e por categoria.

#### Query Params (`QuerySupplierDto`)

| Parâmetro | Tipo | Obrigatório | Comportamento |
| :--- | :--- | :---: | :--- |
| `search` | `string` | Não | Busca parcial *case-insensitive* (`ILIKE %search%`) em `companyName`. Máximo de 255 caracteres; não aceita string vazia. |
| `category` | `string` | Não | Filtro *case-insensitive* (`ILIKE category`) pela coluna `category`. Máximo de 100 caracteres; não aceita string vazia. |

#### Exemplo de Consulta com Filtros

```bash
curl -H "Authorization: Bearer <TOKEN_ORGANIZADOR>" \
  "http://localhost:3000/suppliers?search=Sabor&category=Buffet"
```

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
