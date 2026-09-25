# Começando

## Pré-requisitos

- **Claude Code** instalado.
- **Um repositório git** do projeto, com backend, frontend ou os dois.
- **Acesso ao tracker** onde as tasks vivem:
    - Jira, ClickUp ou GitLab: o servidor MCP do tracker configurado no Claude Code;
    - GitHub Issues: a CLI `gh` autenticada;
    - driver `markdown`: nada, as tasks são arquivos no próprio repositório.
- **CLI do code host**, se for usar a fábrica CR: `glab` (GitLab) ou `gh` (GitHub), já autenticada.
- **Docker**, se a fábrica QA for subir a stack local para rodar os testes.

## 1. Instalar o plugin

```bash
claude plugin marketplace add correaschneider/ai-factory
```

```bash
claude plugin install factory@ai-factory
```

Abra uma sessão nova do Claude Code. Os commands aparecem como `/factory:init`, `/factory:po`,
`/factory:dev`, `/factory:qa` e `/factory:cr`.

!!! tip "Atualizar depois"
    `claude plugin marketplace update ai-factory` seguido de `claude plugin update factory@ai-factory`.
    A versão nova vale a partir da próxima sessão.

## 2. Gerar o config do projeto

Dentro do repositório:

```text
/factory:init
```

O `/factory:init` lê o projeto (lockfiles, `package.json`, `composer.json`, `docker-compose`, remote do git,
pastas de docs) e escreve `docs/factory.config.md`. O que ele não consegue inferir com segurança fica
marcado como `TBD`, com o motivo ao lado. Quando ele tem um palpite com evidência (por exemplo, um
framework fora da lista conhecida), ele pergunta antes de gravar.

Revise o arquivo, preencha os `TBD` e **faça commit**: o config é parte do projeto e vale para todo o time.

!!! warning "A regra que mais pega"
    Os status `qa_gate` (pronto para QA) e `in_qa` (QA em andamento) precisam ser **diferentes** no seu
    tracker. Se forem o mesmo, a fábrica não consegue distinguir uma task esperando QA de uma já em teste.
    O mesmo vale para `review_gate` e `in_review` na fábrica CR.

## 3. Rodar uma iniciativa de ponta a ponta

```text
/factory:po Login com Google
```

A fábrica PO pesquisa como o mercado resolve o problema, mapeia o que já existe no código, escreve o
blueprint e cria **1 Epic + 1 Story por funcionalidade** no tracker. Tudo fica em
`docs/initiatives/login-com-google/`.

Revise o blueprint e as stories. Depois, uma story por vez:

```text
/factory:dev APP-012
```

A fábrica DEV planeja, implementa, revisa, valida o build e move a task para `qa_gate`. Se o fluxo do
time tem code review em MR/PR:

```text
/factory:cr APP-012
```

E, por fim:

```text
/factory:qa APP-012
```

A fábrica QA escreve e roda os testes, grava as evidências e fecha a task, ou abre bugs ligados a ela.

## 4. Escolher os modelos (opcional)

Cada papel tem um modelo padrão (julgamento em `fable`, volume em `opus`, tarefas mecânicas em `sonnet`).
Para mudar só numa execução:

```text
/factory:dev APP-012 --model dev.developer=fable
```

Ou para sempre no projeto, no bloco `models:` do config. Detalhes em
[Modelos por papel](reference/models.md).
