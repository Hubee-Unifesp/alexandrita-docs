---
sidebar_position: 13
title: Cadastro e Gestão de Organização
description: Especificação visual, fluxos de entrada, criação e edição de organização para organizadores de eventos (GOL-196).
---

# Cadastro e Gestão de Organização

Esta seção apresenta os desenhos de interface, fluxos de interação e especificações de handoff para a **criação, vínculo e edição de organizações** na plataforma Hubee, desenvolvidos no escopo da tarefa **GOL-196**.

- **Origem YouTrack:** [GOL-196 • Desenho da interface de cadastro e gestão de organização](https://es-unifesp.youtrack.cloud/issue/GOL-196)
- **Base Técnica:** `hubee-webpage` (Next.js 16, Tailwind CSS 4, shadcn/ui)
- **Documentação Relacionada:** [Interfaces do Organizador](./interfaces-do-organizador.md), [Área Logada (Conta)](./tela-da-conta.md) e [Matriz de Permissões RBAC](../regras-negocio/matriz-permissoes-rbac.md)

---

## 1. Visão Geral e Handoff Técnico

Para que um usuário autenticado possa publicar e gerenciar eventos na plataforma Hubee, sua conta deve possuir um vínculo ativo com pelo menos uma **Organização** (como atléticas universitárias, centros acadêmicos, coletivos culturais ou produtoras).

A especificação da **GOL-196** contempla a jornada para se tornar organizador e gerir os dados cadastrais da organização (`name` e `description`), cobrindo os temas **Claro (Light)** e **Escuro (Dark)** e as resoluções **Desktop (`1440px`)** e **Mobile (`375px`)**.

### Mapa de Pontos de Entrada e Componentes

| Componente / Ponto de Entrada | Descrição Visual e Contrato | Rota no Front-end |
| :--- | :--- | :--- |
| **Card "Permissões e perfil" — Sem Organização (`PermissoesCard`)** | Exibe o resumo da conta (`Tipo de conta`, `Objetivo no cadastro` e `Criação de eventos: Não permitida`), seguido de linha divisória e caixa de ação para **Vincular à organização** existente ou **+ Criar organização**. | `/conta/perfil` |
| **Card "Permissões e perfil" — Com Organização (`PermissoesCard`)** | Atualiza o resumo para `Criação de eventos: Permitida`, lista as organizações vinculadas com badge de papel (`Administrador`, `Membro` ou `Leitura`), atalho **"+ Nova organização"** e botão **"Editar organização"**. | `/conta/perfil` |
| **Seção / Modal de Criação e Edição de Organização** | Formulário com os campos **Nome da organização** (`name`) e **Descrição (opcional)** (`description`). A edição é restrita a usuários com papel **Administrador** (`manage`). | `/conta/perfil` e `/organizacoes/nova` |
| **Estado Vazio em "Meus Eventos" (`MeusEventosContent`)** | Quando o usuário acessa a área de eventos sem organização vinculada, exibe estado vazio orientativo com o CTA primário **"Criar organização"**. | `/conta/eventos` |

---

## 2. Seção "Permissões e perfil" em `/conta/perfil`

No **Meu Perfil** (`/conta/perfil`), o cartão **Permissões e perfil** concentra a visualização de acessos e a gestão de organizações em **3 estados principais**, desenhados nos modos **Claro** e **Escuro**:

### 2.1. Estado 1 — Sem Organização Vinculada

Quando o usuário ainda não faz parte de nenhuma organização (`Criação de eventos: Não permitida`):
- Uma **linha divisória sutil** separa o resumo de 3 colunas (`Tipo de conta`, `Objetivo no cadastro` e `Criação de eventos`) da seção **Organizações**;
- O texto de apoio explica como liberar a publicação de eventos: *"Você ainda não faz parte de nenhuma organização. Selecione uma organização existente ou crie uma nova para liberar a criação de eventos."*;
- O sub-card oferece as duas ações possíveis: escolher uma **Organização existente** na lista clicando em **Vincular à organização** (botão primário amarelo `hubee-400`) ou clicar em **+ Criar organização** caso ela ainda não esteja cadastrada.

#### Tema Claro (Sem Organização)
![Permissões e perfil — Claro (Sem organização)](/img/Interfaces_organizador/permissoes-perfil-sem-organizacao-claro.png)

#### Tema Escuro (Sem Organização)
![Permissões e perfil — Escuro (Sem organização)](/img/Interfaces_organizador/permissoes-perfil-sem-organizacao-escuro.png)

---

### 2.2. Estado 2 — Com Organização Vinculada (Visão de Administrador)

Após criar uma organização ou ter o vínculo aceito:
- O resumo superior passa a exibir `Objetivo no cadastro: Organizar eventos` e `Criação de eventos: Permitida`;
- No cabeçalho da seção **Organizações**, o botão secundário **"+ Nova organização"** permanece disponível no canto superior direito;
- Cada organização vinculada é exibida em um cartão horizontal contendo o **nome da organização**, o **badge semântico do papel** (ex.: `Administrador`), o resumo das permissões (*"Gerencia a organização · Cria, edita e publica eventos"*) e, para usuários com nível de acesso `manage` (*Administrador*), o botão de ação **"Editar organização"**.

#### Tema Claro (Com Organização)
![Permissões e perfil — Claro (Com organização)](/img/Interfaces_organizador/permissoes-perfil-com-organizacao-claro.png)

#### Tema Escuro (Com Organização)
![Permissões e perfil — Escuro (Com organização)](/img/Interfaces_organizador/permissoes-perfil-com-organizacao-escuro.png)

---

### 2.3. Estado 3 — Edição dos Dados Cadastrais da Organização

Ao acionar o botão **"Editar organização"** (exclusivo para o papel **Administrador** / permissão `manage`):
- A seção **Editar organização** exibe o indicador `Acesso: Administrador` no canto superior direito;
- Os campos **Nome da organização** (`name`) e **Descrição (opcional)** (`description`) vêm preenchidos com os valores atuais da organização;
- O rodapé à direita apresenta os botões **Cancelar** (retorna à visualização sem salvar) e **Salvar alterações**.

#### Tema Claro (Editando Organização)
![Permissões e perfil — Claro (Editando organização)](/img/Interfaces_organizador/permissoes-perfil-editando-organizacao-claro.png)

#### Tema Escuro (Editando Organização)
![Permissões e perfil — Escuro (Editando organização)](/img/Interfaces_organizador/permissoes-perfil-editando-organizacao-escuro.png)

---

## 3. Estados Obrigatórios de Interface e Validação

No formulário de criação e na seção de edição da organização, a interface contempla os **4 estados obrigatórios**:

| Estado da Interface | Comportamento Visual e Feedback |
| :--- | :--- |
| **1. Formulário Padrão** | Campos `Nome da organização` e `Descrição (opcional)` habilitados, com textos auxiliares de orientação e botão primário ativo em `hubee-400` (`#FACC15`) com texto `hubee-800` (`#302100`). |
| **2. Erros de Validação** | Caso o usuário tente submeter com o nome vazio ou com menos de 2 caracteres, o campo recebe borda semântica de erro (`aria-invalid="true"`) e exibe a mensagem em vermelho logo abaixo do input (*"Informe o nome da organização."* ou *"O nome da organização deve ter pelo menos 2 caracteres."*). |
| **3. Envio / Carregamento (*Loading*)** | Durante o envio, o botão de submissão fica desabilitado (`disabled`, `aria-busy="true"`), exibe o ícone de *spinner* animado e altera o rótulo para **"Criando organização..."** (ou **"Salvando..."**). |
| **4. Confirmação / Sucesso** | Após a conclusão, é exibido um alerta de confirmação (*"Organização criada com sucesso!"* ou *"Dados da organização atualizados com sucesso."*). |
