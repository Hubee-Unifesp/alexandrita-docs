---
sidebar_position: 12
title: Página Sobre o Hubee
description: Especificação visual, handoff para front-end e telas da página institucional Sobre o Hubee (GOL-183).
---

# Página Sobre o Hubee

Esta seção apresenta os desenhos de interface, anatomia dos componentes e guia de handoff visual da página institucional **/sobre** da plataforma Hubee, desenvolvidos no escopo da tarefa **GOL-183**.

- **Origem YouTrack:** [GOL-183 • Modelo da página sobre no figma](https://es-unifesp.youtrack.cloud/issue/GOL-183)
- **Base Técnica:** `hubee-webpage` (Next.js 16, Tailwind CSS 4, shadcn/ui)
- **Documentação Relacionada:** [Guia de Estilo](./guia-de-estilo.md), [Logotipo](./logotipo.md), [Header Navbar](./header-navbar.md) e [Footer](./footer.md)

---

## 1. Visão Geral e Handoff Técnico

A página institucional `/sobre` é uma página pública (sem dependência de autenticação, sessão ou permissões RBAC) que apresenta o propósito da plataforma Hubee, os benefícios para participantes e organizadores, as pessoas que compõem o time e chamadas de ação para descoberta de eventos.

O design contempla variações completas para **Desktop (1440px)** e **Mobile (375px)**, cobrindo os temas **Claro (Light)** e **Escuro (Dark)**.

### Mapa de Componentes e Estrutura

| Bloco Visual | Descrição e Contrato Visual | Destino no Front-end (`hubee-webpage`) |
| :--- | :--- | :--- |
| **Header Público** | Reutilização do componente existente com alternância de tema e ações de login. | `src/components/Header.tsx` |
| **Hero Institucional** | Tag "Institucional", título H1 em destaque forte, subtítulo de posicionamento e indicador de texto institucional. | Rota `/sobre` (`page.tsx`) |
| **O que é o Hubee?** | Bloco em superfície diferenciada (`hubee-100` claro / `hubee-800` escuro) explicando a proposta da plataforma. | Seção dedicada na página `/sobre` |
| **De cada lado do evento** | Grid de dois cartões destacando valor para **Participantes** (ícone de ticket) e **Organizadores** (ícone de calendário). | Componente de cards de valor |
| **Nosso time** | Carrossel horizontal acessível com cards de integrantes, avanço automático com pausa, controles manuais e abertura de diálogo de detalhe. | Componente carrossel / diálogo do time |
| **CTA Final** | Superfície destacada com chamada "Encontre seu próximo evento", botão primário ("Explorar eventos") e secundário ("Quero organizar um evento"). | Bloco opcional de ação |
| **Footer Público** | Rodapé global com link "Sobre o Hubee" em estado ativo (`aria-current="page"`). | `src/components/Footer.tsx` |

---

## 2. Telas da Página Completa

### 2.1. Versões Desktop (1440px)

O layout desktop possui container centralizado de até `1152px` (`max-w-6xl`), espaçamento horizontal de `24px` (`px-6`) e ritmo vertical equilibrado.

#### Tema Claro (Desktop)
![Sobre Hubee - Desktop Claro](/img/sobre/sobre-desktop-1440-light.png)

#### Tema Escuro (Desktop)
![Sobre Hubee - Desktop Escuro](/img/sobre/sobre-desktop-1440-dark.png)

---

### 2.2. Versões Mobile (375px)

Em telas mobile, as seções, cartões de valor e chamadas são empilhados verticalmente com padding horizontal de `16px` (`px-4`), garantindo que não ocorra overflow horizontal.

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Sobre Hubee - Mobile Claro](/img/sobre/sobre-mobile-375-light.png) | ![Sobre Hubee - Mobile Escuro](/img/sobre/sobre-mobile-375-dark.png) |

---

## 3. Seção "Nosso Time" e Detalhe de Integrante

A seção **Nosso time** conta com um carrossel dinâmico acessível e suporte a expansão de conteúdo.

### 3.1. Anatomia e Expansão (Da Foto ao Detalhe)

Ao clicar ou interagir (Enter / Espaço) sobre a foto de um integrante, o card se expande em um diálogo modal acessível preservando a continuidade visual do retrato selecionado:

#### Tema Claro (Detalhe Expandido)
![Time Expandido - Tema Claro](/img/sobre/time-expandido-desktop-1440-light.png)

#### Tema Escuro (Detalhe Expandido)
![Time Expandido - Tema Escuro](/img/sobre/time-expandido-desktop-1440-dark.png)

### 3.2. Especificação da Interação "Da Foto ao Detalhe"

| Estado / Evento | Comportamento no Design & Acessibilidade |
| :--- | :--- |
| **Foto → Detalhe** | Clique, Enter ou Espaço na foto abre o detalhe. O diálogo se expande a partir do retrato selecionado, mantendo a foto no slot ativo. |
| **Fechar → Foto** | Tecla `Escape` ou clique em `Fechar` recolhe o modal e devolve o foco para a foto de origem. O botão de fechar possui área de toque mínima de 44 × 44 px. |
| **Diálogo Acessível** | Diálogo semântico rotulado pelo nome do integrante. O foco é contido no diálogo enquanto aberto, o fundo da página fica inerte e o carrossel é pausado. |
| **Mobile e Movimento Reduzido** | Em telas mobile, margens de 16px sem transbordar; rolagem interna se o texto crescer. Com `prefers-reduced-motion`, exibe o diálogo estático sem animações de expansão. |

| Guia da Interação (Tema Claro) | Guia da Interação (Tema Escuro) |
| :---: | :---: |
| ![Origem e Handoff Claro](/img/sobre/origem-handoff-light.png) | ![Origem e Handoff Escuro](/img/sobre/origem-handoff-dark.png) |

---

## 4. Estados, Medidas e Handoff

Os painéis de handoff detalham os estados de foco, hover, paginação ativa, carrossel de time e responsividade:

### 4.1. Painel de Handoff (Tema Claro)
![Estados e Handoff - Tema Claro](/img/sobre/estados-handoff-light.png)

### 4.2. Painel de Handoff (Tema Escuro)
![Estados e Handoff - Tema Escuro](/img/sobre/estados-handoff-dark.png)

---

## 5. Diretrizes de Acessibilidade e Design System

### 5.1. Carrossel e Movimento

- **Avanço Automático (Autoplay):** Intervalo proposto de 8 segundos com transição discreta (500ms). O autoplay nunca é o único método de navegação.
- **Pausa Automática:** O carrossel é pausado ao passar o cursor (`pointer hover`) ou ao receber foco do teclado.
- **Controles Manuais:** Botões acessíveis para avançar (`>`), retroceder (`<`) e pausar/retomar (`||` / `▶`).
- **Prefers-reduced-motion:** Quando o usuário preferir movimento reduzido, as animações e o avanço automático são desligados; o controle de pausa é ocultado e a navegação fica exclusivamente manual e estática.
- **Poucos Integrantes:** Quando todos os integrantes couberem no viewport desktop, as setas e controles de autoplay são ocultados, mantendo cards fixos de 264px com gap de 24px.

### 5.2. Ações, Links e Página Ativa

- **Indicação sem depender só de cor:** O link ativo "Sobre o Hubee" no menu/footer utiliza marcador visual, sublinhado e atributo `aria-current="page"`.
- **Foco Visível:** Contorno contínuo de 2px com afastamento de 2px na implementação (`outline-offset`). Nunca remover o outline.
- **Áreas de Toque:** Botões, CTAs e controles com área de toque mínima de 44 × 44 px.

### 5.3. Tokens de Cor Oficiais

- **Fundo Principal:** `hubee-50` (`#fffbed`) no tema claro / `hubee-900` (`#181000`) no tema escuro.
- **Texto Principal:** `hubee-800` (`#302100`) no claro / `hubee-50` (`#fffbed`) no escuro.
- **Texto Secundário / Apoio:** `hubee-750` (`#634400`).
- **Superfícies em Destaque:** `hubee-100` (`#fff3cc`) e `hubee-neutral-25` (`#fffdf6`).
- **Acentos e Ações:** `hubee-400` (`#ffcb33`) e `hubee-500` (`#fcb201`).
- **Bordas e Divisores:** `hubee-200` (`#ffe899`).

---

## 6. A Confirmar / Pendências de Conteúdo

Conforme especificado no handoff do Figma para a task `GOL-183`:

- **Textos Institucionais Definitivos:** O texto das seções "Sobre o Hubee", "O que é o Hubee?" e "De cada lado do evento" é uma proposta de design sujeita à aprovação final de comunicação do time.
- **Dados do Time:** Fotos, nomes, funções e biografias/apresentações de cada integrante aguardam definição formal.
- **Destino do CTA de Organizadores:** Definição da rota/ação do botão secundário "Quero organizar um evento" (se direciona para tela de cadastro de organização ou documentação explicativa).
