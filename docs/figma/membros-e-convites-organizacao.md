---
sidebar_position: 15
title: Membros e Convites da Organização
description: Especificação visual, gestão de equipe da organização (/conta/membros), modais de convite e remoção e aceite de convites pendentes (/conta/perfil) (GOL-274).
---

# Membros e Convites da Organização

Esta seção apresenta os desenhos de interface, fluxos de interação e especificações de handoff para a **gestão de membros da organização (`/conta/membros`)** e o **fluxo de resposta a convites pendentes pelo usuário convidado (`/conta/perfil`)**, desenvolvidos no escopo da tarefa **GOL-274** (história **GOL-124**).

- **Origem YouTrack:** [GOL-274 • Desenho da interface de membros e convites da organização](https://es-unifesp.youtrack.cloud/issue/GOL-274)
- **Base Técnica:** `hubee-webpage` (`src/components/conta/membros/` e `src/components/conta/perfil/`, Next.js 16, Tailwind CSS 4, shadcn/ui)
- **Documentação Relacionada:** [Cadastro e Gestão de Organização](./cadastro-e-gestao-organizacao.md), [Interfaces do Organizador](./interfaces-do-organizador.md) e [Matriz de Permissões RBAC](../regras-negocio/matriz-permissoes-rbac.md)

---

## 1. Visão Geral e Onde Cada Parte se Integra

A funcionalidade de equipe da organização se integra em **dois pontos complementares** da área logada (`/conta`):

1. **Gestão da Equipe (`/conta/membros`) — Grupo `Organização` da Sidebar / Abas:**
   - Acessível na barra lateral esquerda no Desktop (`AccountSidebar`) e nas abas horizontais no Mobile (`AccountTabs`), dentro do grupo **`Organização`** (ao lado de **Fornecedores**).
   - Permite visualizar todos os integrantes vinculados à organização ativa, filtrar por papel (`Administrador`, `Membro`, `Leitor`) ou status do convite (`Aceito`, `Pendente`, `Recusado`), convidar novos membros por e-mail, alterar papéis e remover integrantes.
2. **Convites Pendentes do Convidado (`/conta/perfil`) — Topo de `Meu Perfil`:**
   - Quando um usuário recebe um convite para integrar uma organização, ele ainda não possui vínculo ativo (`ACCEPTED`), portanto ainda não enxerga o grupo `Organização` na barra lateral.
   - O alerta/bloco **`Convites pendentes de organização`** é exibido no topo de **`/conta/perfil`** (acima de `Dados Pessoais` e `Permissões e perfil`), permitindo a qualquer usuário autenticado **Aceitar** ou **Recusar** o convite imediatamente.

### 1.1. Mapa de Componentes e Contratos Visuais

| Componente / Elemento | Estados e Regras Visuais | Destino no Front-end (`hubee-webpage`) |
| :--- | :--- | :--- |
| **Item de Navegação `Membros`** | Item no grupo **`Organização`** de `account-nav.config.ts` com ícone `Users` e rota `/conta/membros`. | `src/components/layout/logged/account-nav.config.ts` |
| **`MembrosTabela` (Desktop `1440px`)** | Tabela em `ContaCard` com colunas `Membro` (avatar com iniciais, nome e e-mail), `Papel`, `Status`, `Alterar papel` e `Ações`. | `src/components/conta/membros/membros-tabela.tsx` |
| **`MembroCard` (Mobile `375px`)** | Card responsivo empilhado com nome, e-mail, badges de papel e status do convite, seletor de papel e ação de remoção/cancelamento. | `src/components/conta/membros/membro-card.tsx` |
| **`ConvidarMembroModal`** | Dialog responsivo (Desktop e Mobile) com campo `E-mail` (validação Zod) e seleção de papel (`Administrador`, `Membro`, `Leitor`). | `src/components/conta/membros/convidar-membro-modal.tsx` |
| **`RemoverMembroModal`** | Dialog de confirmação responsivo exibindo nome, e-mail e impacto da remoção do integrante ou cancelamento do convite pendente. | `src/components/conta/membros/remover-membro-modal.tsx` |
| **`ConvitesPendentesCard`** | Card de destaque em `/conta/perfil` listando convites com `inviteStatus = PENDING`, organização, papel proposto e botões **`Aceitar`** e **`Recusar`**. | `src/components/conta/perfil/convites-pendentes-card.tsx` |

---

## 2. Tela de Gestão de Membros (`/conta/membros` — Desktop 1440px)

Na visão de **Administrador** (`manage` = `admin` + `full`), o cabeçalho exibe o botão primário **`+ Convidar membro`** habilitado, barra de busca por nome/e-mail, filtros por papel e status do convite, além dos controles inline para alterar o papel ou remover membros:

### 2.1. Tema Claro (Desktop — Visão Administrador)
![Listagem de Membros da Organização — Claro Desktop](/img/gol-274/listagem-membros-claro-desktop.png)

### 2.2. Tema Escuro (Desktop — Visão Administrador)
![Listagem de Membros da Organização — Escuro Desktop](/img/gol-274/listagem-membros-escuro-desktop.png)

---

## 3. Modais de Convite, Remoção e Estado Somente Consulta (Desktop 1440px)

- **Modal *"Convidar membro"*:** solicita o e-mail do usuário já cadastrado na plataforma e permite escolher entre os três perfis da matriz RBAC:
  - **Administrador (`admin` + `full` → `manage`):** gerencia dados da organização, convida/remove membros e cria, edita ou cancela eventos;
  - **Membro (`member` + `full` → `write`):** cria e edita eventos e lotes, sem alterar a equipe ou dados da organização;
  - **Leitor (`member` + `read_only` → `read`):** somente consulta de eventos, métricas, equipe e fornecedores.
- **Modal *"Remover membro"*:** exige confirmação explícita antes de revogar o vínculo ou cancelar um convite pendente.
- **Visão de `Membro` e `Leitor`:** exibe o banner informativo *"Apenas Administradores da organização podem convidar, alterar papéis ou remover membros"* e mantém o botão **`+ Convidar membro`** desabilitado.

### 3.1. Tema Claro (Desktop — Modais e Banner de Permissão)
![Modais Convidar e Remover Membro — Claro Desktop](/img/gol-274/modais-membros-claro-desktop.png)

### 3.2. Tema Escuro (Desktop — Modais e Banner de Permissão)
![Modais Convidar e Remover Membro — Escuro Desktop](/img/gol-274/modais-membros-escuro-desktop.png)

---

## 4. Fluxo do Convidado: Convites Pendentes em `/conta/perfil` (Desktop 1440px)

Quando o usuário convidado acessa **`Meu Perfil` (`/conta/perfil`)**, o bloco **`Convites pendentes de organização`** aparece em destaque no topo da página:
- Ao clicar em **`Aceitar`**, o status passa para `ACCEPTED`, a sessão (`GET /auth/me`) é atualizada e o grupo **`Organização`** (`Fornecedores` e `Membros`) passa a aparecer imediatamente na barra lateral;
- Ao clicar em **`Recusar`**, o status passa para `DECLINED` e o alerta desaparece do perfil do convidado.

### 4.1. Tema Claro (Desktop — Convites Pendentes no Perfil)
![Convites Pendentes em Meu Perfil — Claro Desktop](/img/gol-274/convites-pendentes-claro-desktop.png)

### 4.2. Tema Escuro (Desktop — Convites Pendentes no Perfil)
![Convites Pendentes em Meu Perfil — Escuro Desktop](/img/gol-274/convites-pendentes-escuro-desktop.png)

---

## 5. Versões Mobile (375px)

No viewport mobile (`375px`), a navegação superior utiliza `AccountTabs` com a aba **`Membros`** no grupo da organização, transformando as linhas da tabela em cards empilhados (`MembroCard`) e adaptando os modais e o card de convites pendentes com botões em grade `50%` / `50%`.

### 5.1. Gestão de Membros em Cards (`/conta/membros` — Mobile 375px)

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Cards de Membros — Claro Mobile](/img/gol-274/cards-membros-claro-mobile.png) | ![Cards de Membros — Escuro Mobile](/img/gol-274/cards-membros-escuro-mobile.png) |

### 5.2. Convites Pendentes no Perfil (`/conta/perfil` — Mobile 375px)

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Convites Pendentes — Claro Mobile](/img/gol-274/convites-pendentes-claro-mobile.png) | ![Convites Pendentes — Escuro Mobile](/img/gol-274/convites-pendentes-escuro-mobile.png) |

### 5.3. Modais de Convite e Remoção (Mobile 375px)

| Tema Claro (Mobile 375px) | Tema Escuro (Mobile 375px) |
| :---: | :---: |
| ![Modais Convidar e Remover Membro — Claro Mobile](/img/gol-274/modais-membros-claro-mobile.png) | ![Modais Convidar e Remover Membro — Escuro Mobile](/img/gol-274/modais-membros-escuro-mobile.png) |

---

## 6. Tokens de Cor e Especificação Visual

| Elemento | Tema Claro (Light) | Tema Escuro (Dark) |
| :--- | :--- | :--- |
| **Fundo da Página (`body`)** | `#FFFBED` (`bg-hubee-50`) | `#181000` (`bg-hubee-900`) |
| **Navbar Flutuante** | `#302100` (`bg-hubee-800`), texto `#FFFBED` | `#FFCB33` (`bg-hubee-400`), texto `#302100` |
| **Superfície da Tabela / Cards** | `#FFFDF6` (`bg-hubee-neutral-25`), borda `#FFE899` | `#1C1917` / `hubee-50/7`, borda `white/15` |
| **Badge de Papel — `Administrador`** | Fundo `#FFE899`, borda `#FFCB33`, texto `#302100` | Fundo `hubee-400/20`, borda `#FFCB33`, texto `#FFDA66` |
| **Badge de Papel — `Membro`** | Fundo `#F5F5F4`, borda `#D6D3D1`, texto `#292524` | Fundo `#292524`, borda `#57534E`, texto `#E7E5E4` |
| **Badge de Papel — `Leitor`** | Fundo `#FFFDF6`, borda `#FFDA66`, texto `#634400` | Fundo `#292524`, borda `#57534E`, texto `#D6D3D1` |
| **Status do Convite — `Aceito`** | Fundo `#DCFCE7`, borda `#86EFAC`, texto `#166534` | Fundo `#052E16`, borda `#166534`, texto `#86EFAC` |
| **Status do Convite — `Pendente`** | Fundo `#FEF9C3`, borda `#FDE047`, texto `#854D0E` | Fundo `#422006`, borda `#A16207`, texto `#FDE047` |
| **Status do Convite — `Recusado`** | Fundo `#FEE2E2`, borda `#FCA5A5`, texto `#991B1B` | Fundo `#450A0A`, borda `#991B1B`, texto `#FCA5A5` |
| **Banner de Convites Pendentes** | Fundo `#FFE899` (`bg-hubee-200`), borda `#FFCB33` (`border-hubee-400`) | Fundo `#241A06` (`bg-hubee-850`), borda `#966800` |
