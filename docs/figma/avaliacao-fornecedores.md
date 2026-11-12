---
sidebar_position: 14
title: Avaliação e Filtro de Fornecedores
description: Especificação visual, filtro por nota mínima, ordenação por reputação e handoff de fornecedores bem avaliados em /conta/fornecedores (GOL-249).
---

# Avaliação e Filtro de Fornecedores

Esta seção apresenta os desenhos de interface, anatomia dos componentes e especificações de handoff para a **visualização de notas médias, filtragem por avaliação mínima e ordenação por reputação de fornecedores** na tela **`/conta/fornecedores`**, desenvolvidos no escopo da tarefa **GOL-249**.

- **Origem YouTrack:** [GOL-249 • Desenho da visualização, filtro e ordenação de fornecedores bem avaliados](https://es-unifesp.youtrack.cloud/issue/GOL-249)
- **Base Técnica:** `hubee-webpage` (`src/components/conta/fornecedores/`, Next.js 16, Tailwind CSS 4, shadcn/ui)
- **Documentação Relacionada:** [Interfaces do Organizador](./interfaces-do-organizador.md), [Fornecedores (Back-end)](../backend/fornecedores.md) e [Matriz de Permissões RBAC](../regras-negocio/matriz-permissoes-rbac.md)

---

## 1. Visão Geral e Handoff Técnico

Os fornecedores constituem um catálogo compartilhado da plataforma utilizado por organizadores na contratação de serviços para seus eventos (`Buffet`, `Som e iluminação`, `Fotografia`, `Segurança`, `Decoração`, entre outros). A evolução visual da **GOL-249** destaca os prestadores mais bem avaliados diretamente na listagem de **`/conta/fornecedores`**, permitindo filtrar o catálogo por nota mínima em estrelas e ordenar os resultados por reputação ou ordem alfabética.

A especificação cobre integralmente as resoluções **Desktop (`1440px`)** e **Mobile (`375px`)**, os temas **Claro (Light)** e **Escuro (Dark)** e as variações de permissão do organizador (**Administrador / Membro** e **Leitura**).

### 1.1. Painel de Handoff e Componentes

#### Tema Claro
![Handoff e Componentes — Tema Claro](/img/gol-249/handoff-componentes-claro.png)

#### Tema Escuro
![Handoff e Componentes — Tema Escuro](/img/gol-249/handoff-componentes-escuro.png)

### 1.2. Mapa de Componentes e Contratos Visuais

| Componente / Elemento | Estados e Regras Visuais | Destino no Front-end (`hubee-webpage`) |
| :--- | :--- | :--- |
| **`FornecedorAvaliacaoBadge` (`RatingBadge`)** | • **Destaque (`nota >= 4,5`):** pílula `rounded-full` com estrela preenchida, média com 1 casa decimal separada por vírgula e total entre parênteses (`★ 4,9 (24)`), com `tabular-nums`.<br/>• **Avaliação regular (`nota < 4,5`):** indicador inline sem pílula (`★ 3,8 (5)`).<br/>• **Não avaliado:** texto neutro `Sem avaliações` (nunca exibe `★ 0,0 (0)`). | Coluna **Avaliação** em `FornecedoresTabela` e cabeçalho do `FornecedorCard` |
| **`FornecedoresFiltros`** | Barra com 4 controles integrados:<br/>1. **Buscar por nome** (`input` com ícone `Search`)<br/>2. **Categoria** (`Todas`, `Buffet`, `Som e iluminação`, `Fotografia`, `Segurança`, `Decoração`)<br/>3. **Avaliação mínima** (`Todas`, `★ 4+ estrelas`, `★ 3+ estrelas`)<br/>4. **Ordenar por** (`Mais bem avaliados`, `Ordem alfabética (A–Z)`) | `src/components/conta/fornecedores/fornecedores-filtros.tsx` |
| **`FornecedoresTabela` (Desktop)** | Tabela com 7 colunas sem rolagem horizontal (`Razão Social / Nome`, `CNPJ/CPF`, `Categoria`, `Avaliação`, `Telefone`, `E-mail`, `Ações`). Rodapé exibe contador (`Mostrando X de Y fornecedores`) e indicador de ordenação ativa (`★ Mais bem avaliados primeiro`). | `src/components/conta/fornecedores/fornecedores-tabela.tsx` |
| **`FornecedorCard` (Mobile)** | Card responsivo (`375px`) exibindo razão social à esquerda, badge de avaliação (`★ 4,9 (24)` ou `Sem avaliações`) no topo direito, `CategoriaBadge`, metadados (`CNPJ/CPF`, `Telefone`, `E-mail`) e barra inferior de ações (`Editar` e `Excluir`). | `src/components/conta/fornecedores/fornecedor-card.tsx` |
| **`EmptyState` (Filtro sem resultados)** | Card com borda tracejada, ícone `SearchX`, título *"Nenhum fornecedor encontrado"*, descrição *"Não encontramos fornecedores com os filtros selecionados."* e botão **"Limpar filtros"**. | `/conta/fornecedores` |

---

## 2. Listagem Ordenada por Melhores Avaliações (Desktop 1440px)

Na visualização padrão ordenada por **`Mais bem avaliados`**, os fornecedores são apresentados em ordem decrescente de nota média e volume de avaliações, posicionando os prestadores ainda **`Sem avaliações`** ao final da listagem:

1. **Buffet Sabor Real Ltda** (`Buffet`) — **`★ 4,9 (24)`** (badge de destaque `>= 4,5`)
2. **Luz & Som Produções** (`Som e iluminação`) — **`★ 4,8 (12)`** (badge de destaque `>= 4,5`)
3. **Estúdio Clique Certo** (`Fotografia`) — **`★ 4,5 (8)`** (badge de destaque `>= 4,5`)
4. **Segurança Total Eventos** (`Segurança`) — **`★ 3,8 (5)`** (indicador regular `< 4,5`)
5. **Decora Festas & Flores** (`Decoração`) — **`Sem avaliações`** (estado neutro sem nota)

### 2.1. Tema Claro (Desktop — Visão Administrador / Membro)
![Listagem de Fornecedores por Avaliação — Claro Desktop](/img/gol-249/listagem-avaliacao-claro-desktop.png)

### 2.2. Tema Escuro (Desktop — Visão Administrador / Membro)
![Listagem de Fornecedores por Avaliação — Escuro Desktop](/img/gol-249/listagem-avaliacao-escuro-desktop.png)

---

## 3. Filtro por Nota Mínima (`★ 4+ estrelas`) e Papel `Leitura` (Desktop 1440px)

Quando o organizador seleciona o filtro **`Avaliação mínima: ★ 4+ estrelas`**, a listagem passa a exibir apenas os fornecedores com média igual ou superior a `4,0`, atualizando o contador do rodapé (`Mostrando 3 de 5 fornecedores`) e aplicando realce de foco (`ring-hubee-500`) ao seletor ativo.

Para membros com papel **`Leitura`** (`read_only`):
- O banner informativo *"Apenas Administradores e Membros podem gerenciar fornecedores"* é exibido abaixo do cabeçalho da página;
- Os controles de **busca, categoria, avaliação mínima e ordenação permanecem 100% habilitados** para consulta;
- O botão primário **`+ Novo fornecedor`** e as ações de linha (**`Editar`** e **`Excluir`**) permanecem desabilitados (`opacity-50`).

### 3.1. Tema Claro (Desktop — Filtro `4+ estrelas` + Visão Leitura)
![Filtro 4+ estrelas e Visão Leitura — Claro Desktop](/img/gol-249/filtro-4-mais-leitura-claro-desktop.png)

### 3.2. Tema Escuro (Desktop — Filtro `4+ estrelas` + Visão Leitura)
![Filtro 4+ estrelas e Visão Leitura — Escuro Desktop](/img/gol-249/filtro-4-mais-leitura-escuro-desktop.png)

---

## 4. Estado Vazio por Filtro de Avaliação (Desktop 1440px)

Quando a combinação de filtros selecionada pelo organizador (por exemplo, `Categoria: Segurança` + `Avaliação mínima: ★ 4+ estrelas`) não encontra nenhum fornecedor correspondente:
- A tabela dá lugar ao componente **`EmptyState`** com borda tracejada, ícone `SearchX`, mensagem explicativa e a ação rápida **"Limpar filtros"** para restaurar a listagem completa;
- O contador no rodapé informa `Mostrando 0 de 5 fornecedores`.

### 4.1. Tema Claro (Desktop — Estado Vazio)
![Estado Vazio por Filtro — Claro Desktop](/img/gol-249/estado-vazio-claro-desktop.png)

### 4.2. Tema Escuro (Desktop — Estado Vazio)
![Estado Vazio por Filtro — Escuro Desktop](/img/gol-249/estado-vazio-escuro-desktop.png)

---

## 5. Versões Mobile (375px)

No viewport mobile (`375px`), a navegação superior utiliza a barra horizontal `AccountTabs` com a aba **Fornecedores** ativa. Os filtros são organizados com o campo **Buscar por nome** em largura total no topo, **Categoria** e **Avaliação mínima** lado a lado em 2 colunas (`50%` cada) e **Ordenar por** em largura total logo abaixo, mantendo alvos de toque mínimos de `40px` (`h-10`).

### 5.1. Listagem em Cards (`FornecedorCard`)

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Cards de Fornecedores — Claro Mobile](/img/gol-249/cards-claro-mobile.png) | ![Cards de Fornecedores — Escuro Mobile](/img/gol-249/cards-escuro-mobile.png) |

### 5.2. Estado Vazio por Filtro (Mobile 375px)

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Estado Vazio — Claro Mobile](/img/gol-249/estado-vazio-claro-mobile.png) | ![Estado Vazio — Escuro Mobile](/img/gol-249/estado-vazio-escuro-mobile.png) |

---

## 6. Tokens de Cor e Especificação Visual

| Elemento | Tema Claro (Light) | Tema Escuro (Dark) |
| :--- | :--- | :--- |
| **Fundo da Página (`body`)** | `bg-background` `#FFFDF6` (`hubee-neutral-25`) | `bg-background` `#181000` (`hubee-900`) |
| **Superfície da Tabela / Cards** | `bg-hubee-neutral-25` `#FFFDF6`, borda `border-hubee-200` `#FFE899` | `bg-hubee-neutral-500` `#1C1917`, borda `border-hubee-750` `#634400` |
| **Estrela Preenchida (`Star`)** | `#FCB201` (`text-hubee-500`) com contorno `#C98D00` (`stroke-hubee-600`) | `#FFCB33` (`text-hubee-400`) |
| **Badge de Destaque (`nota >= 4,5`)** | Fundo `#FFF3CC` (`bg-hubee-100`), borda `#FFDA66` (`border-hubee-300`), nota `#302100` (`text-hubee-800`) | Fundo `#302100` (`bg-hubee-800`), borda `#C98D00` (`border-hubee-600/60`), nota `#FFFBED` (`text-hubee-50`) |
| **Indicador Regular (`nota < 4,5`)** | Estrela `#FCB201`, nota `#302100` (`font-semibold`), contagem `#78716C` (`text-hubee-neutral-300`) | Estrela `#FFCB33`, nota `#FFFBED` (`font-semibold`), contagem `#FFE899` (`text-hubee-200`) |
| **Estado `Sem avaliações`** | Texto `12px` (`text-xs`) em `#78716C` (`text-hubee-neutral-300`) | Texto `12px` (`text-xs`) em `#FFE899` (`text-hubee-200/75`) |
