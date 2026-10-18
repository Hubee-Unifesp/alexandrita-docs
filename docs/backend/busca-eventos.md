---
sidebar_position: 4
title: Busca de eventos
description: Contrato do GET /events na hubee-api, com query params, filtros, paginação, menor preço e erros de validação.
---

# Busca de eventos

O endpoint `GET /events` lista os eventos com busca por texto, filtros e
paginação. É a base da tela de busca da Webpage (integração na task GOL-135).

Para a lista da home (destaques, esta semana, esgotando), a Webpage usa
`GET /events/summary`, que não tem filtros nem paginação.

## Acesso

A rota é pública, e o token é opcional:

| Quem chama | O que vê |
| --- | --- |
| Visitante (sem `Authorization`) | Só eventos `published` |
| Usuário logado (`USER`) | Só eventos `published` |
| Administrador (`ADMIN`) | Eventos em qualquer status |
| Token enviado, mas inválido ou expirado | `401` |

Para quem não é `ADMIN`, o filtro `status` é ignorado e trocado por
`published`. Assim, um visitante não descobre rascunhos ou eventos cancelados
passando `?status=draft`.

Um token inválido responde `401` em vez de cair na visão pública. Isso evita
que o cliente receba a lista de visitante achando que está logado.

## Query params

Todos são opcionais. Parâmetros que não estão na lista respondem `400`, porque o
`ValidationPipe` global usa `forbidNonWhitelisted`.

| Parâmetro | Tipo | Regra |
| --- | --- | --- |
| `search` | texto | Busca no nome **ou** na descrição. Até 255 caracteres; não pode ser vazio. |
| `category` | texto | Categoria exata, sem diferenciar maiúsculas (`shows` encontra `Shows`). Não pode ser vazia. |
| `city` | texto | Cidade exata do local, sem diferenciar maiúsculas. Não pode ser vazia. |
| `startDate` | data | Eventos que **terminam** a partir desta data. |
| `endDate` | data | Eventos que **começam** até esta data. |
| `organizerId` | UUID | Eventos da organização. |
| `venueId` | UUID | Eventos do local. |
| `status` | `draft`, `published`, `finished`, `cancelled` | Só tem efeito para `ADMIN`. |
| `featured` | `true` ou `false` | Eventos em destaque, ou fora dele. |
| `page` | inteiro ≥ 1 | Página. Padrão: `1`. |
| `limit` | inteiro entre 1 e 100 | Itens por página. Padrão: `20`. |

Os filtros se combinam com **E**: o evento precisa atender a todos os
parâmetros enviados.

## Lógica dos filtros

### Busca por texto

`search` procura o texto em qualquer parte do nome ou da descrição, sem
diferenciar maiúsculas (`ILIKE '%texto%'`). Espaços nas extremidades são
removidos.

Os caracteres `%`, `_` e `\` são escapados: buscar `100%` procura literalmente
"100%", em vez de tratar `%` como curinga do SQL.

A busca diferencia acentos: `musica` não encontra "Música".

### Categoria e cidade

`category` e `city` comparam o valor inteiro, não um trecho. Usam `ILIKE` sem
curingas para ignorar maiúsculas, mas continuam diferenciando acentos:
`sao paulo` não encontra "São Paulo".

### Período

`startDate` e `endDate` selecionam eventos que **se sobrepõem** ao período, e
não só os que começam dentro dele:

- `startDate` → `evento.endDate >= startDate`
- `endDate` → `evento.startDate <= endDate`

Assim, um festival de 18 a 22/10 aparece em uma busca de 20 a 21/10, porque
está acontecendo nesse intervalo.

As datas aceitam ISO completo (`2026-10-20T19:00:00Z`) ou só o dia
(`2026-10-20`). Só o dia é interpretado no horário de Brasília (`-03:00`):

- `startDate=2026-10-20` vira `2026-10-20T00:00:00.000-03:00`
- `endDate=2026-10-20` vira `2026-10-20T23:59:59.999-03:00`, para incluir o
  dia inteiro

Com as duas datas, `endDate` precisa ser igual ou posterior a `startDate`.

:::note

A rota não esconde eventos passados por conta própria. Para listar só os
próximos, envie `startDate` com a data de hoje.

:::

## Paginação e ordenação

A paginação é por *offset*: `page=3&limit=20` pula os 40 primeiros e devolve
os 20 seguintes. A contagem (`total`) usa os mesmos filtros da listagem.

`totalPages` é `ceil(total / limit)`, e é `0` quando nenhum evento atende aos
filtros. Uma página além da última responde `200` com `data` vazio e o `meta`
preenchido; não é erro.

A ordem é sempre por `startDate` crescente (os mais próximos primeiro), com
`id` como desempate. O desempate mantém a ordem estável entre páginas: sem
ele, eventos com a mesma data de início poderiam se repetir ou sumir ao trocar
de página.

## Menor preço

Cada item traz `minPrice` e `minPriceBatch`, o preço e o nome do lote usado no
"a partir de R$ X" dos cards:

1. Lotes com ingressos disponíveis vêm primeiro. Disponível quer dizer que a
   quantidade do lote é maior que os ingressos vendidos em pedidos `pago`.
2. Entre eles, vale o menor preço.
3. Se todos os lotes estiverem esgotados, vale o mais barato entre eles.
4. Sem nenhum lote cadastrado, os dois campos vêm `null`.

Um lote esgotado e barato não aparece como "a partir de" se ainda há lotes
disponíveis, porque ninguém consegue comprar por aquele preço.

## Exemplos

### Busca com filtros

```bash
curl "http://localhost:3000/events?search=rock&city=S%C3%A3o%20Paulo&startDate=2026-10-20&page=1&limit=2"
```

Resposta `200`:

```json
{
  "data": [
    {
      "id": "6f1c2a8e-3b4d-4c5e-9f60-7a8b9c0d1e2f",
      "name": "Noite do Rock",
      "description": "Bandas independentes da cena paulistana",
      "ageRating": "16",
      "organizerId": "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
      "venueId": "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e",
      "startDate": "2026-10-24T23:00:00.000Z",
      "endDate": "2026-10-25T04:00:00.000Z",
      "salesStartDate": "2026-09-01T03:00:00.000Z",
      "status": "published",
      "category": "Shows",
      "edition": null,
      "photoUrl": null,
      "featured": true,
      "createdAt": "2026-08-20T12:00:00.000Z",
      "updatedAt": "2026-08-20T12:00:00.000Z",
      "venueName": "Casa de Shows Centro",
      "venueCity": "São Paulo",
      "minPrice": 40,
      "minPriceBatch": "2º lote"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "total": 1,
    "totalPages": 1
  }
}
```

Os campos de cada item são os do evento (`EventResponseDto`), mais
`venueName`, `venueCity`, `minPrice` e `minPriceBatch`.

### Sem resultados

```bash
curl "http://localhost:3000/events?category=inexistente"
```

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

### Erros `400`

Parâmetro inválido segue o formato padrão de validação do NestJS, com
`message` em lista:

```bash
curl "http://localhost:3000/events?limit=200"
```

```json
{
  "message": ["O limite deve ser no máximo 100"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Período invertido é validado no service, e `message` vem como texto:

```bash
curl "http://localhost:3000/events?startDate=2026-10-25&endDate=2026-10-20"
```

```json
{
  "message": "A data final deve ser igual ou posterior à data inicial",
  "error": "Bad Request",
  "statusCode": 400
}
```

Outros casos que respondem `400`:

| Requisição | Motivo |
| --- | --- |
| `?search=` ou `?search=%20%20` | Busca vazia, mesmo depois de remover espaços |
| `?category=` ou `?city=` | Categoria ou cidade vazia |
| `?limit=abc` | Limite não numérico |
| `?page=0` | Página menor que 1 |
| `?startDate=amanha` | Data inválida |
| `?organizerId=123` | Não é UUID |
| `?featured=sim` | Não é `true` nem `false` |
| `?status=aberto` | Status fora da lista |
| `?ordem=preco` | Parâmetro desconhecido |

## Onde está no código

No repositório [`hubee-api`](https://github.com/Hubee-Unifesp/hubee-api):

| Arquivo | Responsabilidade |
| --- | --- |
| `src/event/dto/query-event.dto.ts` | Query params, validação e conversão das datas |
| `src/event/event.controller.ts` | Rota `GET /events` com `OptionalJwtAuthGuard` |
| `src/event/event.service.ts` | Período invertido, visibilidade por papel e montagem do `meta` |
| `src/event/event.repository.ts` | Filtros SQL, menor preço, ordenação e contagem |
| `src/event/dto/event-page-response.dto.ts` | Formato `{ data, meta }` |
| `src/common/pagination/pagination-meta.dto.ts` | `meta` reutilizável em outras listagens |

A documentação interativa fica no Swagger (`/docs`), na tag `events`.
