---
sidebar_position: 2
title: Matriz de Permissões (RBAC) e Organizadores
description: Regras de negócio, matriz RBAC por organização e ciclo de vida de acesso para organizadores de eventos no Hubee.
---

# Matriz de Permissões (RBAC) e Organizadores

Este documento estabelece formalmente as regras de negócio de como um usuário assume o papel de organizador e define a matriz de controle de acesso baseado em papéis (**RBAC**) da plataforma Hubee.

> **Origem e Rastreabilidade:** Especificação definida na tarefa **GOL-143**, fundamentada no estudo técnico de arquitetura **GOL-109** ([Spike: Modelo de permissões de organizador](../spikes/modelo-permissoes-organizador.md)).

---

## 1. O Vínculo Aceito é a Porta de Entrada

O acesso às funcionalidades e interfaces de organizador depende **exclusivamente** de um registro ativo na tabela `organization_users` com status `invite_status = 'accepted'`.

```mermaid
flowchart TD
    U[Usuário Autenticado] --> V{Possui vínculo em organization_users?}
    V -- Não --> C[Perfil Comprador: Apenas Pedidos e Perfil]
    V -- Sim --> S{invite_status == 'accepted'?}
    S -- pending / rejected --> C
    S -- accepted --> O[Perfil Organizador: Habilita Meus Eventos e Gestão da Org Ativa]
```

* **Independência de Perfis:** Um usuário que possui perfil de organizador continua acessando normalmente seus próprios ingressos, pedidos e dados de comprador.
* **Autodeclaração Não Concede Acesso:** A intenção de cadastro (`signupIntent = 'ORGANIZE'`) ou qualquer manipulação no front-end não concede privilégios de gestão. Apenas a existência do vínculo aceito no banco de dados habilita a área de organizador.
* **Escopo por Organização:** O papel pertence à organização ativa no momento, e não à conta global do usuário.

---

## 2. Níveis de Acesso e Papéis Formais

Dentro do escopo de uma organização, existem três papéis formais derivados das colunas `role` e `permission` de `organization_users`:

| Nível / Papel | Schema (`role` / `permission`) | Descrição e Escopo |
| :--- | :--- | :--- |
| **Administrador (`manage`)** | `role = 'admin'`<br/>`permission = 'full'` | Gestão completa da organização: gerenciar membros, editar dados da entidade, criar, editar, publicar e cancelar eventos. |
| **Membro / Operador (`write`)** | `role = 'member'`<br/>`permission = 'full'` | Operação de eventos: criar, duplicar, editar e publicar eventos e lotes de ingressos. Não gerencia membros nem dados cadastrais da organização. |
| **Leitura / Auditor (`read`)** | `role = 'member'`<br/>`permission = 'read_only'` | Consulta e auditoria: visualiza eventos, métricas de vendas e relatórios financeiros/operacionais. Não possui permissão de escrita, criação ou exclusão. |

> ⚠️ **Invariante de Domínio:** O papel `admin` sempre implica permissão `full`. A combinação `role = 'admin'` com `permission = 'read_only'` é terminantemente **inválida** e deve ser rejeitada em validações de schema e DTOs.

---

## 3. Matriz Formal de Capacidades por Papel

A tabela abaixo resume as capacidades de cada papel no contexto da **organização ativa**:

| Capacidade | Administrador (`manage`) | Membro (`write`) | Leitura (`read`) | Sem vínculo aceito |
| :--- | :---: | :---: | :---: | :---: |
| **Acessar eventos da organização** | Sim | Sim | Sim (somente visualização) | Não |
| **Ver relatórios e métricas de vendas** | Sim | Sim | Sim (somente visualização) | Não |
| **Criar e duplicar eventos** | Sim | Sim | Não (botão desabilitado) | Não |
| **Editar eventos e lotes de ingressos** | Sim | Sim | Não | Não |
| **Publicar eventos e lotes** | Sim | Sim | Não | Não |
| **Cancelar eventos** | Sim * | Não | Não | Não |
| **Gerenciar equipe e convites de membros** | Sim | Não | Não | Não |
| **Alterar dados cadastrais da organização** | Sim | Não | Não | Não |

*\* Regra de interface: Não oferecer ação de cancelamento para eventos que já se encontrem com status `Encerrado` (`finished`) ou `Cancelado` (`cancelled`). A ação "Ver página pública" só é disponibilizada para eventos `Publicado` ou `Encerrado` com página acessível.*

---

## 4. Contexto Organizacional e Troca de Papel

### "Trocar de organização troca o papel — nunca soma privilégios"

Um usuário pode pertencer a múltiplas organizações (por exemplo, Administrador na *Organização A* e Leitura na *Organização B*). O sistema opera sob isolamento estrito de contexto:

* Ao selecionar a *Organização A*, o usuário opera com privilégios de Administrador.
* Ao alternar para a *Organização B*, seus privilégios passam imediatamente a ser de Leitura.
* Em nenhuma hipótese permissões de diferentes organizações são combinadas ou herdadas.

### Situação do Vínculo e Efeito na Interface

| Situação do Vínculo | Efeito na Interface | Regra de Autorização |
| :--- | :--- | :--- |
| **`accepted`** | Habilita rota `/conta/eventos`, seletor de organização e atalhos no menu de navegação. | Aplica permissões estritas da organização ativa. |
| **`pending` ou `rejected`** | Mantém a visualização padrão de comprador (`/conta/pedidos`, `/conta/perfil`). A organização não aparece no seletor. | Bloqueio total de acesso e rotas da organização. |
| **`revoked` (Revogado)** | Contexto da organização é removido de imediato da sessão do usuário. | Bloqueio imediato; não afeta vínculos aceitos com outras entidades. |
| **Sem vínculo aceito** | Navegação de comprador pura. Exibe CTA informativo "Criar Organização" no perfil. | Sem acesso a rotas de gestão. |

---

## 5. Ciclo de Vida: Como um Usuário Vira Organizador

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant Web as Hubee Web
    participant API as Hubee API (Backend)
    participant DB as Banco de Dados

    alt Criação de Nova Organização
        U->>Web: Clica em "Criar Organização"
        Web->>API: POST /organizations { name, description... }
        API->>DB: Cria organização e insere vínculo (role: admin, permission: full, invite_status: accepted)
        API-->>Web: Retorna organização criada
        Web-->>U: Redireciona para /conta/eventos com papel Administrador
    else Convite por Organização Existente
        actor Admin as Administrador
        Admin->>Web: Convida membro por e-mail com papel definido
        Web->>API: POST /organizations/:id/users { userId, role, permission }
        API->>DB: Cria registro com invite_status = 'pending'
        U->>Web: Recebe e aceita o convite
        Web->>API: PATCH /organizations/:id/users/:userId/accept
        API->>DB: Atualiza invite_status = 'accepted'
        Web-->>U: Habilita acesso à organização com o papel atribuído
    end
```

---

## 6. Diretrizes de Segurança na Implementação

### "Esconder controles não é autorização"

* **Validação Obrigatória no Servidor:** A ocultação ou desativação de botões no front-end serve para oferecer uma experiência de usuário (UX) clara. Toda operação de mutação (criação, edição, publicação, exclusão) é obrigatoriamente validada no backend via `OrganizationAccessGuard`.
* **Escopo por Tenant:** Todas as consultas no banco de dados devem incluir a cláusula `WHERE organization_id = :activeOrgId` para prevenir vazamento ou alteração indevida de dados entre organizações.
* **Revogação Instantânea:** O status e as permissões do usuário devem ser revalidados a cada requisição sensível, impedindo o uso de sessões obsoletas após a revogação de um membro.

---

## 7. Política de Autorização: Comprador, Organizador e Administrador da Plataforma

Além dos papéis dentro de uma organização, a plataforma tem um papel global, gravado em `users.role`. As duas dimensões são independentes:

| Perfil | Como é identificado | Escopo |
| :--- | :--- | :--- |
| **Comprador** | `role = 'USER'` sem vínculo aceito em `organization_users`. | Compra ingressos e acessa apenas os próprios pedidos, ingressos e perfil. |
| **Organizador** | `role = 'USER'` com ao menos um vínculo aceito. | Tudo o que o comprador faz, mais as capacidades do seu papel (seção 3) **apenas** na organização do recurso. |
| **Administrador da plataforma** | `role = 'ADMIN'`. | Acesso total a todas as organizações. É o único que pode destacar eventos na página inicial (`featured`). |

* O papel global `ADMIN` **não** é atribuído pelo cadastro: o campo `role` não é aceito no corpo de `POST /auth/register`.
* O papel `admin` de uma organização (`organization_users.role`) não tem relação com o `ADMIN` da plataforma: ele só vale dentro daquela organização.

### Aplicação na API (GOL-144)

As regras desta matriz já valem para os eventos na `hubee-api`:

| Ação | Exigência na API | Resposta para quem não pode |
| :--- | :--- | :--- |
| Ver papéis do usuário logado | `GET /users/me` (ou `/auth/me`) devolve `organizations` com `role`, `permission` e `level` de cada vínculo aceito. | — |
| Criar evento (`POST /events`) | `ADMIN` ou nível `write` na organização do `organizerId`. | `403 Forbidden` (comprador ou membro só com `read`) |
| Editar evento (`PATCH /events/:id`) | `ADMIN` ou nível `write` na organização dona do evento. | `404 Not Found` para quem não é membro; `403` para membro só com `read` |
| Cancelar evento (`DELETE /events/:id` ou `PATCH` com `status: cancelled`) | `ADMIN` ou nível `manage`. | `403` para membro sem `manage`; `404` para quem não é membro |
| Ver rascunhos da organização | `GET /events?organizerId=<org>` feito por `ADMIN` ou por membro da organização. | Os demais só veem eventos publicados |
| Destacar na home (`featured`) | Só `ADMIN`. | `403` |

Recurso de outra organização responde `404`, e não `403`, para não revelar que ele existe. Os detalhes técnicos (decorator `@OrgAccess`, ordem das verificações e códigos de erro) estão em [Autenticação e cadastro](../backend/autenticacao.md#autorização-por-organização).

---

## 8. Prancha Visual de Referência (Figma GOL-143)

Abaixo está a prancha oficial de especificação de regras de negócio e matriz RBAC desenhada no Figma:

![GOL-143 - Regras de negócio e matriz RBAC](/img/Interfaces_organizador/gol-143-regras-negocio-matriz-rbac.png)
