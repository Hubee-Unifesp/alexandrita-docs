---
sidebar_position: 12
title: Carrinho de Compras
description: Especificação visual e fluxo do carrinho de compras para revisão de ingressos antes do checkout no Hubee.
---

# Carrinho de Compras

Esta página registra o escopo visual e o fluxo do carrinho de compras definido na GOL-174. A interface permite a revisão dos ingressos selecionados antes do checkout e deve ser consistente com o UI Kit do Hubee, contemplando desktop e mobile nos temas claro e escuro.

## Escopo da interface

- Drawer e/ou página de carrinho (`/carrinho`) com a listagem dos ingressos selecionados.
- Controles de incremento e decremento de quantidade (`-` / `+`) e remoção de item.
- Resumo de valores contendo subtotal, taxas e total estimado, além do botão para prosseguir ao checkout.
- Estados de tela:
  - Carrinho vazio (*EmptyState*) com chamada para explorar eventos.
  - Alerta de limite de ingressos por pedido atingido.
  - Estado de carregamento com *skeleton*.

## Responsividade e temas

O desenho contempla uma versão desktop e uma versão mobile com largura de referência de 375 px. Todos os componentes e estados são apresentados nos temas claro e escuro, preservando contraste, hierarquia visual e legibilidade.

## Referências do Figma

- **Arquivo de referência do UI Kit:** [Login - Register Web UI Kit](https://www.figma.com/design/w9RzqTwHLmRL21duj4DzRF/Login---Register-Web-UI-Kit--Freebie---Community---Copy-?node-id=3012-2343&t=WnlDZpumdc6K7YAH-0).

![Tela de compra - tema claro (desktop)](/img/tela-compra-claro-desktop.png)

![Tela de compra - tema escuro (desktop)](/img/tela-compra-escuro-desktop.png)

