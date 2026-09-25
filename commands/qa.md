---
description: Factory QA — plano, testes back/front, execução e evidências de uma task
argument-hint: <task-id> [--model papel=valor]
---
# Factory QA — Orquestrador da fábrica QA (genérico/config-driven)

Executa o pipeline QA completo para uma task. **Não contém nada específico de projeto**:
todos os bindings (tracker, paths, stack, docker, branches) vêm do `factory.config.md` do projeto.

> **ESCOPO:** este comando é o **orquestrador**; os 4 sub-agents são workers do plugin em
> `workers/`: `qa-planner.md`, `qa-backend.md`, `qa-frontend.md`, `qa-runner.md`. Cada ETAPA abaixo
> delega ao worker correspondente (o bloco aqui é a instrução curta; o detalhe vive no worker).

## Task ID: $ARGUMENTS

Se nenhum argumento foi passado, pergunte qual task testar (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO, antes de tudo)

1. Leia o **`factory.config.md`** do projeto (em `docs/factory.config.md` na raiz do repo).
   - Se não existir: **PARE** — "Rode `/factory:init` para criar o config deste projeto."
2. **Valide as chaves obrigatórias** (lista em `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`). Se qualquer uma faltar
   **ou** tiver valor `TBD`: **PARE** e diga exatamente qual chave preencher.
3. Confirme que `config.tracker.status.qa_gate` ≠ `config.tracker.status.in_qa` (seletores distintos).
   Se forem iguais: **PARE** — "qa_gate e in_qa precisam de seletor distinto (ver CONTRACT)."
4. Carregue os bindings. Daqui pra frente **nunca** use valor fixo — sempre `config.<chave>`.
5. **Tracker Driver:** carregue `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md`. Toda chamada `tracker.<op>(...)`
   abaixo roda por esse driver, conforme `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`. O comando não conhece o tracker.

### Determinar pasta da iniciativa
- `task = tracker.fetch($ARGUMENTS)`
- Se `task.parent_id` → `docs/initiatives/{nome-normalizado-do-pai}/`; senão → `docs/initiatives/$ARGUMENTS/`
- `mkdir -p`. **TODOS os sub-agents salvam aqui** — nunca em `docs/` raiz.

### Gate de status
- Confirme `task.status_lógico == qa_gate`. Se não, **PARE** e reporte (não re-rode task já em QA).


**Modelos:** resolva o modelo de cada worker pela ordem do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Modelos por
papel" (arg `--model papel=valor` → `config.models.<papel>` → `config.models.default` → padrão do plugin) e
passe-o no parâmetro `model` de **toda** subida de worker. Tire os `--model ...` do `$ARGUMENTS`
antes de usá-lo como ID/iniciativa. Valor fora de `fable|opus|sonnet|haiku|inherit` → **PARE**.

---

## ETAPA 1 — QA Planner (sub-agent)

```
Você é o QA Planner da {config.company}. Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/qa-planner.md`.
Task: $ARGUMENTS  |  Pasta: docs/initiatives/{nome}/  |  Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}

1. tracker.fetch($ARGUMENTS) — confirme status_lógico == qa_gate
2. tracker.transition($ARGUMENTS → in_qa) + tracker.comment("iniciando QA")
3. Valide a branch da task ({task.branch}) vs {config.git.base_branch}
4. Leia o blueprint (task.description / tracker.read_blueprint)
5. git diff --name-only {config.git.base_branch}...{task.branch}   (SÓ listar arquivos)
6. Gere o plano → salve em docs/initiatives/{nome}/qa-plan-$ARGUMENTS.md
7. tracker.comment($ARGUMENTS, plano)
```
**Validação:** plano salvo + postado + task em `in_qa`.

> Nota: o diff usa `{task.branch}` (resolvido pelo driver), **não** `{prefix}{id}` — trackers como o
> markdown/ClickUp podem derivar a branch de `CU-{clickup_id}`, não da chave.

---

## ETAPA 2 — QA Backend + QA Frontend (EM PARALELO)

**Backend:**
```
Você é o QA Backend da {config.company}. Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/qa-backend.md`.
Task: $ARGUMENTS  |  Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}
1. Leia docs/initiatives/{nome}/qa-plan-$ARGUMENTS.md
2. Helpers do projeto: {config.tests.backend_helpers}
3. Código REAL em {config.workspace.root}/{config.workspace.repos.backend.path}  (NÃO supor)
4. Compare plano × código real — documente divergências
5. Crie testes em {config.tests.layout.backend}  (framework: {config.stack.backend.test})
6. 1 cenário = 1 teste; cleanup completo no teardown
```
**Frontend:**
```
Você é o QA Frontend da {config.company}. Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/qa-frontend.md`.
Task: $ARGUMENTS  |  Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}
1. Leia o plano
2. Custom commands do projeto: {config.tests.frontend_cmds}
3. Código REAL (rotas/componentes) em {config.workspace.root}/{config.workspace.repos.frontend.path}
4. Tabela de seletores reais ANTES de escrever
5. Crie E2E em {config.tests.layout.frontend}  (e2e: {config.stack.frontend.e2e})
6. 1 cenário = 1 teste; cleanup via API no after
```
**Validação:** ambos os arquivos de teste criados.

---

## ETAPA 3 — QA Runner (Docker + Execução + Evidências)

```
Você é o QA Runner da {config.company}. Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/qa-runner.md`.
Task: $ARGUMENTS  |  Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}

FASE 1 — Preparar:
1. git pull da branch {task.branch}; valide vs {config.git.base_branch}
2. Resolver tests dir: TDIR = (config.tests.dir == "auto" ? (existe qa-tests/ ? qa-tests : tests) : config.tests.dir)
3. Serviços online: curl {config.env.api_url} e {config.env.app_url}
4. Smoke ({config.tests.smoke_script} se definido; senão login + 1 endpoint via {config.env.api_url})
5. Se falhar: tracker.comment(falha) e PARE

FASE 2 — Executar:
6. cd {TDIR} && {config.docker.run}
7. Evidências: {config.evidence.mode_var}=true, {config.evidence.slowmo_var}={config.evidence.slowmo}, {config.evidence.resolution}
8. Colete vídeos/screenshots/logs

FASE 3 — Reportar:
9. Relatório (tabela por cenário + métricas)
10. ALL PASSED → tracker.comment(relatório) + tracker.transition(→ done) + tracker.label(approved)
11. FAILED → para cada falha: tracker.create_child_bug(task=$ARGUMENTS, título, corpo) + comentário consolidado
12. Salve em docs/initiatives/{nome}/qa-report-$ARGUMENTS.md

FASE 4 — Limpeza: derrubar containers se aplicável.
```

---

## ETAPA 4 — Relatório Final

```markdown
## QA Pipeline — $ARGUMENTS — {config.project}

| Etapa | Status | Output |
|-------|--------|--------|
| Planner | ✅ | plano salvo + postado |
| Backend | ✅ | X testes |
| Frontend | ✅ | Y testes |
| Runner | ✅/❌ | Z passed, W failed |

Resultado: ✅ DONE / ❌ W BUGS
- DONE → task em `done`, vídeos nas evidências, aprovado p/ merge
- BUGS → W bugs criados (ligados a $ARGUMENTS), task permanece em `in_qa`
```

---

## TRACKER (driver-based — ver `drivers/trackers/`)

Este comando **não** mapeia tracker. Chama as 6 ops abstratas (`fetch`, `read_blueprint`,
`transition`, `comment`, `create_child_bug`, `label`) do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`; o driver de
`config.tracker.driver` traduz. Drivers: `jira`, `clickup`, `gitlab`, `github`, `markdown`.
**Adicionar tracker = criar `drivers/trackers/<nome>.md` + setar `tracker.driver`. Nenhuma linha daqui muda.**

## REGRAS (genéricas)
- ETAPA 0 (carregar + **validar** config) sempre primeiro; sem config válido, não roda.
- Artefatos **sempre** em `docs/initiatives/{nome}/`.
- Cada sub-agent em **próprio contexto** (Task). Backend e Frontend em **paralelo**.
- Planner falhou (status ≠ qa_gate) → **PARE**. Testes não criados → **PARE** antes do runner.
- Serviços offline / smoke falhou → **não rodar testes**, só comentar.
- Bugs criados **automaticamente** via `tracker.create_child_bug` (ligados à task, não ao épico).
- Sempre incluir métricas de tempo no relatório.
