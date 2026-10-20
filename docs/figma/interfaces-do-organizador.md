---
sidebar_position: 11
title: Interfaces do Organizador
description: Especificação visual, handoff para front-end e telas da área logada para organizadores de eventos (GOL-143).
---

# Interfaces do Organizador

Esta seção apresenta os desenhos de interface e o guia de handoff visual da **Área Logada de Organizadores** da plataforma Hubee, desenvolvidos no escopo da tarefa **GOL-143**.

- **Link no Figma:** [Hubee - Interfaces do Organizador (GOL-143)](https://www.figma.com/design/J1ffS9em9AchDkaykG173s)
- **Origem YouTrack:** [GOL-143 • Matriz de permissões e interfaces do organizador](https://es-unifesp.youtrack.cloud/issue/GOL-143)
- **Base Técnica:** `hubee-webpage` (Next.js 16, Tailwind CSS 4, shadcn/ui)

---

## 1. Visão Geral e Handoff Técnico

A especificação contempla a adaptação completa da experiência do usuário quando este possui perfil de organizador vinculado a uma organização ativa, cobrindo variações de papéis (**Administrador**, **Membro** e **Leitura**), resoluções (**Desktop 1440px** e **Mobile 375px**) e temas (**Claro** e **Escuro**).

![Handoff e Cobertura GOL-143](/img/Interfaces_organizador/gol-143-handoff-cobertura.png)

### Mapa de Implementação de Componentes

| Peça Visual | Estados Desenhados / Contrato | Destino / Integração no Front-end |
| :--- | :--- | :--- |
| **`AccountSidebar/Buyer`**<br/>**`AccountSidebar/Organizer`** | Desktop 208px (`13rem`). Estados Default, Hover e Ativo. Separador "Minha Conta" e "Organização". Seletor de organização quando houver mais de um vínculo aceito. | `/conta/pedidos`<br/>`/conta/perfil`<br/>`/conta/eventos` |
| **`AccountTabs`** | Mobile 375px. Abas horizontais com scroll; item ativo com indicador inferior de 2px. Usuário comprador não visualiza a aba "Meus eventos". | Rotas correspondentes da sidebar mobile |
| **`LoggedUserMenu`** | Dropdown de usuário no Header aberto com identidade, papel na organização ativa, atalhos contextuais, separadores e opção Sair. | Header global da área logada |
| **`ContaLayout`** | Grid desktop: `max-w-6xl` (1152px), centralizado com padding lateral de 24px (`px-6`), sidebar fixa de 208px (`gap-8`). Mobile: `px-4`. | `src/app/(logado)/conta/layout.tsx` |
| **`ContaCard`**<br/>**`ContaPageTitle`** | Superfície `rounded-xl`, padding 20px (`p-5`), borda suave. Título de página `30px / 36px` bold (`text-3xl`). | `src/components/conta/conta-card.tsx` |
| **`StatusBadge`** | Badges semânticos de status do evento: `Publicado`, `Rascunho`, `Encerrado`, `Cancelado`. Ícone e texto com alto contraste. | Cards de listagem e detalhes |
| **`EventCard` (Desktop / Mobile)** | Thumbnail 16:9, nome do evento, data e horário, venue/local, badge de status, barra de progresso de vendas (6px) e menu de ações rápidas. | `/conta/eventos` |
| **`Button` / CTA Principal** | Estados Default, Hover e Disabled. No modo Leitura (`read_only`), o botão "Criar Novo Evento" exibe cadeado e tooltip explicativo. | Ações de criação na página |
| **Perfil: Seção RBAC** | Bloco informativo exibindo organização vinculada e badge do papel. Estado sem organização exibe CTA informativo para criação. | `/conta/perfil` |

---

## 2. Anatomia e Estados de Navegação

A navegação da conta é dinâmica e respeita o isolamento por organização ativa:

### Tema Claro
![Anatomia e Estados - Modo Claro](/img/Interfaces_organizador/anatomia-estados-claro-desktop-1440.png)

### Tema Escuro
![Anatomia e Estados - Modo Escuro](/img/Interfaces_organizador/anatomia-estados-escuro-desktop-1440.png)

---

## 3. Tela "Meus Eventos" (`/conta/eventos`)

A tela de gestão de eventos da organização ativa oferece listagem paginada, filtros por status, busca por texto e ações condicionadas ao papel do usuário.

### 3.1. Versões Desktop (1440px) - Tema Claro

#### Visão de Administrador (CTA Ativo e Cancelamento Permitido)
![Meus Eventos - Claro - Desktop - Administrador](/img/Interfaces_organizador/meus-eventos-claro-desktop-administrador.png)

#### Visão de Membro (CTA Ativo - Sem Cancelamento)
![Meus Eventos - Claro - Desktop - Membro](/img/Interfaces_organizador/meus-eventos-claro-desktop-membro.png)

#### Visão de Leitura (CTA Desabilitado com Cadeado)
![Meus Eventos - Claro - Desktop - Leitura](/img/Interfaces_organizador/meus-eventos-claro-desktop-leitura.png)

#### Estado Vazio (Sem Eventos Criados)
![Meus Eventos - Claro - Desktop - Vazio](/img/Interfaces_organizador/meus-eventos-claro-desktop-vazio.png)

---

### 3.2. Versões Desktop (1440px) - Tema Escuro

#### Visão de Administrador
![Meus Eventos - Escuro - Desktop - Administrador](/img/Interfaces_organizador/meus-eventos-escuro-desktop-administrador.png)

#### Visão de Membro
![Meus Eventos - Escuro - Desktop - Membro](/img/Interfaces_organizador/meus-eventos-escuro-desktop-membro.png)

#### Visão de Leitura
![Meus Eventos - Escuro - Desktop - Leitura](/img/Interfaces_organizador/meus-eventos-escuro-desktop-leitura.png)

#### Estado Vazio
![Meus Eventos - Escuro - Desktop - Vazio](/img/Interfaces_organizador/meus-eventos-escuro-desktop-vazio.png)

---

### 3.3. Versões Mobile (375px)

#### Tema Claro
| Administrador | Leitura | Estado Vazio |
| :---: | :---: | :---: |
| ![Mobile Claro Admin](/img/Interfaces_organizador/meus-eventos-claro-mobile-administrador.png) | ![Mobile Claro Leitura](/img/Interfaces_organizador/meus-eventos-claro-mobile-leitura.png) | ![Mobile Claro Vazio](/img/Interfaces_organizador/meus-eventos-claro-mobile-vazio.png) |

#### Tema Escuro
| Administrador | Leitura | Estado Vazio |
| :---: | :---: | :---: |
| ![Mobile Escuro Admin](/img/Interfaces_organizador/meus-eventos-escuro-mobile-administrador.png) | ![Mobile Escuro Leitura](/img/Interfaces_organizador/meus-eventos-escuro-mobile-leitura.png) | ![Mobile Escuro Vazio](/img/Interfaces_organizador/meus-eventos-escuro-mobile-vazio.png) |

---

## 4. Seção de Permissões no "Meu Perfil" (`/conta/perfil`)

Apresenta no perfil do usuário suas organizações associadas e seu respectivo nível de acesso.

### 4.1. Desktop (1440px)

As telas desktop são apresentadas em largura total para melhor leitura dos campos, textos explicativos e badges de permissão.

#### Tema Claro

##### Com Organização Vinculada (Exibição de Papel e Permissões)
![Perfil Claro Desktop - Com Organização](/img/Interfaces_organizador/meu-perfil-claro-desktop-organizacao-permissoes.png)

##### Sem Organização (CTA Informativo de Criação)
![Perfil Claro Desktop - Sem Organização](/img/Interfaces_organizador/meu-perfil-claro-desktop-sem-organizacao.png)

---

#### Tema Escuro

##### Com Organização Vinculada
![Perfil Escuro Desktop - Com Organização](/img/Interfaces_organizador/meu-perfil-escuro-desktop-organizacao-permissoes.png)

##### Sem Organização
![Perfil Escuro Desktop - Sem Organização](/img/Interfaces_organizador/meu-perfil-escuro-desktop-sem-organizacao.png)

### 4.2. Mobile (375px)
| Estado | Tema Claro | Tema Escuro |
| :--- | :---: | :---: |
| **Com Organização** | ![Perfil Claro Mobile Org](/img/Interfaces_organizador/meu-perfil-claro-mobile-organizacao-permissoes.png) | ![Perfil Escuro Mobile Org](/img/Interfaces_organizador/meu-perfil-escuro-mobile-organizacao-permissoes.png) |
| **Sem Organização** | ![Perfil Claro Mobile Sem Org](/img/Interfaces_organizador/meu-perfil-claro-mobile-sem-organizacao.png) | ![Perfil Escuro Mobile Sem Org](/img/Interfaces_organizador/meu-perfil-escuro-mobile-sem-organizacao.png) |

---

## 5. Tokens de Cor e Contraste Visual

- **Fundos de Página:** `hubee-50` (`#fffbed`) no claro; `hubee-800` (`#302100`) no escuro.
- **Superfície de Cards:** `hubee-neutral-25` (`#fffdf6`) com borda `hubee-200` no claro; `hubee-50/7` com borda `hubee-50/10` no escuro.
- **Botões Primários:** `hubee-800` com texto `hubee-50` no claro; `hubee-400` com texto `hubee-800` no escuro.
- **Badges Semânticos:**
  - `Publicado`: Fundo `#ecfdf5`, Texto `#047857`, Borda `#a7f3d0`
  - `Rascunho`: Fundo `#fffbeb`, Texto `#b45309`, Borda `#fde68a`
  - `Encerrado`: Fundo `#f5f5f4`, Texto `#78716c`, Borda `#e7e5e4`
  - `Cancelado`: Fundo `#fef2f2`, Texto `#b91c1c`, Borda `#fecaca`
