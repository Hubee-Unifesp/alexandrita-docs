---
sidebar_position: 9
title: Gerenciamento de Eventos e Lotes de Ingressos
description: Fluxo completo do organizador, contratos de API, ciclo de vida de eventos (/events), upload de foto de capa, rascunho com IA (POST /events/ai-draft), CRUD e estoque de lotes (/events/:eventId/ticket-types) e regras RBAC (GOL-147 / GOL-206 / GOL-207 / GOL-212 / GOL-221 / GOL-263).
---

# Gerenciamento de Eventos e Lotes de Ingressos

Os módulos de **eventos** (`/events`) e **lotes de ingressos** (`/events/:eventId/ticket-types`) da `hubee-api` permitem que membros autorizados de uma [organização](./organizacoes.md) conduzam todo o ciclo de vida de um evento — desde o cadastro do local e rascunho inicial, envio da imagem de capa e configuração de lotes com controle de estoque, até a publicação na vitrine ou o cancelamento administrativo (tasks **GOL-147**, **GOL-206**, **GOL-207**, **GOL-212**, **GOL-216** e **GOL-221**). O organizador também pode gerar um rascunho do evento e dos lotes com IA a partir de uma descrição em texto (**GOL-263**), sem salvar nada.

Para a busca pública paginada e o detalhamento público do evento, consulte também:
- [Busca de eventos (`GET /events`)](./busca-eventos.md)
- [Detalhes do evento (`GET /events/:id`)](./detalhes-evento.md)

---

## 1. Fluxo Completo do Organizador

O diagrama abaixo resume a jornada ponta a ponta do organizador para criar, configurar lotes, publicar e gerenciar um evento na plataforma:

```mermaid
sequenceDiagram
    autonumber
    actor O as Organizador (write / manage)
    participant V as VenueController
    participant E as EventController
    participant T as TicketTypeController
    participant DB as PostgreSQL + Storage

    Note over O,V: 1. Preparação do Local (se necessário)
    O->>V: POST /venues { name, maxCapacity, addressId }
    V->>DB: Valida @OrgAccess('write', { from: 'any' }) e grava local
    V-->>O: 201 Created (VenueResponseDto)

    Note over O,E: 2. Criação do Evento em Rascunho
    O->>E: POST /events { name, organizerId, venueId, startDate, endDate, ... }
    E->>DB: Valida @OrgAccess('write', { from: 'body', field: 'organizerId' })
    E-->>O: 201 Created (EventResponseDto com status = 'draft')

    Note over O,E: 3. Upload da Foto de Capa (opcional)
    O->>E: PATCH /events/:id/photo (multipart/form-data: file)
    E->>DB: Valida @OrgAccess('write', { from: 'event', param: 'id' }) + envia ao Blob
    E-->>O: 200 OK (photoUrl atualizado)

    Note over O,T: 4. Cadastro e Ajuste de Lotes de Ingressos
    O->>T: POST /events/:eventId/ticket-types { batch, price, quantity }
    T->>DB: Valida @OrgAccess('write', { from: 'event', param: 'eventId' })
    T-->>O: 201 Created (TicketTypeResponseDto)

    Note over O,E: 5. Publicação do Evento
    O->>E: PATCH /events/:id { status: 'published' }
    E->>DB: Atualiza status para 'published'
    E-->>O: 200 OK (Evento visível publicamente)
```

---

## 2. Matriz de Autorização RBAC (Eventos, Lotes e Locais)

A autorização nas rotas de gerenciamento é aplicada pelo decorator `@OrgAccess(level, source)` (combinando `JwtAuthGuard` e `OrganizationAccessGuard`, conforme detalhado em [Autenticação e autorização](./autenticacao.md)):

| Método | Rota | Guard / Decorator | Quem pode acessar | Não-membro da org | Membro sem nível suficiente |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `POST` | `/venues` | `@OrgAccess('write', { from: 'any' })` | Membro `write`/`manage` de **qualquer** organização ativa ou `ADMIN` (`GOL-206`) | `403 Forbidden` | `403 Forbidden` (apenas `read`) |
| `POST` | `/events` | `@OrgAccess('write', { from: 'body', field: 'organizerId' })` | Membro `write`/`manage` da organização indicada em `organizerId` ou `ADMIN` | `403 Forbidden` | `403 Forbidden` (membro `read`) |
| `PATCH` | `/events/:id` | `@OrgAccess('write', { from: 'event', param: 'id' })` | Membro `write`/`manage` da organização dona do evento ou `ADMIN` | **`404 Not Found`** | **`403 Forbidden`** (membro `read`) |
| `PATCH` | `/events/:id/photo` | `@OrgAccess('write', { from: 'event', param: 'id' })` | Membro `write`/`manage` da organização dona do evento ou `ADMIN` (`GOL-221`) | **`404 Not Found`** | **`403 Forbidden`** (membro `read`) |
| `POST` | `/events/ai-draft` | `@AiRateLimited()` + `@OrganizerOnly()` | Membro aceito de **qualquer** organização ou `ADMIN` (`GOL-263`), com limite de gerações por usuário | `403 Forbidden` | — (qualquer nível serve) |
| `DELETE` | `/events/:id` | `@OrgAccess('manage', { from: 'event', param: 'id' })` | Apenas administrador da organização (`manage`) ou `ADMIN` global | **`404 Not Found`** | **`403 Forbidden`** (membro `read` ou `write`) |
| `POST` | `/events/:eventId/ticket-types` | `@OrgAccess('write', { from: 'event', param: 'eventId' })` | Membro `write`/`manage` da organização dona do evento ou `ADMIN` (`GOL-206`) | **`404 Not Found`** | **`403 Forbidden`** (membro `read`) |
| `GET` | `/events/:eventId/ticket-types` | `OptionalJwtAuthGuard` | Público se evento `published`; restrito a membros da org (`read`/`write`/`manage`) ou `ADMIN` nos demais status | **`404 Not Found`** (se não `published`) | — |
| `GET` | `/events/:eventId/ticket-types/:id` | `OptionalJwtAuthGuard` | Público se evento `published`; restrito a membros da org ou `ADMIN` nos demais status | **`404 Not Found`** (se não `published`) | — |
| `PATCH` | `/events/:eventId/ticket-types/:id` | `@OrgAccess('write', { from: 'event', param: 'eventId' })` | Membro `write`/`manage` da organização dona do evento ou `ADMIN` (`GOL-206`) | **`404 Not Found`** | **`403 Forbidden`** (membro `read`) |
| `DELETE` | `/events/:eventId/ticket-types/:id` | `@OrgAccess('write', { from: 'event', param: 'eventId' })` | Membro `write`/`manage` da organização dona do evento ou `ADMIN` (`GOL-206`) | **`404 Not Found`** | **`403 Forbidden`** (membro `read`) |

> **Prevenção contra enumeração (`404` vs `403`):** Sempre que a origem do `@OrgAccess` é `{ from: 'event' }`, tentativas de leitura ou escrita por usuários que **não pertencem** à organização dona do evento (ou cujo convite ainda está `pending`/`rejected`) recebem **`404 Not Found`** (`Evento <id> não encontrado`), ocultando a existência de rascunhos de outras organizações. Membros ativos da organização que possuem apenas nível inferior ao exigido (ex.: `read` tentando editar um lote ou `write` tentando cancelar o evento) recebem **`403 Forbidden`**.

---

## 3. Contratos de Gerenciamento de Eventos (`/events`)

### 3.1. Criar Evento (`POST /events`)

Cria um evento vinculado à organização `organizerId` e ao local `venueId`. Todo evento recém-criado nasce com `status = 'draft'` (rascunho) e `featured = false` (a menos que seja criado por um `ADMIN` global informando `featured: true`).

- **Autorização:** `@OrgAccess('write', { from: 'body', field: 'organizerId' })`.

#### Corpo da Requisição (`CreateEventDto`)

| Campo | Tipo | Obrigatório | Validação e Regras |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Sim | Nome do evento (máximo de 255 caracteres). |
| `organizerId` | `string (uuid)` | Sim | UUID da organização responsável (deve existir e o usuário deve ter nível `write` ou `manage` nela). |
| `venueId` | `string (uuid)` | Sim | UUID do local do evento (deve existir na tabela `venues`). |
| `startDate` | `string (ISO 8601)` | Sim | Data/hora de início do evento. |
| `endDate` | `string (ISO 8601)` | Sim | Data/hora de término (`endDate` deve ser estritamente posterior a `startDate`). |
| `salesStartDate` | `string (ISO 8601)` | Não | Data/hora de abertura das vendas (`salesStartDate <= startDate`). |
| `description` | `string` | Não | Descrição detalhada do evento. |
| `ageRating` | `'L' \| '10' \| '12' \| '14' \| '16' \| '18'` | Não | Classificação indicativa (padrão `'L'` no banco). |
| `category` | `string` | Não | Categoria do evento (máximo de 100 caracteres, ex.: `"Festa"`, `"Congresso"`). |
| `edition` | `string` | Não | Edição do evento (máximo de 100 caracteres, ex.: `"2027.1"`). |
| `photoUrl` | `string (url)` | Não | URL da imagem de capa (máximo de 2048 caracteres). |
| `featured` | `boolean` | Não | Destaque na página inicial. **Restrito a `role = 'ADMIN'`** (qualquer outro usuário que enviar `featured` recebe `403 Forbidden`). |

#### Exemplo de Payload (`POST /events`)

```json
{
  "name": "Calourada Hubee",
  "description": "Recepção oficial dos ingressantes com atrações musicais.",
  "ageRating": "18",
  "organizerId": "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  "venueId": "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  "startDate": "2027-03-20T19:00:00.000Z",
  "endDate": "2027-03-21T02:00:00.000Z",
  "salesStartDate": "2027-02-01T12:00:00.000Z",
  "category": "Festa",
  "edition": "1ª Edição"
}
```

#### Resposta de Sucesso (`201 Created` — `EventResponseDto`)

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "Calourada Hubee",
  "description": "Recepção oficial dos ingressantes com atrações musicais.",
  "ageRating": "18",
  "organizerId": "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  "venueId": "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
  "startDate": "2027-03-20T19:00:00.000Z",
  "endDate": "2027-03-21T02:00:00.000Z",
  "salesStartDate": "2027-02-01T12:00:00.000Z",
  "status": "draft",
  "category": "Festa",
  "edition": "1ª Edição",
  "photoUrl": null,
  "featured": false,
  "createdAt": "2026-11-09T18:00:00.000Z",
  "updatedAt": "2026-11-09T18:00:00.000Z"
}
```

#### Respostas de Erro (`POST /events`)

- **`400 Bad Request`:**
  - `A data de término deve ser posterior à data de início` (`endDate <= startDate`).
  - `A data de início das vendas não pode ser posterior ao início do evento` (`salesStartDate > startDate`).
  - Campos obrigatórios ausentes ou formatos inválidos.
- **`401 Unauthorized`:** Token JWT ausente ou inválido.
- **`403 Forbidden`:**
  - Usuário sem vínculo `write`/`manage` na organização `organizerId` (`Acesso negado`).
  - Usuário não-`ADMIN` tentando informar `featured` (`Apenas administradores podem destacar eventos na página inicial`).
- **`404 Not Found`:** `Organização <id> não encontrada` ou `Local <id> não encontrado`.

---

### 3.2. Atualizar ou Publicar Evento (`PATCH /events/:id`)

Atualiza parcialmente os dados de um evento existente ou altera seu `status` (`draft`, `published`, `finished`, `cancelled`).

- **Autorização:** `@OrgAccess('write', { from: 'event', param: 'id' })`.
- **Regras adicionais de negócio no `EventService.update`:**
  1. **Imutabilidade de organização:** O `UpdateEventDto` não aceita `organizerId` (um evento não pode ser transferido de organização).
  2. **Evento cancelado é imutável:** Se o evento já estiver com `status === 'cancelled'`, qualquer tentativa de `PATCH` retorna **`422 Unprocessable Entity`** (`Evento cancelado não pode ser alterado`).
  3. **Cancelamento via `PATCH` exige `manage`:** Se o payload enviar `"status": "cancelled"`, o serviço chama `ensureCanCancel` e exige nível **`manage`** na organização (ou `ADMIN` global), retornando **`403 Forbidden`** (`Apenas administradores da organização podem cancelar o evento`) para membros que possuem apenas `write`.
  4. **Validação cruzada de datas:** Se apenas `startDate`, `endDate` ou `salesStartDate` for enviado, a validação de período (`endDate > startDate` e `salesStartDate <= startDate`) combina os campos enviados no DTO com as datas já salvas no evento.

#### Exemplo de Payload (`PATCH /events/:id` — Publicação)

```json
{
  "name": "Calourada Hubee — Edição Oficial",
  "status": "published"
}
```

#### Respostas (`PATCH /events/:id`)

- **`200 OK`:** Retorna o `EventResponseDto` atualizado.
- **`400 Bad Request`:** Datas inconsistentes ou UUID inválido.
- **`403 Forbidden`:** Membro `read` tentando editar, membro `write` tentando enviar `status: "cancelled"`, ou não-`ADMIN` enviando `featured`.
- **`404 Not Found`:** Evento inexistente, pertencente a outra organização, ou `venueId` informado não encontrado.
- **`422 Unprocessable Entity`:** `Evento cancelado não pode ser alterado`.

---

### 3.3. Atualizar Foto de Capa do Evento (`PATCH /events/:id/photo`)

Realiza o upload da imagem de capa do evento para o serviço de armazenamento (`StorageService` / Vercel Blob) no caminho `events/<eventId>/cover.<jpg|png>`, atualiza o campo `photoUrl` do evento e remove a foto anterior caso existisse (`GOL-221`).

- **Autorização:** `@OrgAccess('write', { from: 'event', param: 'id' })`.
- **Formato:** `multipart/form-data` com o arquivo no campo `file`.
- **Validações da imagem (`validateImageUpload`):**
  - Tipos MIME aceitos (conferidos também por *magic bytes*): `image/jpeg` (`.jpg` / `.jpeg`) e `image/png` (`.png`).
  - Tamanho máximo: **2 MB** (`2 * 1024 * 1024` bytes).
- **Respostas:**
  - **`200 OK`:** Retorna `EventResponseDto` com o novo `photoUrl`.
  - **`400 Bad Request`:** Arquivo ausente ou formato diferente de JPEG/PNG.
  - **`413 Payload Too Large`:** Arquivo acima de 2 MB.
  - **`422 Unprocessable Entity`:** `Evento cancelado não pode ser alterado`.
  - **`503 Service Unavailable`:** `Não foi possível enviar a imagem. Tente novamente.` (em caso de falha no provedor de storage).

---

### 3.4. Cancelar Evento (`DELETE /events/:id`)

Cancela o evento alterando seu `status` para `'cancelled'` (não remove a linha do banco de dados, preservando o histórico de pedidos e ingressos).

- **Autorização:** `@OrgAccess('manage', { from: 'event', param: 'id' })` — exclusivo para administradores da organização (`role = 'admin'`, `permission = 'full'`) ou `ADMIN` global.
- **Respostas:**
  - **`204 No Content`:** Evento cancelado com sucesso (sem corpo de resposta).
  - **`403 Forbidden`:** Membro da organização com nível `read` ou `write`.
  - **`404 Not Found`:** Evento inexistente ou usuário não pertence à organização dona do evento.
  - **`422 Unprocessable Entity`:** `Evento já está cancelado`.

---

### 3.5. Gerar Rascunho com IA (`POST /events/ai-draft`)

Recebe a descrição do evento em linguagem natural e devolve um rascunho estruturado do evento e dos lotes, gerado pelo Claude (Anthropic). **Nada é salvo nem publicado:** o rascunho preenche o formulário de criação, o organizador revisa e edita, e o evento só passa a existir com o [`POST /events`](#31-criar-evento-post-events). Também não cria local: `venueSuggestion` é só uma sugestão para o organizador escolher ou cadastrar o local.

- **Autorização:** `@OrganizerOnly()` (membro aceito de qualquer organização, ou `ADMIN`) e `@AiRateLimited()` (limite de gerações por usuário). Quem não é organizador recebe `403` sem gastar a cota.
- **Resposta:** `200 OK`, já que nada é criado.
- **Configuração:** chave da Anthropic, limites e custo estão em [Integração com IA](./integracao-ia.md).

#### Corpo da Requisição (`GenerateEventDraftDto`)

| Campo | Tipo | Obrigatório | Validação e Regras |
| :--- | :--- | :---: | :--- |
| `prompt` | `string` | Sim | Descrição do evento em texto livre, com no máximo 2000 caracteres. Espaços nas pontas são removidos antes da validação. |

Qualquer outro campo no corpo responde `400` (`property <campo> should not exist`).

#### Exemplo de Payload (`POST /events/ai-draft`)

```json
{
  "prompt": "Festa Junina da Engenharia, 3ª edição, no sábado que vem das 20h às 2h no Ginásio da Unifesp, Rua Talim 330, São José dos Campos - SP. Proibido para menores de 18. 1º lote inteira a R$ 30 e meia-entrada, 200 ingressos de cada."
}
```

#### Resposta de Sucesso (`200 OK` — `EventAiDraftResponseDto`)

```json
{
  "name": "Festa Junina da Engenharia",
  "description": "A Festa Junina da Engenharia chega à 3ª edição no Ginásio da Unifesp, em São José dos Campos. A festa vai das 20h às 2h e é proibida para menores de 18 anos.",
  "category": "festas",
  "ageRating": "18",
  "edition": "3ª edição",
  "startDate": "2026-11-28T20:00:00-03:00",
  "endDate": "2026-11-29T02:00:00-03:00",
  "venueSuggestion": {
    "name": "Ginásio da Unifesp",
    "address": "Rua Talim, 330",
    "city": "São José dos Campos",
    "state": "SP"
  },
  "suggestedTicketTypes": [
    { "batch": "1º lote", "price": 30, "quantity": 200, "modality": "inteira" },
    { "batch": "1º lote", "price": 15, "quantity": 200, "modality": "meia" }
  ],
  "missingFields": []
}
```

| Campo | Tipo | Conteúdo |
| :--- | :--- | :--- |
| `name` | `string \| null` | Nome do evento. Sem nome explícito, a IA cria um título curto e fiel à descrição. Até 255 caracteres. |
| `description` | `string \| null` | Texto de divulgação em pt-BR, só com fatos da descrição. |
| `category` | `'festas' \| 'shows' \| 'palestras' \| 'esportes' \| 'academicos' \| 'outros' \| null` | Sempre um valor de `EVENT_CATEGORIES`. |
| `ageRating` | `'L' \| '10' \| '12' \| '14' \| '16' \| '18' \| null` | Preenchido só quando a descrição fala de restrição de idade. |
| `edition` | `string \| null` | Preenchido só quando a descrição cita a edição. Até 100 caracteres. |
| `startDate`, `endDate` | `string (ISO 8601 com fuso) \| null` | Datas relativas ("sábado que vem") são resolvidas a partir da data atual em `America/Sao_Paulo`. Sem horário, o campo fica `null`. `endDate` é sempre posterior a `startDate`. |
| `venueSuggestion` | `object \| null` | `{ name, address, city, state }`, cada parte `string \| null`. `state` é sempre a sigla da UF (`SP`). `null` quando nenhum local é citado. |
| `suggestedTicketTypes` | `array` | Um item por lote citado: `batch` (`string`, até 100), `price` (`number \| null`, em reais, até 2 casas, `0` para evento gratuito), `quantity` (`integer \| null`) e `modality` (`'inteira' \| 'meia' \| 'estudante' \| 'vip' \| 'cortesia' \| null`). Lista vazia quando a descrição não fala de ingressos. |
| `missingFields` | `string[]` | Campos que a IA não conseguiu inferir e o organizador precisa revisar. |

Os campos seguem os mesmos valores aceitos por `CreateEventDto` e `CreateTicketTypeDto`, então o rascunho pode ir para o formulário sem conversão. O que falta para criar o evento de verdade (`organizerId`, `venueId` e as datas que vierem `null`) o organizador preenche.

#### Como `missingFields` é preenchido

A API recalcula `missingFields` depois de validar a resposta da IA, então a lista é sempre coerente com o rascunho:

- Entra todo campo de topo que ficou `null`: `name`, `description`, `category`, `ageRating`, `edition`, `startDate`, `endDate` e `venueSuggestion`.
- Entra `suggestedTicketTypes` quando a lista de lotes está vazia.
- A ordem é sempre a da tabela acima.
- Campos dentro de `venueSuggestion` e dos lotes que vierem `null` (por exemplo, `quantity`) não entram na lista: o próprio `null` indica o que revisar.

Antes de devolver o rascunho, a API também corrige pequenos desvios da IA em vez de recusar tudo:

- Texto em branco vira `null`, e textos acima do limite são cortados.
- `state` que não seja uma sigla de 2 letras vira `null`.
- Preço é arredondado para 2 casas; preço ou quantidade negativos viram `null`.
- `endDate` anterior a `startDate` anula as duas datas, que entram em `missingFields`.

Desvios de estrutura (tipo errado, valor fora dos enums, campo extra) não são corrigidos e respondem `503`.

#### Respostas de Erro (`POST /events/ai-draft`)

- **`400 Bad Request`:**
  - `Descreva o evento para gerar o rascunho.` (`prompt` ausente, vazio ou só com espaços).
  - `A descrição do evento deve ser um texto.` (`prompt` que não é string).
  - `A descrição do evento deve ter no máximo 2000 caracteres.`
  - `property <campo> should not exist` (campo extra no corpo).
- **`401 Unauthorized`:** Token JWT ausente ou inválido.
- **`403 Forbidden`:** `Acesso restrito a organizadores de eventos` (usuário sem organização aceita).
- **`422 Unprocessable Entity`:** `Não foi possível gerar uma resposta com IA para esse texto. Reformule e tente novamente.` (a IA recusou a descrição).
- **`429 Too Many Requests`:** `Você atingiu o limite de gerações com IA. Tente novamente em N segundos.`, com o cabeçalho `Retry-After` em segundos. O limite é por usuário (padrão: 5 gerações por minuto) e uma chamada com corpo inválido também conta.
- **`503 Service Unavailable`:**
  - `A geração com IA não está disponível no momento. Tente novamente em instantes.` (API sem `ANTHROPIC_API_KEY`, timeout, falha ou limite do provedor).
  - `Não foi possível gerar o rascunho do evento com IA. Tente novamente em instantes.` (resposta da IA fora do formato esperado).

---

## 4. Contratos de Lotes de Ingressos (`/events/:eventId/ticket-types`)

Os lotes de ingressos são sub-recursos de um evento (`/events/:eventId/ticket-types`). Todas as rotas validam primeiro se o `:eventId` existe e se o lote `:id` pertence de fato àquele `:eventId` (`TicketTypeService.findOneByEvent`).

### 4.1. Criar Lote de Ingressos (`POST /events/:eventId/ticket-types`)

Cadastra um novo lote de ingressos para o evento (`GOL-206`).

- **Autorização:** `@OrgAccess('write', { from: 'event', param: 'eventId' })`.

#### Corpo da Requisição (`CreateTicketTypeDto`)

| Campo | Tipo | Obrigatório | Validação |
| :--- | :--- | :---: | :--- |
| `batch` | `string` | Sim | Identificação do lote (ex.: `"1º Lote Promocional"`, `"Lote VIP"`), entre 1 e 50 caracteres. |
| `price` | `number` | Sim | Preço unitário com até 2 casas decimais (`>= 0`, máximo `99999999.99`). Aceita `0` para lotes gratuitos. |
| `quantity` | `number (int)` | Não | Capacidade total do lote (`int >= 0`). Se omitido (`null`), o lote não possui limite máximo fixo. |

#### Exemplo de Payload (`POST /events/:eventId/ticket-types`)

```json
{
  "batch": "1º Lote Promocional",
  "price": 35.00,
  "quantity": 100
}
```

#### Resposta de Sucesso (`201 Created` — `TicketTypeResponseDto`)

```json
{
  "id": "3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f6a",
  "eventId": "11111111-1111-4111-8111-111111111111",
  "batch": "1º Lote Promocional",
  "price": 35,
  "quantity": 100,
  "createdAt": "2026-11-09T18:05:00.000Z",
  "updatedAt": "2026-11-09T18:05:00.000Z"
}
```

---

### 4.2. Listar e Consultar Lotes (`GET /events/:eventId/ticket-types` e `GET /events/:eventId/ticket-types/:id`)

Retorna todos os lotes do evento (ordenados por `createdAt ASC`, `price ASC`, `id ASC`) ou um lote específico, enriquecidos com o saldo disponível em tempo real no campo `available` (`GOL-212` e `GOL-216`).

- **Autorização:** `OptionalJwtAuthGuard` + `EventService.findVisible(eventId, user)`.
  - Se o evento estiver `published`, qualquer visitante pode consultar os lotes.
  - Se o evento estiver em `draft`, `finished` ou `cancelled`, apenas membros aceitos da organização do evento e `ADMIN` recebem `200 OK`; demais chamadas recebem `404 Not Found`.

#### Cálculo do Estoque Comprometido e Saldo (`available`)

Para cada lote cujo `quantity` não é `null`, o repositório calcula a quantidade comprometida (`committed`) evitando dupla contagem entre reservas de pedidos e ingressos já emitidos (`GOL-212` / `GOL-216`):

```text
committed = emitidos_ativos + reservados_em_pedidos_sem_ingresso
available = max(0, quantity - committed)
```

- **Ingressos emitidos ativos (`emitidos_ativos`):** linhas em `tickets` com `status IN ('valid', 'used')` (ingressos `cancelled` liberam a vaga de volta ao lote).
- **Pedidos ativos ainda não emitidos (`reservados_em_pedidos_sem_ingresso`):** para cada pedido com `status IN ('pending', 'paid')`, considera-se `max(0, order_items.quantity - tickets_nao_cancelados_do_pedido_no_lote)`.

#### Exemplo de Resposta (`200 OK` — `GET /events/:eventId/ticket-types`)

```json
[
  {
    "id": "3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f6a",
    "eventId": "11111111-1111-4111-8111-111111111111",
    "batch": "1º Lote Promocional",
    "price": 35,
    "quantity": 100,
    "available": 92,
    "createdAt": "2026-11-09T18:05:00.000Z",
    "updatedAt": "2026-11-09T18:05:00.000Z"
  }
]
```

---

### 4.3. Atualizar Lote de Ingressos (`PATCH /events/:eventId/ticket-types/:id`)

Atualiza parcialmente `batch`, `price` e/ou `quantity` de um lote pertencente ao evento (`GOL-206` / `GOL-212`).

- **Autorização:** `@OrgAccess('write', { from: 'event', param: 'eventId' })`.
- **Trava de integridade de estoque (`GOL-212`):** Quando `quantity` é enviado no payload, a atualização roda dentro de uma transação com *lock* pessimista (`SELECT ... FOR UPDATE`) sobre a linha do lote e confere o total comprometido (`committed`). Se `dto.quantity < committed`, a API rejeita a alteração com **`422 Unprocessable Entity`**:
  ```json
  {
    "message": "Quantidade não pode ser menor que a já comprometida (8)",
    "error": "Unprocessable Entity",
    "statusCode": 422
  }
  ```

---

### 4.4. Remover Lote de Ingressos (`DELETE /events/:eventId/ticket-types/:id`)

Remove um lote de ingressos do evento caso ainda não existam vendas ou reservas vinculadas a ele (`GOL-206`).

- **Autorização:** `@OrgAccess('write', { from: 'event', param: 'eventId' })`.
- **Proteção de integridade referencial (`409 Conflict`):** Antes de excluir, o `TicketTypeService.remove` verifica se o lote possui registros em `tickets` ou em `order_items` (`hasLinkedRecords`). Caso exista qualquer ingresso ou pedido vinculado, a exclusão é bloqueada com **`409 Conflict`**:
  ```json
  {
    "message": "Lote possui ingressos ou pedidos vinculados e não pode ser removido",
    "error": "Conflict",
    "statusCode": 409
  }
  ```
- **Sucesso:** Retorna **`204 No Content`** quando o lote é removido.

---

## 5. Testando o Fluxo Completo no Bruno (`hubee-collections`)

As pastas `EVENTOS/` e `LOTES DE INGRESSO/` no repositório [`hubee-collections`](./collections.md) disponibilizam a sequência de requisições para exercitar todo o gerenciamento de eventos e lotes usando `{{baseUrl}}`, `{{tokenOrganizador}}`, `{{eventId}}` e `{{ticketTypeId}}`:

| Ordem | Requisição | Método e Rota | Comportamento / Variáveis Salvas |
| :---: | :--- | :--- | :--- |
| `1` | `EVENTOS/POST CRIAR EVENTO.yml` | `POST {{baseUrl}}/events` | Cria o evento em `draft` com `{{tokenOrganizador}}` e grava o `id` em `{{eventId}}`. |
| `2` | `EVENTOS/POST CRIAR EVENTO SEM PERMISSAO.yml` | `POST {{baseUrl}}/events` | Valida o bloqueio `403 Forbidden` quando chamado com `{{tokenComprador}}`. |
| `3` | `EVENTOS/POST GERAR RASCUNHO COM IA.yml` | `POST {{baseUrl}}/events/ai-draft` | Gera um rascunho com `{{tokenOrganizador}}` e confere o payload: campos, enums, datas, lotes e `missingFields` coerente. Não salva nada. |
| `4` | `EVENTOS/POST GERAR RASCUNHO COM IA SEM PERMISSAO.yml` | `POST {{baseUrl}}/events/ai-draft` | Valida o bloqueio `403 Forbidden` quando chamado com `{{tokenComprador}}`. |
| `5` | `EVENTOS/PATCH ATUALIZAR EVENTO.yml` | `PATCH {{baseUrl}}/events/:id` | Atualiza dados do evento `{{eventId}}` e publica (`status: "published"`), validando `200 OK`. |
| `6` | `LOTES DE INGRESSO/POST CRIAR LOTE.yml` | `POST {{baseUrl}}/events/:eventId/ticket-types` | Cria um lote no evento `{{eventId}}` e grava o `id` em `{{ticketTypeId}}`. |
| `7` | `LOTES DE INGRESSO/GET LISTAR LOTES.yml` | `GET {{baseUrl}}/events/:eventId/ticket-types` | Lista os lotes de `{{eventId}}` conferindo o retorno em array e o campo `available`. |
| `8` | `LOTES DE INGRESSO/PATCH ATUALIZAR LOTE.yml` | `PATCH {{baseUrl}}/events/:eventId/ticket-types/:id` | Atualiza `batch`, `price` e `quantity` do lote `{{ticketTypeId}}` (`200 OK`). |
| `9` | `LOTES DE INGRESSO/DELETE REMOVER LOTE.yml` | `DELETE {{baseUrl}}/events/:eventId/ticket-types/:id` | Remove o lote `{{ticketTypeId}}` quando não há pedidos/ingressos vinculados (`204 No Content`). |
| `10` | `EVENTOS/DELETE CANCELAR EVENTO.yml` | `DELETE {{baseUrl}}/events/:id` | Cancela o evento `{{eventId}}` exigindo nível `manage` (`204 No Content`). |

O rascunho com IA (`3`) só responde `200` se a API tiver `ANTHROPIC_API_KEY`. Sem ela, como no ambiente `local` sem chave, a requisição responde `503` e o teste de status mostra a mensagem da API. Em `production` ela não altera dados, mas consome tokens pagos e a cota do organizador.

---

## 6. Onde está no código (`hubee-api`)

| Arquivo | Responsabilidade |
| :--- | :--- |
| `src/event/event.controller.ts` | Rotas `POST /events`, `GET /events`, `GET /events/summary`, `GET /events/:id`, `PATCH /events/:id`, `PATCH /events/:id/photo` e `DELETE /events/:id`. |
| `src/event/ai-draft/event-ai-draft.controller.ts` | Rota `POST /events/ai-draft` (`@AiRateLimited()` + `@OrganizerOnly()`). |
| `src/event/ai-draft/event-ai-draft.service.ts` | Chama o `AiService`, valida a resposta com `class-validator`, corrige desvios de formato e recalcula `missingFields`. |
| `src/event/ai-draft/event-ai-draft.prompt.ts` e `event-ai-draft.schema.ts` | Prompt de sistema em pt-BR e JSON schema da saída estruturada. |
| `src/event/dto/generate-event-draft.dto.ts` e `event-ai-draft-response.dto.ts` | Corpo (`GenerateEventDraftDto`) e rascunho (`EventAiDraftResponseDto`). |
| `src/event/event.service.ts` | Regras de visibilidade (`findAll`, `findVisible`), criação, edição, upload de capa, destaque (`ensureCanFeature`) e cancelamento (`ensureCanCancel`). |
| `src/ticket-type/ticket-type.controller.ts` | Rotas `POST`, `GET`, `PATCH` e `DELETE` em `/events/:eventId/ticket-types`. |
| `src/ticket-type/ticket-type.service.ts` | Validação de vínculo lote-evento, trava transacional de estoque (`quantity >= committed`) e bloqueio `409` de exclusão com vínculos. |
| `src/ticket-type/ticket-type.repository.ts` | Cálculo SQL de `countCommitted` / `withAvailable` e lock pessimista `findByIdForUpdate`. |
| `src/venue/venue.controller.ts` | Rota `POST /venues` protegida por `@OrgAccess('write', { from: 'any' })` e rotas administrativas `PATCH`/`DELETE /venues/:id` (`@AdminOnly()`). |
