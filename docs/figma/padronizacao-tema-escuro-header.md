---
sidebar_position: 16
title: Padronização do Tema Escuro e Header no Scroll
description: Auditoria visual e padronização de cores do tema escuro (hubee-900 / hubee-850) e comportamento sticky do LoggedHeader ao rolar a página no hubee-webpage (GOL-286).
---

# Padronização do Tema Escuro e Header no Scroll

Esta página documenta a padronização visual do **tema escuro** e do **comportamento do cabeçalho ao rolar a página** em todo o `hubee-webpage`, alinhando as telas públicas e a área logada ao padrão estabelecido pela nova Home (`GOL-283` / `GOL-284`) e pelo redesign da página Sobre (`GOL-285`).

- **Origem YouTrack:** [GOL-286 • Padronizar cores do tema escuro e comportamento do header no scroll](https://es-unifesp.youtrack.cloud/issue/GOL-286) (Subtask de [GOL-232](https://es-unifesp.youtrack.cloud/issue/GOL-232))
- **Documentação Relacionada:** [Guia de Estilo](./guia-de-estilo.md), [Header e Navegação](./header-navbar.md), [Página Sobre](./pagina-sobre.md), [Criação de Eventos com IA](./criacao-eventos-ia.md) e [Membros e Convites da Organização](./membros-e-convites-organizacao.md)
- **Base Técnica:** `hubee-webpage` (`src/app/globals.css`, `src/components/layout/`, `src/components/eventos/`, `src/components/carrinho/`, `src/components/conta/`, `src/components/ui/`)

---

## 1. Diretrizes Oficiais de Cores (Tema Escuro) e Scroll

| Camada / Elemento | Token Oficial (Dark) | Hex | Uso Esperado |
| --- | --- | --- | --- |
| **Fundo de página (`root`)** | `dark:bg-hubee-900` | `#181000` | Container raiz de todas as rotas (Home, `/eventos`, `/eventos/[id]`, `/sobre`, `(auth)` e `(logado)`) |
| **Superfícies elevadas** | `dark:bg-hubee-850` | `#241a06` | Header, Footer, cards, tabelas, modais, drawers, dropdowns e barra de busca |
| **Borda sutil padrão** | `dark:border-hubee-50/15` | `rgba(255,251,237,0.15)` | Delimitação de cards, dropdowns, tabelas, drawers e inputs |
| **Controles internos recuados** | `dark:bg-hubee-900` / `dark:bg-hubee-50/10` | `#181000` / `10%` | Inputs, steppers, placeholders de avatar e botões desabilitados/esgotados dentro de cards `hubee-850` |
| **Destaque / CTA primário** | `bg-hubee-400 text-hubee-900` | `#ffcb33` / `#181000` | Botão "Entrar", ações principais (ex.: "Continuar compra") e hover de itens de menu no modo escuro |
| **Header ao rolar (`scrollY > 24`)** | `sticky top-0 z-40` + `data-scrolled` | `#302100` (claro) / `#241a06` (escuro) | Colapsa `pt-4` e `rounded-xl` virando barra cheia colada no topo, com `ThemeToggle` lateral transparente |

---

## 2. Evidência Real no Navegador (`localhost:3001`)

### 2.1. Referência — Home scrollada no Tema Escuro (`/`)
Header sticky (`#241a06`) colado no topo, fundo da página em `#181000` e barra de busca/cards elevados em `#241a06`:

![Referência real: Home scrollada no tema escuro](/img/gol-286/00-print-real-home-referencia-dark.png)

### 2.2. Antes × Depois em `/eventos` (`EventPageShell`)

#### Antes (fundo em `dark:bg-hubee-850`)
Header, busca, botão Filtros e Footer fundiam-se no mesmo `#241a06`, enquanto o `ThemeToggle` (`#181000`) destoava no canto superior esquerdo e o botão "Entrar" ficava apagado:

![Antes: /eventos no tema escuro](/img/gol-286/00-print-real-eventos-atual-dark.png)

#### Depois (fundo em `dark:bg-hubee-900` + CTA `Entrar` em `hubee-400`)
Hierarquia visual restaurada entre fundo (`#181000`) e superfícies elevadas (`#241a06`):

![Depois: /eventos corrigido no tema escuro](/img/gol-286/00-print-real-eventos-corrigido-dark.png)

---

## 3. Comparações Visuais por Bloco (Antes × Depois)

### 3.1. Comportamento do `LoggedHeader` ao scrollar (Área Logada)
- **Arquivos:** `src/components/layout/logged/logged-header.tsx` e `logged-session.tsx`.
- **Mudança:** Adicionado `sticky top-0 z-40`, estado `data-scrolled` (`window.scrollY > 24`) e transição do `ThemeToggle`, replicando exatamente o comportamento do `Header` público da Home.

![Comparação 1: LoggedHeader ao scrollar](/img/gol-286/01-logged-header-scroll.png)

### 3.2. Páginas `/eventos` e `/eventos/[id]`
- **Arquivos:** `src/components/eventos/detalhes/event-page-shell.tsx` e `ticket-type-list.tsx`.
- **Mudança:** Fundo de página corrigido para `dark:bg-hubee-900`; botão de lote esgotado ajustado de `dark:bg-hubee-neutral-50` (`#e7e5e4`) para `dark:bg-hubee-50/10 dark:text-hubee-neutral-200`.

![Comparação 2: Páginas /eventos e /eventos/[id] no tema escuro](/img/gol-286/02-eventos-page-shell-dark.png)

### 3.3. Menu do Usuário (`LoggedUserMenu`), Botão "Entrar" e Drawer Mobile
- **Arquivos:** `logged-user-menu.tsx`, `header-actions.tsx` e `mobile-menu.tsx`.
- **Mudança:**
  - Substituído hex hardcoded `dark:bg-[#3a2803]` por `dark:bg-hubee-850`.
  - Corrigida a sobrescrita de cor nos ícones `<svg>` no hover/focus do dropdown (`focus:**:text-hubee-700` no claro e `dark:focus:**:text-hubee-400` no escuro; item "Sair" em vermelho legível nos dois temas).
  - Botão **"Entrar"** mantido em destaque `bg-hubee-400 text-hubee-900` em ambos os temas.
  - Borda esquerda do `MobileMenu` suavizada para `dark:border-hubee-50/15`.

![Comparação 3: Menu do usuário, botão Entrar e drawer mobile](/img/gol-286/03-menu-usuario-entrar-drawer.png)

### 3.4. Página do Carrinho (`/carrinho`)
- **Arquivos:** `carrinho-content.tsx`, `carrinho-item-card.tsx`, `carrinho-resumo.tsx` e `carrinho-skeleton.tsx`.
- **Mudança:** Cards, cabeçalho de colunas e resumo elevados de `dark:bg-hubee-900/90` para `dark:bg-hubee-850`; stepper e ação secundária recuados em `dark:bg-hubee-900`; CTA "Continuar compra" destacado em `dark:bg-hubee-400 dark:text-hubee-900`.

![Comparação 4: Carrinho no tema escuro](/img/gol-286/04-carrinho-dark.png)

### 3.5. Fornecedores e Membros (`/conta/fornecedores` e `/conta/membros`)
- **Arquivos:** `fornecedor-card.tsx`, `fornecedores-tabela.tsx`, `avaliacao-card.tsx`, `membro-card.tsx`, `membros-tabela.tsx`, `membros-skeleton.tsx` e `convidar-membro-modal.tsx`.
- **Mudança:** Substituídos `dark:bg-hubee-neutral-500` (`#1c1917`) e tokens legados `dark:bg-hubee-800` pela paleta quente oficial `dark:bg-hubee-850` / `dark:bg-hubee-900` / `dark:bg-hubee-400/15`.

![Comparação 5: Fornecedores e Membros no tema escuro](/img/gol-286/05-fornecedores-membros-dark.png)

### 3.6. Assistente de IA (`/meus-eventos/novo`), Avatar do Perfil e `Button`
- **Arquivos:** `gerador-ia-evento.tsx`, `dados-evento-form.tsx`, `dados-pessoais-form.tsx` e `ui/button.tsx`.
- **Mudança:** Removidos hex hardcoded (`dark:bg-[#2B1E04]` e `text-[#302100]`), tokens `dark:bg-hubee-800/*` e o placeholder de avatar claro (`dark:bg-hubee-neutral-50`) em favor de `dark:bg-hubee-850` / `dark:bg-hubee-900`.

![Comparação 6: Assistente de IA e Avatar do Perfil](/img/gol-286/06-gerador-ia-avatar-perfil.png)
