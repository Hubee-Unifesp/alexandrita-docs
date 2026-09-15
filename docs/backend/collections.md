---
sidebar_position: 2
---

# Collections de Testes de API (Bruno)

O repositório [`hubee-collections`](https://github.com/Hubee-Unifesp/hubee-collections)
reúne requisições prontas para testar manualmente os endpoints da
[Hubee API](./intro.md), organizadas com o [Bruno](https://www.usebruno.com/)
— um cliente de API open-source (alternativa ao Postman/Insomnia) que guarda
as requisições como arquivos versionáveis em Git.

## Instalação

1. Instale o [Bruno](https://www.usebruno.com/downloads).
2. Clone o repositório:

   ```bash
   git clone https://github.com/Hubee-Unifesp/hubee-collections.git
   ```

## Como usar

1. Abra o Bruno e selecione **Open Collection**.
2. Escolha a pasta do repositório clonado.
3. No seletor de ambiente (canto superior direito), escolha um dos ambientes
   disponíveis:

   | Ambiente     | `baseUrl`                          |
   | ------------ | ----------------------------------- |
   | `local`      | `http://localhost:3000`             |
   | `production` | `https://hubee-api.onrender.com`    |

4. Para testar localmente, suba a [API](./intro.md#rodando-localmente) e use
   o ambiente `local`. Para testar o ambiente de produção, use `production`
   — com cautela, já que as requisições atingem a API real.

## Estrutura

Cada pasta agrupa as requisições de um recurso da API, espelhando os módulos
do [`hubee-api`](./intro.md):

```
USUARIOS/       # CRUD de usuários
LOCAL/          # CRUD de locais de evento (venue)
FORNECEDOR/     # CRUD de fornecedores
environments/   # ambientes: local (localhost:3000) e production (Render)
```

As requisições usam `{{baseUrl}}` como host e herdam a autenticação definida
na pasta (`auth: inherit`).

> O repositório mistura requisições no formato `.bru` (mais antigo) e `.yml`
> (formato mais recente do Bruno, [Opencollection](https://opencollection.dev/))
> — ambos funcionam normalmente ao abrir a collection.

## Convenções

- Versione os arquivos `.bru`/`.yml`, o `bruno.json` e este README — nunca
  tokens, senhas ou chaves de API.
- Para valores locais que não devem ir para o Git, use arquivos com sufixo
  `.local.bru` (já ignorados pelo `.gitignore`).
- Ao adicionar um novo recurso da API, crie uma pasta correspondente com um
  `folder.bru`/`folder.yml` definindo `auth: inherit`, seguindo o padrão das
  pastas existentes.
