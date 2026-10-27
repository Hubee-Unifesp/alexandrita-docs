---
sidebar_position: 6.5
title: Detalhes do Evento
description: Especificação visual e telas do Figma da página de detalhes do evento (desktop e mobile, temas claro e escuro, skeleton e 404).
---

# Detalhes do Evento

Esta página reúne todas as informações públicas de um evento para o visitante: capa, título, data e horário, categoria, classificação indicativa, descrição completa, local com endereço, organização realizadora e lotes de ingressos disponíveis para compra.

Os dados exibidos na interface são carregados a partir do endpoint [`GET /events/:id`](../backend/detalhes-evento.md) da `hubee-api`. Os layouts foram desenhados para **Desktop** e **Mobile (375px)**, nos temas **claro** e **escuro**, seguindo o UI Kit do Hubee.

## Design no Figma

- [Página de Detalhes do Evento — Figma](https://www.figma.com/design/Lyao4zQ1m2LUEOVbh7Cp1E/Sem-t%C3%ADtulo?node-id=6-2&t=kGeg8j7FkommC07H-1)

## Anatomia da Interface e Mapeamento de Dados

| Seção da Tela | Elementos Visuais | Campos do `EventDetailResponseDto` (`GET /events/:id`) |
| --- | --- | --- |
| **Hero / Cabeçalho do Evento** | Imagem de capa em destaque, título do evento, data/hora de início e término, badges de categoria e classificação indicativa | `photoUrl`, `name`, `startDate`, `endDate`, `category`, `ageRating`, `edition` |
| **Descrição ("Sobre o evento")** | Texto descritivo com preservação de quebras de linha e botão de expansão ("Ver mais") em textos longos | `description` |
| **Local ("Onde a gente se encontra")** | Nome do espaço, capacidade máxima, endereço formatado (rua, número, complemento, bairro, cidade/UF e CEP) e atalho "Ver no mapa" | `venue.name`, `venue.maxCapacity`, `venue.address` (`street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zipCode`) |
| **Organização ("Quem faz acontecer")** | Nome e descrição da organização realizadora do evento com link para o perfil | `organization.id`, `organization.name`, `organization.description` |
| **Ingressos / Lotes** | Lista ordenada de cards de lotes com nome do lote, valor formatado em reais (`R$`), disponibilidade (disponível ou esgotado) e ação "Comprar" | `ticketTypes[]` (`id`, `batch`, `price`, `quantity`) |

## Telas Principais (Desktop e Mobile)

### Desktop

![Detalhes do evento — Desktop](/img/detalhes-evento-desktop.png)

#### Variação Dark Mode (Desktop)

![Detalhes do evento — Desktop escuro](/img/gol-138/desktop/desktop-dark.png)

### Mobile (375px)

![Detalhes do evento — Mobile](/img/detalhes-evento-mobile.png)

#### Variação Dark Mode (Mobile)

![Detalhes do evento — Mobile escuro](/img/gol-138/mobile/mobile-dark.png)

## Estados de Interface

### 1. Carregando (*Loading Skeleton*)
Enquanto a requisição ao endpoint `GET /events/:id` está em andamento, a interface exibe *skeletons* mantendo a estrutura visual da página para evitar *layout shift*.

![Skeleton — Desktop claro](/img/gol-138/skeleton/skeleton-desktop-light.png)

![Skeleton — Desktop escuro](/img/gol-138/skeleton/skeleton-desktop-dark.png)

![Skeleton — Mobile claro](/img/gol-138/skeleton/skeleton-mobile-light.png)

![Skeleton — Mobile escuro](/img/gol-138/skeleton/skeleton-mobile-dark.png)

### 2. Evento Não Encontrado (`404 Not Found`)
Exibido quando o `id` da URL não corresponde a um evento existente ou quando o evento não está publicado (`draft`, `finished` ou `cancelled`) para visitantes e usuários comuns, oferecendo o botão **"Voltar para a Home"**.

![Evento não encontrado — Desktop claro](/img/gol-138/not-found/not-found-desktop-light.png)

![Evento não encontrado — Desktop escuro](/img/gol-138/not-found/not-found-desktop-dark.png)

![Evento não encontrado — Mobile claro](/img/gol-138/not-found/not-found-mobile-light.png)

![Evento não encontrado — Mobile escuro](/img/gol-138/not-found/not-found-mobile-dark.png)
