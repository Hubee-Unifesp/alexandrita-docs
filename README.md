# Alexandrita Docs

Repositório de documentação do projeto Alexandrita: regras de negócio,
decisões técnicas e guias de setup, organizados por categoria (Backend,
Frontend, Infra, Regras de Negócio).

O site é gerado a partir de arquivos Markdown com [Docusaurus](https://docusaurus.io/)
e o acesso ao conteúdo é restrito por login/senha (HTTP Basic Auth via
Vercel Edge Middleware).

## Setup local

Pré-requisitos: [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm start
```

O site abre em `http://localhost:3000`. Não há autenticação em ambiente
local — a proteção por senha só é aplicada no deploy (Vercel), conforme
configurado em [`middleware.js`](middleware.js).

### Build de produção

```bash
npm run build
npm run serve   # serve o build localmente em http://localhost:3000
```

## Estrutura do conteúdo

```
docs/
  backend/          # Arquitetura, APIs e decisões técnicas do backend
  frontend/          # Arquitetura, componentes e padrões do frontend
  infra/              # Ambientes, deploy, monitoramento e operação
  regras-negocio/     # Regras de negócio, fluxos e decisões de produto
```

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o guia completo de como
adicionar novas páginas e o padrão de escrita esperado.

## Autenticação (login/senha)

O acesso ao site publicado é restrito por HTTP Basic Auth, implementado em
[`middleware.js`](middleware.js) como uma [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware).
O middleware intercepta toda requisição antes de servir o conteúdo estático
e exige usuário/senha configurados via variáveis de ambiente.

### Configurando as credenciais no Vercel

No projeto do Vercel, vá em **Settings > Environment Variables** e defina:

| Variável        | Descrição                          |
| --------------- | ----------------------------------- |
| `SITE_USER`     | Usuário compartilhado com o time    |
| `SITE_PASSWORD` | Senha compartilhada com o time      |

Sem essas variáveis configuradas, o middleware bloqueia o acesso por
segurança (falha fechada). Veja [`.env.example`](.env.example) como
referência.

> Para trocar a senha do time, basta atualizar `SITE_PASSWORD` no Vercel e
> fazer um redeploy — não é necessário alterar código.

## Deploy (Vercel)

1. Importe este repositório no [Vercel](https://vercel.com/new).
2. O Vercel detecta automaticamente o framework "Docusaurus 2" (build
   command `npm run build`, output directory `build`).
3. Configure as variáveis de ambiente `SITE_USER` e `SITE_PASSWORD`
   (ver seção acima) antes do primeiro deploy.
4. Cada push em `main` gera um novo deploy de produção; PRs geram preview
   deploys (também protegidos pelo mesmo middleware).

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o passo a passo de como criar
categorias, adicionar páginas e o padrão de escrita em Markdown.
