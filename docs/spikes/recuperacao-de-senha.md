---
sidebar_position: 4
---

# Recuperação de senha

## Status

Proposta para validação do time (GOL-110). Nenhum código foi alterado. Os preços
e limites dos serviços de e-mail são de outubro de 2026 e mudam com frequência;
conferir nos sites dos provedores antes de contratar.

## Objetivo

Escolher o serviço de e-mail e definir o formato do fluxo de recuperação de
senha (token de uso único com validade), registrando o que o projeto ainda não
tem para suportá-lo.

## Contexto

- A API roda no Render, o front na Vercel e o banco no Neon.
- O link "Esqueci minha senha" existe em `login-form.tsx`, mas não leva a lugar
  nenhum. A recuperação de senha ficou fora do escopo do plano da tela de login.
- Não há biblioteca de envio de e-mail nem variável de ambiente para isso. O
  `env.validation.ts` só valida banco e `JWT_SECRET`.
- A senha usa `bcrypt` com 10 rounds, e `UsersService.changePassword` já
  existe.
- O JWT é sem estado e dura 1 dia.

## Comparação dos serviços

| Serviço | Plano gratuito | Observações |
| ------- | -------------- | ----------- |
| Resend | 100 e-mails por dia e 3.000 por mês | Envia por API HTTPS. Precisa de domínio verificado para entregar a outras pessoas. |
| SendGrid | Sem plano gratuito permanente: 60 dias de teste, depois a partir de ~US$ 19,95/mês | O plano gratuito foi retirado em maio de 2025. |
| SMTP (Gmail ou similar) | Depende do provedor | O Render bloqueia as portas 25, 465 e 587 no plano gratuito. |

## Proposta

### Serviço

Resend. É a única opção que funciona sem custo no Render e não expira: usa HTTPS
em vez de SMTP, e 100 e-mails por dia cobrem o volume esperado de recuperações.
Depende de o projeto ter um domínio (ponto em aberto 1).

### Fluxo

1. `POST /auth/forgot-password` recebe o e-mail e responde sempre igual, exista
   a conta ou não, para não revelar quem está cadastrado.
2. Se a conta existe e está ativa, gera um token aleatório de 32 bytes e guarda
   só o hash dele, com `user_id`, `expires_at` e `used_at`.
3. O e-mail leva um link para o front, como `/redefinir-senha?token=...`, com
   validade de 30 a 60 minutos.
4. `POST /auth/reset-password` recebe o token e a senha nova, troca a senha e
   marca o token como usado. Um token usado ou expirado é recusado.
5. Pedir um novo token invalida os anteriores do mesmo usuário.

## O que o projeto ainda não tem

Lacunas encontradas na análise, para serem consideradas no planejamento:

- Integração com serviço de e-mail e as variáveis de ambiente dela.
- Tabela para guardar os tokens de recuperação.
- Rotas `forgot-password` e `reset-password` na API.
- Telas de "Esqueci minha senha" e "Redefinir senha" no front.
- Limite de requisições nas rotas públicas (ponto em aberto 4).
- Domínio próprio com SPF e DKIM configurados (ponto em aberto 1).

## Alternativas consideradas

- **SendGrid:** o período gratuito acaba em 60 dias e o plano pago custa mais do
  que o projeto precisa.
- **SMTP:** exigiria plano pago no Render, e a porta 25 continua bloqueada mesmo
  nele.
- **Código numérico por e-mail em vez de link:** é mais fácil de digitar, mas
  tem espaço de busca pequeno e exige limite de tentativas mais rígido.

## Pontos em aberto

1. O projeto tem domínio próprio? Sem domínio verificado, a Resend só entrega
   para o e-mail da conta dela, o que serve para testar, mas não para usuários
   reais.
2. O Render é plano gratuito ou pago? Define se SMTP é uma opção.
3. O JWT é sem estado e dura 1 dia, então, depois de redefinir a senha, os
   tokens antigos continuam válidos até expirar. Quem recupera a conta porque
   perdeu o acesso não derruba as sessões de quem a invadiu. Resolver exigiria
   guardar uma versão da senha (ou data da última troca) e checá-la no
   `JwtAuthGuard`, ou aceitar o risco pelo prazo de 1 dia.
4. O projeto não tem `@nestjs/throttler` nem outro limitador de requisições. As
   rotas `forgot-password` e `login` ficam sujeitas a spam de e-mail e a
   tentativas repetidas, e o plano gratuito da Resend (100 por dia) pode ser
   esgotado por qualquer pessoa que chame a rota em loop.

## Referências

- [Resend: erro 403 com o domínio resend.dev](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)
- [Resend: preços](https://resend.com/pricing)
- [Render: portas SMTP bloqueadas nos serviços gratuitos](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)
- [SendGrid: fim do plano gratuito](https://dreamlit.ai/blog/best-sendgrid-alternatives)
