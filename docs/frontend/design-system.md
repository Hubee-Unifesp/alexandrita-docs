---
sidebar_position: 2
---

# Design System

Base de componentes e tokens visuais do frontend do Hubee. A escolha do shadcn/ui está registrada na spike GOL-56 e a configuração foi feita na GOL-57. Os valores seguem o **Guia de Estilo v1**.

Para o contexto geral do frontend, veja a [Introdução ao Frontend](./intro.md).

## Configuração atual

- **Componentes:** shadcn/ui com Radix UI, preset **Vega** (ícones Lucide).
- **Estilização:** Tailwind CSS 4. Os tokens ficam em `src/app/globals.css`.
- **Onde ficam os componentes:** `src/components/ui/`, dentro do próprio repositório. Isso permite adaptar estilo e comportamento sem depender de uma biblioteca fechada.
- **Utilitário `cn()`:** `src/lib/utils.ts`, junta classes do Tailwind sem conflito.
- **Configuração do CLI:** `components.json`, na raiz do projeto.

Hoje só o componente `Button` foi gerado (pelo `init`), e ainda não é usado em nenhuma tela. Os demais componentes serão adicionados conforme a necessidade.

## Tokens de cor

### Paleta `hubee`

| Token | Valor |
|-------|-------|
| `hubee-50` | `#fffbed` |
| `hubee-100` | `#fff3cc` |
| `hubee-200` | `#ffe899` |
| `hubee-300` | `#ffda66` |
| `hubee-400` | `#ffcb33` |
| `hubee-500` | `#fcb201` |
| `hubee-600` | `#c98d00` |
| `hubee-700` | `#966800` |
| `hubee-800` | `#634400` |
| `hubee-900` | `#181000` |

### Paleta neutra (`hubee-neutral`)

| Token | Valor |
|-------|-------|
| `hubee-neutral-25` | `#fffdf6` |
| `hubee-neutral-50` | `#e7e5e4` |
| `hubee-neutral-200` | `#a09d9b` |
| `hubee-neutral-300` | `#78716c` |
| `hubee-neutral-500` | `#1c1917` |

O prefixo `hubee-neutral` existe porque o Tailwind já tem uma paleta chamada `neutral`, e assim a do Hubee não a sobrescreve.

### Tokens semânticos

Os componentes do shadcn usam nomes semânticos (`background`, `primary`, etc.) e não as cores da paleta diretamente. Por isso, trocar o valor de um token muda todos os componentes ao mesmo tempo. Eles são definidos em `:root` (tema claro) e em `.dark` (tema escuro).

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `--background` | `#fffdf6` | `#181000` | fundo da página |
| `--foreground` | `#634400` | `#fffbed` | texto de corpo |
| `--card` / `--popover` | `#ffffff` | `#fffbed` | cartões e menus |
| `--primary` | `#181000` | `#fffbed` | botão principal |
| `--primary-foreground` | `#fffbed` | `#181000` | texto sobre o primary |
| `--secondary` | `#fff3cc` | `#634400` | itens secundários |
| `--accent` | `#fff3cc` | `#fff3cc` | item selecionado ou em foco |
| `--muted` | `#e7e5e4` | `#634400` | áreas discretas |
| `--muted-foreground` | `#78716c` | `#a09d9b` | textos discretos |
| `--border` / `--input` | `#e7e5e4` | `#634400` | bordas e campos |
| `--ring` | `#fcb201` | `#fcb201` | anel de foco |

Os tokens de `chart` e `sidebar` mantêm os valores padrão do shadcn, porque ainda não são usados.

O tema escuro só vale quando a classe `dark` está no elemento `<html>`. O botão para alternar o tema ainda não foi implementado.

## Tipografia

- **Corpo:** Inter (`--font-sans`), carregada com `next/font/google` em `src/app/layout.tsx`.
- **Código:** Geist Mono (`--font-mono`).
- **Títulos:** o guia define a fonte **Balete**, mas ela **ainda não está no projeto**. Os títulos usam Inter enquanto isso.

### Por que a Balete ainda não foi adicionada

A Balete é uma fonte comercial da Blaze Type e só temos a versão **Trial**. Ela não serve para o site por dois motivos:

- a licença trial vale para testes e apresentações, e não para uso em site nem redistribuição (o que inclui commitar os arquivos no repositório);
- a versão trial não tem as letras acentuadas do português, então títulos como "Catálogo de Eventos" sairiam com letras em outra fonte.

Para usar a Balete é preciso uma licença completa, ou definir outra fonte de títulos. A Blaze Type tem um plano para estudantes e acadêmicos com desconto.

### Como adicionar a fonte de títulos depois

Coloque os arquivos licenciados em `src/app/fonts/` e registre em `src/app/layout.tsx`:

```tsx
import localFont from "next/font/local";

const balete = localFont({
  src: "./fonts/Balete-Regular.woff2", // nome real do arquivo licenciado
  variable: "--font-balete",
});
```

Depois, inclua `balete.variable` no `className` do `<html>`. O CSS já usa `--font-balete` quando ela existe e volta para o Inter quando não existe, então nenhum outro arquivo precisa mudar.

## Como usar

Prefira as classes semânticas, que respondem sozinhas ao tema claro e escuro:

```tsx
import { Button } from "@/components/ui/button";

<div className="bg-background text-foreground">
  <Button>Salvar</Button>
  <Button variant="outline">Cancelar</Button>
</div>
```

Use a paleta direta só quando a cor específica for necessária:

```tsx
<span className="bg-hubee-100 text-hubee-800">Destaque</span>
```

## Como adicionar um componente

```bash
npx shadcn@latest add <nome>
```

Exemplos de nome: `input`, `dialog`, `select`, `table`. O CLI copia o componente para `src/components/ui/`. Como o código passa a ser do projeto, revise-o antes de usar em fluxos críticos e valide a acessibilidade no fluxo real, e não só na primitive do Radix.

## Como alterar um token

1. Edite o valor em `src/app/globals.css` (`:root` para o tema claro, `.dark` para o escuro).
2. Para uma cor nova da paleta, adicione `--color-...` no bloco `@theme`.
3. Rode `npm run build` para conferir que nada quebrou.

Alterar um token semântico afeta todos os componentes que o usam, então avise o time antes de mudar valores compartilhados.

## Pendências

- **Fonte Balete:** licença completa (ou outra fonte de títulos), como descrito na seção de tipografia.
- **Cores de feedback (Success, Warning e Destructive):** o PDF do guia veio com códigos de cor incorretos. Enquanto isso, `--destructive` mantém o padrão do shadcn e as demais ainda não foram definidas.
- **Tema escuro:** o mapeamento foi interpretado a partir do PDF do guia (cartões e botão claros sobre o fundo marrom) e precisa de confirmação do design.

## Validação da configuração

`npm install` sem conflitos de dependência, `npm run lint` e `npm run build` passando.
