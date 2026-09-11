# Como contribuir com a documentação

Este repositório usa [Docusaurus](https://docusaurus.io/) para gerar o site a
partir de arquivos Markdown na pasta [`docs/`](docs/).

## Estrutura de pastas

```
docs/
  backend/
  frontend/
  infra/
  regras-negocio/
```

Cada pasta é uma categoria que aparece na barra lateral do site. Para criar
uma nova categoria, crie uma pasta em `docs/` com um arquivo
`_category_.json` dentro, por exemplo:

```json
{
  "label": "Nome da Categoria",
  "position": 5,
  "link": {
    "type": "generated-index",
    "description": "Descrição curta do que tem nesta categoria."
  }
}
```

`position` define a ordem de exibição das categorias na barra lateral.

## Adicionando uma nova página

1. Crie um arquivo `.md` dentro da categoria desejada, por exemplo
   `docs/backend/autenticacao.md`.
2. Adicione o front matter no topo do arquivo definindo a posição dentro da
   categoria (opcional, mas recomendado):

   ```markdown
   ---
   sidebar_position: 2
   ---

   # Título da página

   Conteúdo em Markdown...
   ```

3. Use um título de nível 1 (`#`) igual ao assunto da página — ele é usado
   como título da página e, se não houver `sidebar_label` no front matter,
   como o texto exibido na barra lateral.
4. Para subpastas dentro de uma categoria, crie uma nova pasta com seu
   próprio `_category_.json`.

## Padrão de escrita

- Escreva em português, em frases curtas e diretas.
- Prefira registrar o "porquê" das decisões, não só o "o quê" (o código já
  mostra o quê).
- Use blocos de código com a linguagem indicada (` ```js `, ` ```bash `, etc.).
- Para decisões técnicas (ADRs), use o padrão de nome
  `AAAA-MM-titulo-curto.md` para facilitar ordenação cronológica.
- Links internos devem ser relativos ao arquivo atual, por exemplo:
  `[Introdução ao Backend](../backend/intro.md)`.

## Rodando localmente

```bash
npm install
npm start
```

Isso abre o site em `http://localhost:3000` com hot-reload — as alterações
em arquivos Markdown aparecem automaticamente no navegador.

## Enviando alterações

1. Crie uma branch a partir de `main`.
2. Faça as alterações em `docs/`.
3. Rode `npm run build` localmente para garantir que o site builda sem
   erros (links quebrados fazem o build falhar).
4. Abra um Pull Request descrevendo o que foi adicionado/alterado.
5. Após aprovação e merge em `main`, o deploy no Vercel é automático.
