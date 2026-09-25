# factory — fábricas de agentes para Claude Code

Plugin com quatro fábricas config-driven e o gerador de config:

| Command | Faz |
|---|---|
| `/factory:init [caminho]` | Gera `docs/factory.config.md` do projeto (detecta stack, tracker e git) |
| `/factory:po <iniciativa>` | Pesquisa → codemap → blueprint → Epic + Stories no tracker |
| `/factory:dev <task>` | Tech lead → developer → code review → self-test → doc sync → handoff QA |
| `/factory:qa <task>` | Plano → testes backend/E2E → execução com evidências → aprova ou abre bugs |
| `/factory:cr <task>` | Review + auditoria de segurança dos MRs/PRs, gate humano, comenta e move a task |

Nada é específico de projeto: tudo vem do `docs/factory.config.md` de cada repositório, cujo schema está no
[`CONTRACT.md`](CONTRACT.md).

## Estrutura
```
commands/   orquestradores (o que aparece no menu)
agents/     workers da DEV (factory:dev-*)
workers/    workers de PO/QA/CR (lidos por caminho, fora do menu)
drivers/    trackers/{jira,clickup,gitlab,markdown} · scm/{gitlab,github}
CONTRACT.md schema do config, ops abstratas, chaves obrigatórias e modelos por papel
```

## Instalação
Local, apontando pro clone:
```bash
claude --plugin-dir /caminho/para/ai-factory
```
Tracker ou code host novo = arquivo novo em `drivers/` + `tracker.driver`/`scm.driver` no config.

## O que o plugin executa, envia e busca

O plugin é só texto (commands, agents e instruções em Markdown): não tem hooks, servidor MCP, scripts
próprios nem dependências a instalar. Tudo o que ele faz passa pelas ferramentas do próprio Claude Code,
sujeito às permissões que o usuário já configurou, e sempre dentro do projeto em que roda:

- **Lê e escreve no repositório do projeto:** lê o `docs/factory.config.md` e o código; grava artefatos em
  `docs/initiatives/<nome>/` (pesquisa, blueprint, planos e relatórios de QA). A fábrica DEV edita código e
  pode fazer commit e push conforme o config; a fábrica QA cria arquivos de teste.
- **Executa comandos locais:** `git`, as CLIs de code host `glab` (GitLab) e `gh` (GitHub), o build e os
  testes definidos no config (`docker compose`, `pnpm`, `composer`, `phpunit`, `cypress` etc.) e `curl` nas
  URLs de `env.app_url`/`env.api_url` do próprio config, para smoke test.
- **Fala com o tracker de tarefas** que o usuário configurou (Jira, ClickUp ou GitLab Issues), usando o
  servidor MCP desse tracker já instalado pelo usuário: lê tasks, cria épicos, stories e bugs, comenta e
  muda status. Com o driver `markdown`, tudo fica em arquivos do repositório.
- **Comenta em merge/pull requests** pelo `glab`/`gh`, na fábrica CR, só depois da aprovação humana.
- **Pesquisa na web** (fábrica PO, etapa de pesquisa de mercado) com as ferramentas de busca do Claude Code.

Nenhum dado é enviado a outro destino além do tracker e do code host configurados pelo usuário. Ações que
mudam o tracker ou publicam comentário em MR passam por gates descritos em cada command.

## Licença
MIT — ver [LICENSE](LICENSE).
