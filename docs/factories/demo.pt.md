# /factory:demo

O jeito mais rápido de ver a fábrica funcionando: **sem tracker, sem servidor MCP, sem configurar nada**.

```text
/factory:demo [pasta]
```

Sem argumento, cria `./factory-demo`. Nunca escreve numa pasta que já existe e não está vazia.

## O que ela monta

- **Um projeto de exemplo:** o Notely, um app de notas pessoais (NestJS + Next.js), descrito por um mapa de
  CodeBase em `docs/codebase/` (entidades, rotas, serviços, páginas, componentes). O código não é criado: o
  mapa basta para a fábrica PO trabalhar.
- **Um kanban em Markdown** em `tasks/` (`epics`, `backlog`, `doing`, `qa`, `done`), usando o driver
  [`markdown`](../reference/drivers.md): cada task é um arquivo.
- **O `docs/factory.config.md`** já preenchido, com `language` no idioma em que você escreve.

## O que ela roda

Depois de mostrar o que criou, a demo pergunta se pode rodar a [fábrica PO](po.md) na iniciativa de exemplo
**"Compartilhar uma nota com outros usuários"**. Se você aceitar, em alguns minutos aparecem:

```text
factory-demo/
├── docs/initiatives/compartilhar-uma-nota-com-outros-usuarios/
│   ├── research.md        # concorrentes, boas práticas, MVP
│   ├── codemap.md         # o que já existe no Notely e o que falta
│   ├── blueprint.md       # especificação de cada funcionalidade
│   └── tasks-report.md    # Epic e Stories criadas
└── tasks/
    ├── epics/EPIC-....md
    └── backlog/NOTE-001-....md, NOTE-002-....md, ...
```

A pesquisa de mercado usa busca na web; o resto acontece só nos arquivos da pasta da demo.

## Depois da demo

- Abra o `blueprint.md` e uma story em `tasks/backlog/`: o corpo da story carrega o bloco inteiro do
  blueprint, que é o que a fábrica DEV consome.
- Para um projeto de verdade: [`/factory:init`](init.md) no repositório e depois `/factory:po <iniciativa>`.
  DEV, QA e CR precisam de código real e, no caso da QA, de um jeito de rodar os testes.
