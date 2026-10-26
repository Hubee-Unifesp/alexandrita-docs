---
sidebar_position: 6.5
title: Página de Detalhes do Evento
description: Layout da página de detalhes do evento (desktop e mobile, temas claro e escuro), incluindo estados de loading e evento não encontrado.
---

# Página de Detalhes do Evento

Esta página reúne todas as informações de um evento para o visitante: capa, data e horário, classificação indicativa, descrição, local, organização realizadora e os lotes de ingressos. Os layouts foram desenhados para desktop e mobile (375px), nos temas claro e escuro, seguindo o UI Kit do Hubee.

## Design no Figma

[Página de Detalhes do Evento — Figma](https://www.figma.com/design/Lyao4zQ1m2LUEOVbh7Cp1E/Sem-t%C3%ADtulo?node-id=6-2&t=kGeg8j7FkommC07H-1)

## Estrutura da Página

* **Hero:** Foto de capa do evento (`photoUrl`), título, data/hora e badges de categoria e classificação indicativa (`ageRating`).
* **Descrição:** Texto longo do evento (`description`) com suporte a quebras de linha e opção "Ver mais".
* **Local:** Bloco "Onde a gente se encontra" com nome do local e endereço completo (`venue`: rua, número, bairro, cidade, estado e CEP), além do link "Ver no mapa".
* **Organização:** Bloco "Quem faz acontecer" com a identificação da organização realizadora (`organizer`) e link para o perfil.
* **Ingressos:** Cards de lotes (`ticketTypes`) com nome do lote, preço formatado em R$, status (disponível ou esgotado) e botão "Comprar".

## Desktop

### Versão Clara (Light Mode)
![Detalhes do evento — Desktop claro](/img/gol-138/desktop/desktop-light.png)

### Versão Escura (Dark Mode)
![Detalhes do evento — Desktop escuro](/img/gol-138/desktop/desktop-dark.png)

## Mobile

### Versão Clara (Light Mode)
![Detalhes do evento — Mobile claro](/img/gol-138/mobile/mobile-light.png)

### Versão Escura (Dark Mode)
![Detalhes do evento — Mobile escuro](/img/gol-138/mobile/mobile-dark.png)

## Estados de Tela

### Carregando (Loading Skeleton)
Enquanto os dados do evento são carregados, a página exibe placeholders com a mesma estrutura do layout final.

![Skeleton — Desktop claro](/img/gol-138/skeleton/skeleton-desktop-light.png)

![Skeleton — Desktop escuro](/img/gol-138/skeleton/skeleton-desktop-dark.png)

![Skeleton — Mobile claro](/img/gol-138/skeleton/skeleton-mobile-light.png)

![Skeleton — Mobile escuro](/img/gol-138/skeleton/skeleton-mobile-dark.png)

### Evento Não Encontrado
Exibido quando o evento não existe ou ainda não foi publicado (404), com o botão "Voltar para a Home".

![Evento não encontrado — Desktop claro](/img/gol-138/not-found/not-found-desktop-light.png)

![Evento não encontrado — Desktop escuro](/img/gol-138/not-found/not-found-desktop-dark.png)

![Evento não encontrado — Mobile claro](/img/gol-138/not-found/not-found-mobile-light.png)

![Evento não encontrado — Mobile escuro](/img/gol-138/not-found/not-found-mobile-dark.png)
