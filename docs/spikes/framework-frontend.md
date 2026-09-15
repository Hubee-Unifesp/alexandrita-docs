---
sidebar_position: 2
---

# Escolha da base de UI do frontend

## Status

Decisão tomada: adotar o [shadcn/ui](https://ui.shadcn.com/) como base de
componentes e design system do frontend do Hubee.

O [Next.js](https://nextjs.org/) permanece como framework da aplicação. O
shadcn/ui não é um framework fechado nem uma biblioteca instalada como uma
dependência única: ele fornece componentes acessíveis e personalizáveis que
são adicionados ao código do projeto.

## Objetivo

Documentar a escolha da base visual e de componentes responsável por orientar a
implementação inicial do frontend.

## Contexto

O frontend precisa consumir a API do Hubee, organizar as páginas da aplicação
e permitir uma evolução incremental da arquitetura. Para evitar componentes
criados de forma inconsistente, o projeto precisa de uma base reutilizável,
acessível e simples de adaptar à identidade visual do produto.

## Critérios de decisão

- Componentes acessíveis e compatíveis com React e TypeScript.
- Facilidade de personalização do markup, estilos e comportamento.
- Integração com Tailwind CSS e com o framework adotado pelo frontend.
- Possibilidade de manter os componentes dentro do próprio repositório.
- Documentação, exemplos e facilidade de manutenção.
- Baixo acoplamento a uma biblioteca visual proprietária.

## Decisão

Foi escolhido o **shadcn/ui** como base de UI, utilizando a seguinte
combinação tecnológica:

- **Next.js 16** e **React 19** para a aplicação e a construção da interface.
- **TypeScript** para tipagem estática.
- **Tailwind CSS 4** para estilização e tokens visuais.
- **Radix UI** para primitives acessíveis usadas pelos componentes do shadcn/ui.
- **Axios** para comunicação com a API do Hubee.
- **ESLint** para análise estática do código.

## Motivos

- Os componentes são adicionados ao próprio projeto, permitindo adaptar estilos
  e comportamento sem depender de abstrações difíceis de sobrescrever.
- A combinação com Tailwind CSS mantém os estilos próximos do componente e da
  identidade visual do produto.
- As primitives do Radix UI fornecem comportamentos acessíveis para elementos
  como diálogos, menus, popovers e comboboxes.
- O time pode evoluir os componentes conforme as necessidades do produto,
  mantendo uma API interna consistente.
- A solução reduz a duplicação de componentes comuns sem criar dependência de
  um design system externo fechado.

## Alternativas consideradas

### Biblioteca de componentes pronta

Bibliotecas como MUI, Ant Design e Chakra UI foram consideradas. Elas oferecem
componentes prontos, mas limitam mais a personalização visual e adicionam um
acoplamento maior à API e aos estilos da biblioteca escolhida.

### Componentes desenvolvidos do zero

Essa alternativa oferece controle total, mas aumenta o custo de implementação,
manutenção e validação de acessibilidade de componentes recorrentes.

### Tailwind CSS sem uma base de componentes

O Tailwind CSS continua sendo usado pelo shadcn/ui, mas apenas suas classes não
definem comportamentos, estados ou padrões de acessibilidade para os
componentes interativos.

## Consequências

### Positivas

- Componentes reutilizáveis e personalizáveis dentro do próprio repositório.
- Maior consistência visual e comportamental entre as telas.
- Boa base para criar tokens, variações e padrões de interação do produto.
- Acessibilidade apoiada pelas primitives do Radix UI.

### Pontos de atenção

- Os componentes adicionados pelo CLI precisam ser revisados antes de serem
  usados em fluxos críticos.
- Alterações nos componentes compartilhados podem afetar várias telas.
- O time precisa definir tokens, nomenclatura, variantes e regras de composição.
- A acessibilidade deve ser validada nos fluxos reais, não apenas herdada da
  primitive utilizada.

## Escopo inicial

1. Configurar o shadcn/ui no projeto frontend.
2. Definir tokens de cor, tipografia, espaçamento e raio de borda.
3. Adicionar os componentes base necessários, como `Button`, `Input`, `Label`,
  `Dialog`, `Select` e `Table`.
4. Documentar composição, variantes e estados de cada componente compartilhado.
5. Validar responsividade, acessibilidade e estados de carregamento e erro.
6. Centralizar as chamadas à API na camada `lib/api/` e manter hooks
  reutilizáveis em `hooks/`.

## Resultado esperado

O frontend deve conseguir ser executado localmente com `npm install` e
`npm run dev`, utilizando os componentes do shadcn/ui de forma consistente e
consumindo a API a partir da variável `NEXT_PUBLIC_API_URL`. A configuração da
aplicação está detalhada na [documentação do frontend](../frontend/intro.md).

## Referências

- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/)
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Documentação do frontend](../frontend/intro.md)