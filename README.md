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

## Licença
MIT — ver [LICENSE](LICENSE).
