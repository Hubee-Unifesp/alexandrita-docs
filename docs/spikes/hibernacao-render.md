---
sidebar_position: 6
---

# Hibernação da API no Render Free

## Status

Proposta para validação do time (GOL-225). Nenhum código foi alterado. Os
limites dos serviços são de novembro de 2026 e mudam com frequência; conferir
nos sites dos provedores antes de configurar.

## Objetivo

Evitar que a primeira visita ao `hubee-webpage` depois de um período sem uso
falhe por timeout enquanto a `hubee-api` acorda no Render, avaliando as
alternativas de keep-alive e de mitigação no front.

## Contexto

- A API roda no plano gratuito do Render, o front na Vercel e o banco no Neon
  (também gratuito).
- O Render desliga um serviço Free depois de **15 minutos sem tráfego de
  entrada**. Segundo a documentação, acordar leva cerca de um minuto.
- A conta tem **750 horas de instância por mês, por workspace**. Serviço
  hibernado não consome horas. Se as horas acabam, **todos** os serviços Free da
  workspace ficam suspensos até o mês seguinte.
- O Neon Free suspende o banco após **5 minutos** sem uso e dá **100 CU-horas
  por mês**. Estourar o limite também suspende o banco até o mês seguinte.
- O front tem dois clientes HTTP: `src/lib/api/client.ts`, com `timeout:
  10_000`, e `src/lib/api/apiClient.ts`, sem timeout. As chamadas que passam
  pelo primeiro falham com "Sem resposta do servidor" durante o cold start.

## Medições

Feitas em 08/11/2026, com a API hibernada:

| Requisição | Resultado |
| ---------- | --------- |
| `GET /health` (primeira, API hibernada) | `200` em **43,8 s** |
| `GET /events/summary` (logo depois) | `200` em 1,2 s |
| `GET /health` em `hubee-api.onrender.com` | `404` com `x-render-routing: no-server` |

O cold start passa de 4 vezes o timeout de 10 s do front.

O endereço em produção é **`https://hubee-api-1.onrender.com`**.
`https://hubee-api.onrender.com`, que aparece no `.env.example` do front e na
página de [collections](../backend/collections.md), não aponta para nenhum
serviço.

## O endpoint de ping

O `GET /health` atual roda `select 1` no Postgres. Usado como alvo de
keep-alive, ele acorda o Neon a cada ping: com pings a cada 10 minutos e
suspensão após 5, o banco ficaria praticamente sempre ligado. A 0,25 CU, 16
horas por dia dão cerca de 120 CU-horas por mês, acima das 100 do plano
gratuito.

Por isso, qualquer alternativa de keep-alive precisa de uma rota que responda
direto da memória do NestJS, como `GET /health/ping` → `{ "status": "ok" }`,
pública e sem acesso ao banco. A primeira requisição real depois de um tempo
parado ainda acorda o Neon, mas isso leva menos de um segundo.

## Alternativas

### 1. Monitor externo gratuito

Um serviço de fora faz `GET /health/ping` em intervalo fixo.

| Serviço | Intervalo mínimo no plano gratuito | Observações |
| ------- | ---------------------------------- | ----------- |
| cron-job.org | 1 minuto | Jobs ilimitados (uso justo), timeout de 30 s por execução, permite restringir a horários e dias. |
| UptimeRobot | 5 minutos | 50 monitores. Também avisa quando a API cai. Não dá para escolher horário, pinga 24 h. |
| Better Stack | 3 minutos | 10 monitores, com alertas. Também pinga 24 h. |

- **Prós:** sem código além da rota de ping; agendamento pontual; o UptimeRobot
  e o Better Stack ainda servem de alerta de indisponibilidade.
- **Contras:** depende de uma conta pessoal fora do repositório (alguém do time
  precisa ser dono e documentar o acesso); quem pinga 24 h gasta ~744 horas
  por mês, quase toda a cota de 750.

### 2. Workflow agendado no GitHub Actions

Um `.github/workflows/keep-alive.yml` com `schedule` faz o ping.

- **Prós:** fica versionado no repositório, sem conta externa; a URL vai numa
  variável do repositório; o repositório é público, então os minutos de Actions
  não são cobrados; dá para limitar a horários (ex.: `*/10 10-23,0-1 * * *`
  para 07h–23h BRT).
- **Contras:** o GitHub avisa que agendamentos podem atrasar em horários de
  carga, e há relatos de 15 a 30 minutos de atraso, o que basta para o Render
  hibernar; agendamentos só rodam na branch padrão (`main`); em repositório
  público, o agendamento é desligado sem aviso depois de 60 dias sem atividade
  (férias, fim de semestre).

### 3. Cron da Vercel

- **Prós:** fica junto do front.
- **Contras:** no plano Hobby, o cron roda no máximo uma vez por dia. Não serve.

### 4. Resiliência no front

Mitiga o sintoma, não a hibernação. Pode ser combinado com qualquer outra
alternativa.

- Aumentar o timeout de `client.ts` para 60 s, ou só nas primeiras chamadas.
- Tentar de novo, de forma transparente, quando a requisição falhar sem
  resposta do servidor.
- "Acordar" a API logo ao abrir o site, com um `GET /health/ping` sem esperar
  a resposta, e mostrar uma mensagem de carregamento como "Iniciando serviços
  da colmeia..." enquanto ela não responde.
- Unificar os dois clientes HTTP, que hoje têm comportamentos diferentes.
- **Prós:** sem dependência externa; continua valendo se o keep-alive falhar ou
  as horas acabarem.
- **Contras:** a primeira pessoa ainda espera ~45 s; exige mudanças no front e
  testes nos estados de carregamento.

### 5. Plano pago do Render

- **Prós:** o plano Starter não hiberna; resolve sem gambiarra.
- **Contras:** custa por mês (conferir o valor atual na página de preços do
  Render), o que o projeto acadêmico não prevê.

## Proposta

1. Criar `GET /health/ping` na API, público e sem acesso ao banco, e
   incluí-lo em `route-protection.spec.ts`.
2. Usar o **cron-job.org** pingando a cada 10 minutos das 07h às 23h (BRT). É a
   única opção gratuita com agendamento pontual e restrição de horário. Fica
   em ~500 horas por mês, deixando folga na cota para previews e outros
   serviços.
3. Opcionalmente, um monitor no **UptimeRobot** em `GET /health` a cada 5
   minutos só para alertas de queda, se a cota de horas permitir pingar 24 h
   (ver ponto em aberto 1). Nesse caso, ele já substitui o cron-job.org.
4. No front, aumentar o timeout e acordar a API ao abrir o site, para cobrir a
   madrugada e falhas do keep-alive.
5. Corrigir a URL de produção no `.env.example` do front e na página de
   collections.

## Pontos em aberto

1. Quantos serviços Free existem na workspace do Render da equipe e quantas
   horas já foram usadas neste mês? Não foi possível consultar o painel nesta
   spike. Com só a `hubee-api`, pingar 24 h cabe na cota (~744 de 750 horas).
   Com mais serviços, é preciso restringir o horário.
2. Quem é dono da conta do monitor externo e onde o acesso fica registrado?
3. O Render não proíbe keep-alive na documentação do plano gratuito, mas a
   prática pode mudar. Vale reavaliar se a política de uso for atualizada.
4. Falta validar o critério de aceite: abrir o `hubee-webpage` depois de 15
   minutos sem uso, com o keep-alive ligado, e confirmar que não há timeout.

## Referências

- [Render: Deploy for Free (hibernação e 750 horas)](https://render.com/docs/free)
- [Neon: preços e limites do plano gratuito](https://neon.com/pricing)
- [Neon: limites e cotas do plano gratuito](https://neon.com/faqs/free-plan-limits-and-quotas)
- [UptimeRobot: intervalos de monitoramento](https://help.uptimerobot.com/en/articles/11360876-what-is-a-monitoring-interval-in-uptimerobot/)
- [cron-job.org: FAQ](https://cron-job.org/faq/)
- [GitHub Actions: limites e agendamentos desativados](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration)
- [Atrasos em agendamentos do GitHub Actions](https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/)
