---
sidebar_position: 3
---

# Cold start da API

A `hubee-api` roda no plano gratuito do Render, que hiberna o serviço depois de
15 minutos sem tráfego. Acordar leva cerca de 45 segundos. Fora da janela do
keep-alive (23h–07h) ou se ele falhar, a primeira visita ao site encontra a API
dormindo. Veja a [spike de hibernação](../spikes/hibernacao-render.md) para o
contexto completo.

O `hubee-webpage` trata esse cenário em três pontos (GOL-256).

## Timeout adaptativo no `apiClient`

O `apiClient` (`src/lib/api/apiClient.ts`) tem timeout padrão de **10 s**.
Enquanto a API não estiver confirmada como acordada, o interceptor de
requisição troca esse valor por **60 s**, o suficiente para o cold start.

- A API é considerada acordada quando qualquer chamada recebe resposta do
  servidor, inclusive erros HTTP como 401 ou 404.
- Depois de **10 minutos** sem nenhuma resposta, ela volta a ser considerada
  dormindo, já que o Render hiberna aos 15.
- Falhas sem resposta (rede, timeout) não mudam o estado.
- Uma chamada com `timeout` explícito diferente do padrão mantém o próprio
  valor.

A regra fica em `src/lib/api/api-status.ts`. Nenhuma requisição é repetida
automaticamente, então um `POST` (login, checkout) nunca é enviado duas vezes.

## Ping ao abrir o site

O componente `ApiWakeNotice` (`src/components/api-wake/api-wake-notice.tsx`),
montado no layout raiz, dispara `GET /health/ping` assim que o site abre. A
rota responde direto da memória da API, sem acordar o banco.

## Aviso de carregamento

Se o ping não responder em **3 segundos**, aparece no rodapé o aviso
"Iniciando serviços da colmeia… isso pode levar até um minuto.", com
`role="status"`. Ele some quando o ping responde ou falha.

## Validação

Em 16/11/2026, às 23h45, com a API de produção hibernada, a home carregou sem
erro: `GET /health/ping` e `GET /events/summary` responderam em 43,6 s, com o
aviso visível durante a espera.
