---
sidebar_position: 5
title: Catálogo de bugs da plataforma (GOL-169)
description: Mapeamento dos bugs da hubee-api e da hubee-webpage, com passos para reproduzir, resultado obtido e esperado, severidade e cruzamento com as tasks existentes.
---

# Catálogo de bugs da plataforma

## Objetivo

Registrar os bugs encontrados nos testes exploratórios e na auditoria técnica da
plataforma Hubee, para discussão com o time. Cada bug traz os passos para
reproduzir, o resultado obtido e o resultado esperado.

## Escopo e método

- **Versões analisadas:** `develop` da `hubee-api` (`cee90f4`) e da
  `hubee-webpage` (`bb801d9`), em 02/11/2026.
- **Ambiente:** API e frontend locais, sobre um Postgres novo, com `db:migrate`
  e `db:seed`.
- **Tasks consideradas:** as 171 issues do projeto GOL no YouTrack, em
  02/11/2026. Os itens deste catálogo não têm task aberta específica.
- **Evidência:**
  - **Reproduzido:** o comportamento errado foi executado e observado.
  - **Leitura de código:** o caminho foi identificado no código, mas não
    executado.

### Cobertura

| Atividade da task | O que foi feito |
| --- | --- |
| Fluxo de visitante | Home, busca, detalhes do evento, Sobre, login e cadastro |
| Fluxo de comprador | Detalhes do evento, carrinho, checkout, Meus Pedidos, Meus Ingressos e perfil |
| Fluxo de organizador | Meus Eventos e detalhes de evento em rascunho |
| Mobile | Rotas dos três perfis a 375 px: nenhuma com rolagem horizontal; um corte em card ([BUG-21](#bug-21)) |
| Tema escuro | Detalhe do pedido conferido visualmente, sem problema de legibilidade |
| Network e console | Rotas dos três perfis: um único tipo de resposta 4xx/5xx ([BUG-22](#bug-22)) e nenhum erro de console no tema padrão, conferido em três rotas |
| Contratos da API | Cenários de pedido, pagamento, ingresso, lote e autenticação executados por HTTP |

### Verificações automáticas

| Verificação | `hubee-api` | `hubee-webpage` |
| --- | --- | --- |
| Lint | Passa | Passa |
| `tsc --noEmit` | **7 erros** ([BUG-18](#já-corrigidos)) | Passa |
| Testes | 946 de 946 passam (`--runInBand`) | 90 de 90 passam |
| Build | Não executado | Passa, com aviso ([BUG-25](#bug-25)) |
| Migrations em banco novo | Passam | Não se aplica |

### Fora do escopo

- **Branches dos PRs abertos:** as descrições e parte do código foram lidas, mas
  as branches não foram executadas.
- **Produção:** o Neon não foi consultado. A URL
  `https://hubee-api.onrender.com`, do `.env.example` do frontend, respondeu `404`
  em `/health` e `/events/summary`. Vale confirmar se ela ainda é a correta.
- **Módulos administrativos:** despesas, tarefas e fornecedores só tiveram a
  proteção de rota conferida.
- **Concorrência:** compras simultâneas não foram testadas.
- **Tema escuro:** só uma tela foi conferida visualmente depois de ativar o
  tema pelo botão.

## Bugs que já têm task

Estes bugs não entram na numeração do catálogo, para não duplicar o que já está
sendo tratado.

| Task | Estado | Bug | O que foi observado na `develop` |
| --- | --- | --- | --- |
| [GOL-177](https://es-unifesp.youtrack.cloud/issue/GOL-177) | To Verify | Fluxo de compra não integrado à API | Confirmado: carrinho e checkout mostram dados fixos e não geram pedido. [PR #51](https://github.com/Hubee-Unifesp/hubee-webpage/pull/51) aberto |
| [GOL-186](https://es-unifesp.youtrack.cloud/issue/GOL-186) | In Progress | Token não é repassado no SSR do detalhe do evento | Confirmado: o organizador vê "Evento não encontrado" no próprio rascunho, embora a API responda `200` com o token dele |
| [GOL-187](https://es-unifesp.youtrack.cloud/issue/GOL-187) | To Verify | CTAs da Home ignoram a sessão | Não executado. [PR #50](https://github.com/Hubee-Unifesp/hubee-webpage/pull/50) aberto |
| [GOL-190](https://es-unifesp.youtrack.cloud/issue/GOL-190) | Open | Rodapé ausente na área logada e com `role` errado | Confirmado: sem rodapé na área logada e com "Entrar" no detalhe do evento para quem está logado |
| [GOL-192](https://es-unifesp.youtrack.cloud/issue/GOL-192) | To Verify | Falso positivo no upload da foto de perfil | Confirmado por leitura de código. PRs abertos: [API #65](https://github.com/Hubee-Unifesp/hubee-api/pull/65) e [Web #49](https://github.com/Hubee-Unifesp/hubee-webpage/pull/49) |
| [GOL-193](https://es-unifesp.youtrack.cloud/issue/GOL-193) | Open | Tema escuro não persiste | Confirmado: ao recarregar, a página volta para o tema claro |

## Resumo

Nenhum destes itens tem task aberta específica. Os critérios de severidade são:

- **Crítica:** impede a venda ou causa perda financeira direta.
- **Alta:** quebra uma regra de negócio em um fluxo normal, sem depender de erro
  do ADMIN.
- **Média:** gera dados incoerentes ou depende de uma operação de ADMIN.
- **Baixa:** tem impacto pontual, é cosmético ou é saúde do projeto.

| ID | Severidade | Área | Bug | Evidência |
| --- | --- | --- | --- | --- |
| [BUG-01](#bug-01) | Crítica | Web · Perfil | Quem se cadastra pelo site não consegue comprar | Reproduzido |
| [BUG-02](#já-corrigidos) | Alta | API · Pagamento | O checkout aceita pedido de evento cancelado | Corrigido ([GOL-211](https://es-unifesp.youtrack.cloud/issue/GOL-211)) |
| [BUG-03](#já-corrigidos) | Alta | API · Pedido | Pedido pendente reserva o lote para sempre | Corrigido ([GOL-212](https://es-unifesp.youtrack.cloud/issue/GOL-212)) |
| [BUG-04](#já-corrigidos) | Alta | API · Banco | Bancos migrados antes da `0000` ser regerada não migram | Corrigido ([GOL-213](https://es-unifesp.youtrack.cloud/issue/GOL-213)) |
| [BUG-05](#já-corrigidos) | Média | API · Pedido | Cancelar pedido pago mantém o ingresso válido e libera o saldo | Corrigido ([GOL-214](https://es-unifesp.youtrack.cloud/issue/GOL-214)) |
| [BUG-06](#já-corrigidos) | Média | API · Pedido | ADMIN marca pedido como pago sem pagamento nem ingressos | Corrigido ([GOL-214](https://es-unifesp.youtrack.cloud/issue/GOL-214)) |
| [BUG-07](#bug-07) | Média | API · Pagamento | O estorno não altera o pedido nem os ingressos | Em andamento ([GOL-215](https://es-unifesp.youtrack.cloud/issue/GOL-215)) |
| [BUG-08](#já-corrigidos) | Média | API · Ingresso | A emissão manual de ingressos ignora o estoque | Corrigido ([GOL-216](https://es-unifesp.youtrack.cloud/issue/GOL-216)) |
| [BUG-09](#já-corrigidos) | Média | API · Evento | Lotes de rascunho ficam visíveis para visitantes | Corrigido ([GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217)) |
| [BUG-10](#já-corrigidos) | Média | API · Auth | O token continua valendo depois de excluir a conta | Corrigido ([GOL-218](https://es-unifesp.youtrack.cloud/issue/GOL-218)) |
| [BUG-11](#bug-11) | Média | API · Auth | O login não limita tentativas | Em andamento ([GOL-219](https://es-unifesp.youtrack.cloud/issue/GOL-219)) |
| [BUG-12](#bug-12) | Média | API · Evento | Ingressos cancelados continuam contando como vendidos | Em andamento ([GOL-215](https://es-unifesp.youtrack.cloud/issue/GOL-215)) |
| [BUG-13](#bug-13) | Média | Web · Pedidos | Ingressos de evento encerrado ficam sem o evento | Em andamento ([GOL-220](https://es-unifesp.youtrack.cloud/issue/GOL-220)) |
| [BUG-14](#bug-14) | Média | Web · Pedidos | Pedido pendente aparece sem evento e sem ação | Em andamento ([GOL-220](https://es-unifesp.youtrack.cloud/issue/GOL-220)) |
| [BUG-15](#já-corrigidos) | Baixa | API · Lote | Excluir lote com vendas responde `500` | Corrigido ([GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217)) |
| [BUG-16](#já-corrigidos) | Baixa | API · Lote | A capacidade do lote pode ficar abaixo do vendido | Corrigido ([GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217)) |
| [BUG-17](#bug-17) | Baixa | Web · Perfil | O front aceita senha de 8 a 72 caracteres, e a API só de 6 a 20 | Em andamento ([GOL-219](https://es-unifesp.youtrack.cloud/issue/GOL-219)) |
| [BUG-18](#já-corrigidos) | Baixa | API · Testes | `tsc` acusa 7 erros em specs | Corrigido ([GOL-223](https://es-unifesp.youtrack.cloud/issue/GOL-223)) |
| [BUG-19](#bug-19) | Baixa | Web · Eventos | Categorias fora das seis conhecidas viram "Outros" | Reproduzido |
| [BUG-20](#bug-20) | Baixa | Web · Rotas | Rota inexistente manda o visitante para o login | Reproduzido |
| [BUG-21](#bug-21) | Baixa | Web · Mobile | O menu do card em Meus Eventos fica cortado | Reproduzido |
| [BUG-22](#bug-22) | Baixa | Web · Network | Meus Pedidos faz uma requisição por pedido e gera `404` | Em andamento ([GOL-220](https://es-unifesp.youtrack.cloud/issue/GOL-220)) |
| [BUG-23](#bug-23) | Baixa | Web · Auth | O interceptor de 401 verifica `/register`, não `/cadastro` | Leitura de código |
| [BUG-24](#bug-24) | Baixa | Web · API | Dois clients HTTP com o mesmo nome | Leitura de código |
| [BUG-25](#bug-25) | Baixa | Web · Next.js | `middleware.ts` é uma convenção depreciada | Reproduzido |
| [BUG-26](#bug-26) | Baixa | Web · Textos | A interface promete coisas que a plataforma não faz | Leitura de código |

## Críticos e altos

### BUG-01

**Quem se cadastra pelo site não consegue comprar**

- **Severidade:** Crítica · **Evidência:** Reproduzido
- **Onde:** `src/app/(logado)/conta/completar-perfil/page.tsx` e
  `src/components/conta/perfil/dados-pessoais-form.tsx` (web)

**Passos**

1. Criar uma conta pelo site e abrir o perfil.
2. Abrir `/conta/completar-perfil`.
3. Chamar `POST /orders` com o token dessa conta.

**Obtido:** o perfil não tem campos de CPF e data de nascimento, a página de
completar perfil só mostra "Em breve" e a API responde `403`
(`PROFILE_INCOMPLETE`). O comprador do seed também não tem esses dados.

**Esperado:** a pessoa consegue informar os dados e concluir a compra.

**Correção sugerida:** implementar a página com `PATCH /users/me`, que já aceita
`cpf` e `birthDate`, e preencher esses campos no seed. A GOL-177 não resolve este
item: o PR #51 o lista como fora do escopo.

## Médios

### BUG-07

**O estorno não altera o pedido nem os ingressos**

- **Severidade:** Média · **Evidência:** Reproduzido
- **Onde:** `src/payment/payment.service.ts` (`update`)

**Passos:** pagar um pedido e, como ADMIN, passar o pagamento para `estornado`.

**Obtido:** o pedido continua `pago`, e os ingressos continuam `emitido`. O filtro
"Estornados" de Meus Pedidos nunca encontra nada, porque o enum de pedido da API
não tem esse status.

**Esperado:** o estorno invalida os ingressos e aparece no pedido.

**Correção sugerida:** atualizar pedido e ingressos na mesma transaction e
adicionar `estornado` ao enum de pedido.

### BUG-11

**O login não limita tentativas**

- **Severidade:** Média · **Evidência:** Reproduzido
- **Onde:** `src/auth/auth.controller.ts`

**Passos:** chamar `POST /auth/login` 30 vezes com senha errada.

**Obtido:** todas as tentativas respondem `401`, sem bloqueio.

**Esperado:** `429` depois de um limite de tentativas.

**Correção sugerida:** adicionar `@nestjs/throttler` em `/auth/login` e
`/auth/register`.

### BUG-12

**Ingressos cancelados continuam contando como vendidos**

- **Severidade:** Média · **Evidência:** Reproduzido
- **Onde:** `src/event/event.repository.ts` (`soldInBatch`, `ticketsSold`)

**Passos:** comprar um ingresso, cancelá-lo como ADMIN e consultar
`GET /events/summary`.

**Obtido:** `ticketsSold` não muda. Por leitura de código, a vaga também não volta
ao lote.

**Esperado:** o ingresso cancelado deixa de contar, conforme a regra que o time
definir para devolução de saldo.

**Correção sugerida:** ignorar ingressos cancelados nas contagens.

### BUG-13

**Ingressos de evento encerrado ficam sem o evento**

- **Severidade:** Média · **Evidência:** Reproduzido
- **Onde:** `src/lib/api/orders.ts` (`getEvento`, na web) e
  `src/event/event.service.ts` (`findVisible`, na API)

**Passos**

1. Comprar um ingresso.
2. Como ADMIN, passar o evento para `finished`.
3. Abrir Meus Ingressos.

**Obtido:** o ingresso aparece como "Evento indisponível" e "Válido", na seção de
próximos eventos. A API responde `404` para o evento, mesmo com o token do titular.

**Esperado:** o titular continua vendo os dados do evento, e o ingresso vai para
"Anteriores".

**Correção sugerida:** o PR #51 passa Meus Ingressos para `GET /users/me/tickets`.
O histórico de pedidos ainda precisa receber os dados do evento pela API. Este
item é diferente da [GOL-186](https://es-unifesp.youtrack.cloud/issue/GOL-186),
que trata do organizador.

### BUG-14

**Pedido pendente aparece sem evento e sem ação**

- **Severidade:** Média · **Evidência:** Reproduzido
- **Onde:** `src/lib/api/orders.ts` e `src/components/conta/pedidos/` (web)

**Passos:** criar um pedido pendente e abrir Meus Pedidos e o detalhe do pedido.

**Obtido:** a tela mostra só número, data e valor, sem o evento e sem opção de
pagar ou cancelar.

**Esperado:** a tela mostra os itens do pedido e permite pagar ou cancelar. Sem
isso, o comprador não consegue liberar a reserva do [BUG-03](#já-corrigidos).

**Correção sugerida:** usar `items` de `GET /orders/:id`, em vez de deduzir os
itens a partir dos ingressos.

## Baixos

### BUG-17

**O front aceita senha de 8 a 72 caracteres, e a API só de 6 a 20**

- **Onde:** `src/lib/validations/profile.schema.ts` (web) e
  `src/users/dto/change-password.dto.ts` (API)
- **Passos:** enviar uma senha de 28 caracteres para `POST /auth/register`. A
  troca de senha usa o mesmo limite no DTO, conferido por leitura de código.
- **Obtido:** `400` com "A senha deve ter entre 6 e 20 caracteres", enquanto o
  perfil orienta "De 8 a 72 caracteres".
- **Esperado:** a mesma regra nos dois lados. O limite de 72 faz sentido por causa
  do bcrypt.

### BUG-19

**Categorias fora das seis conhecidas viram "Outros"**

- **Onde:** `src/lib/api/events.ts` (`toCategory`, na web)
- **Passos:** abrir `/eventos` com os dados do seed.
- **Obtido:** "Música" e "Comédia" aparecem como "Outros".
- **Esperado:** API e frontend usam a mesma lista, de preferência um enum.

### BUG-20

**Rota inexistente manda o visitante para o login**

- **Onde:** `src/middleware.ts`
- **Passos:** sem sessão, abrir `/rota-inexistente`.
- **Obtido:** redirecionamento para `/login`.
- **Esperado:** a página de "não encontrado".

### BUG-21

**O menu do card em Meus Eventos fica cortado**

- **Onde:** `src/components/conta/eventos/evento-organizador-card.tsx`
- **Passos:** como organizador, abrir `/meus-eventos` a 375 px.
- **Obtido:** o botão de menu, ao lado de "Gerenciar", fica cortado pela borda do
  card.
- **Esperado:** o botão aparece inteiro.

### BUG-22

**Meus Pedidos faz uma requisição por pedido e gera `404`**

- **Onde:** `src/lib/api/orders.ts` (`getMyOrders`)
- **Passos:** abrir Meus Pedidos com um pedido pendente e olhar a aba Network.
- **Obtido:** uma chamada a `GET /orders/:id/payments` por pedido, com `404` nos
  pendentes.
- **Esperado:** os dados de pagamento vêm junto com a lista de pedidos.

### BUG-23

**O interceptor de 401 verifica `/register`, não `/cadastro`**

- **Onde:** `src/lib/api/apiClient.ts`
- **Obtido:** por leitura de código, um 401 em `/cadastro` manda a pessoa para o
  login.
- **Esperado:** a verificação usa `/cadastro`.

### BUG-24

**Dois clients HTTP com o mesmo nome**

- **Onde:** `src/lib/api/apiClient.ts` e `src/lib/api/client.ts`
- **Obtido:** os dois exportam `apiClient`. Um envia o token e usa
  `http://localhost:3000` como padrão. O outro não envia o token, tem timeout e usa
  `""` como padrão. Essa divisão contribui para o [BUG-13](#bug-13).
- **Esperado:** um único client que envia o token quando existe.

### BUG-25

**`middleware.ts` é uma convenção depreciada**

- **Onde:** `src/middleware.ts`
- **Passos:** rodar `next build`.
- **Obtido:** aviso de depreciação `middleware-to-proxy`.
- **Esperado:** build sem aviso, depois de rodar
  `npx @next/codemod@latest middleware-to-proxy .`.

### BUG-26

**A interface promete coisas que a plataforma não faz**

- **"Lembre-me"** no login: o valor do checkbox não é usado (`login-form.tsx`).
- **"+ taxa de serviço"** no detalhe do evento: a API não cobra taxa
  (`ticket-type-list.tsx`).
- **"Todos os seus dados serão apagados permanentemente"** ao excluir a conta: a
  API só preenche `deleted_at` e muda o status para `INACTIVE` (`users.service.ts`).
  Esse texto merece atenção por causa da LGPD.

## Já corrigidos

Estes itens constavam do levantamento de 29/10 e foram revalidados na `develop`
atual, ou foram corrigidos nas tasks subsequentes do YouTrack.

| Bug | Correção |
| --- | --- |
| Comprador criava o próprio pagamento já `confirmado` e com qualquer valor | GOL-175: a rota passou a ser `@AdminOnly()`, e `POST /payments` usa o total do pedido |
| O cliente definia o valor do pedido, e o pedido não tinha itens | GOL-175: o pedido tem itens, e o total é calculado no servidor |
| A compra ignorava o estoque do lote | GOL-175: o saldo é validado em transaction. A emissão manual continua no [BUG-08](#já-corrigidos) |
| A migration `0002` falhava em bancos com lotes | GOL-164: `DEFAULT 0` na `0002` e criação da `0004` |
| **BUG-02:** O checkout aceita pedido de evento cancelado | [GOL-211](https://es-unifesp.youtrack.cloud/issue/GOL-211): revalidação dos eventos do pedido em transação (`FOR SHARE` e `isOnSale`) no checkout, retornando `422` se cancelado ou fora de venda |
| **BUG-03:** Pedido pendente reserva o lote para sempre | [GOL-212](https://es-unifesp.youtrack.cloud/issue/GOL-212): expiração de reservas de pedidos pendentes em 15 minutos e validação de saldo no checkout |
| **BUG-04:** Bancos migrados antes da `0000` ser regerada não migram | [GOL-213](https://es-unifesp.youtrack.cloud/issue/GOL-213): migrations `0000` a `0005` tornadas idempotentes (`IF [NOT] EXISTS` e blocos `DO … EXCEPTION WHEN duplicate_object`) para reaplicação segura em bancos existentes |
| **BUG-05:** Cancelar pedido pago mantém o ingresso válido e libera o saldo | [GOL-214](https://es-unifesp.youtrack.cloud/issue/GOL-214): máquina de estados para pedidos; cancelamento invalida ingressos e ajusta saldo em transaction |
| **BUG-06:** ADMIN marca pedido como pago sem pagamento nem ingressos | [GOL-214](https://es-unifesp.youtrack.cloud/issue/GOL-214): remoção de `totalAmount` do DTO de atualização e transição para `pago` restrita ao checkout |
| **BUG-08:** A emissão manual de ingressos ignora o estoque | [GOL-216](https://es-unifesp.youtrack.cloud/issue/GOL-216): validação de estoque, capacidade e itens do pedido na emissão manual |
| **BUG-09:** Lotes de rascunho ficam visíveis para visitantes | [GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217): rota de lotes valida visibilidade do evento e status de autenticação (404 para visitantes em rascunhos) |
| **BUG-10:** O token continua valendo depois de excluir a conta | [GOL-218](https://es-unifesp.youtrack.cloud/issue/GOL-218): validação de usuário ativo e não excluído (`deleted_at is null`) no JWT Auth Guard |
| **BUG-15:** Excluir lote com vendas responde `500` | [GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217): exclusão de lote com ingressos vinculados retorna `409 Conflict` com mensagem descritiva |
| **BUG-16:** A capacidade do lote pode ficar abaixo do vendido | [GOL-217](https://es-unifesp.youtrack.cloud/issue/GOL-217): atualização de capacidade valida quantidade mínima contra ingressos vendidos e reservados (`422`) |
| **BUG-18:** `tsc` acusa 7 erros em specs | [GOL-223](https://es-unifesp.youtrack.cloud/issue/GOL-223): correção dos erros de tipagem nos specs e execução do `tsc` e testes no CI |

## Funcionalidades incompletas

Estes itens não são bugs: são partes do fluxo que ainda não foram implementadas.

- **`/notificacoes`:** é um placeholder.
- **Criar e editar eventos e lotes no frontend:** os botões de `/meus-eventos` só
  mostram um aviso de "em breve". Esse trabalho está na história
  [GOL-165](https://es-unifesp.youtrack.cloud/issue/GOL-165).
- **Gateway de pagamento:** `POST /payments` sempre aprova, porque é simulado
  (GOL-175).

## Próximos passos

Para discutir com o time:

1. **Liberar a venda:** verificar o PR da GOL-177 e abrir uma task para o
   [BUG-01](#bug-01).
2. **Proteger a compra:** abrir uma task para o [BUG-02](#já-corrigidos) e o
   [BUG-03](#já-corrigidos).
3. **Conferir o Neon** ([BUG-04](#já-corrigidos)) antes de migrar a produção.
4. **Regras de estado:** agrupar o [BUG-05](#já-corrigidos), o [BUG-06](#já-corrigidos), o
   [BUG-07](#bug-07), o [BUG-08](#já-corrigidos) e o [BUG-12](#bug-12) numa task de
   pedidos, estornos e ingressos.
5. **Segurança:** agrupar o [BUG-09](#já-corrigidos), o [BUG-10](#já-corrigidos) e o
   [BUG-11](#bug-11).
6. **Telas de pedidos:** agrupar o [BUG-13](#bug-13), o [BUG-14](#bug-14) e o
   [BUG-22](#bug-22).
7. **Itens restantes:** agrupar os demais itens de severidade baixa numa task de
   saúde do projeto.
