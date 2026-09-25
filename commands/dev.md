---
description: Factory DEV — leva uma task do backlog ao handoff de QA
argument-hint: <task-id> [--model papel=valor]
---
---
description: Factory DEV — leva uma task do backlog ao handoff de QA (genérico/config-driven)
argument-hint: <task-id>
---

# Factory DEV — Orquestrador da fábrica DEV (genérico/config-driven)

Leva uma task do backlog ao handoff de QA: prepara o ambiente, implementa via **agents isolados**
(`factory:dev-*`), revisa, valida e faz commit/handoff. **Nada específico de projeto**: tracker, paths, stack,
branch e mecânica de commit vêm do `factory.config.md`. Tracker via as ops do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`.

> **Você é o único que fala com o tracker e com o humano.** Os workers são agents (`agents/dev-*.md` do plugin):
> não têm driver de tracker nem canal para perguntar. Você resolve a task, passa os campos no briefing e
> trata os retornos `STATUS:` deles.

## Task ID: $ARGUMENTS
Se vazio, pergunte qual task processar (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Preparação
1. **Config:** leia `docs/factory.config.md`; valide as **chaves da fábrica DEV** (`${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`).
   Faltou/`TBD` → **PARE**. Carregue `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md`.
2. **Task + gate:** `task = tracker.fetch($ARGUMENTS)`. Status deve ser `backlog` ou `in_progress`
   (≠ → **PARE**/ALERTE: pode ser retrabalho ou retorno de QA). `nome = task.parent_id ? kebab(parent) : $ARGUMENTS`;
   `DIR = docs/initiatives/{nome}/`; `mkdir -p {DIR}`.
3. **Branch:** `BRANCH = task.branch` (driver-resolved; ex. ClickUp = `CU-{clickup_id}`, compartilhada entre Stories
   do mesmo épico; PHCS = `{branch_prefix}{slug}`). **Não** assuma `{prefix}{id}`.
4. **Repos afetados:** detecte backend/frontend pelo corpo da task (paths/keywords das convenções de
   `config.stack` + `config.workspace.repos`). Nenhum detectado → **PERGUNTE** ao humano.
5. **Subir a stack** se `config.docker.ensure_up: true` (`docker compose -f {config.docker.compose} up -d` + health em `config.env`).
6. **Stash WIP** em cada repo afetado (`git stash push -u -m "auto-stash {id}"`) — preserva, não descarta.
7. **Transição:** `tracker.transition($ARGUMENTS → in_progress)`.
8. **Branch em cada repo afetado:** `git fetch {config.git.remote}`; checkout de `BRANCH` se existir
   (local/origin), senão **criar a partir de `config.git.dev_base`** (⚠️ `dev_base`, não `base_branch`).

### Briefing comum (monte uma vez; entra no prompt de todo agent)
```
task_id: $ARGUMENTS | config_path: docs/factory.config.md | initiative_dir: {DIR}
branch: {BRANCH} | repos: {afetados, com path de cada um}
task: type={task.type} parent_id={task.parent_id} complexity={task.complexity}
      depends_on={task.depends_on} description=<corpo da task>
```


**Modelos:** resolva o modelo de cada worker pela ordem do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Modelos por
papel" (arg `--model papel=valor` → `config.models.<papel>` → `config.models.default` → padrão do plugin) e
passe-o no parâmetro `model` de **toda** subida de worker. Tire os `--model ...` do `$ARGUMENTS`
antes de usá-lo como ID/iniciativa. Valor fora de `fable|opus|sonnet|haiku|inherit` → **PARE**.

---

## PIPELINE (agents; cada um em contexto próprio)
Ordem-base: **tech-lead → developer(s) → [doc-sync] → code-review → self-test → [doc-sync]**.
O **doc-sync** entra no ponto definido por `config.dev.doc_sync_order` (`before_review` ou `after_self_test`).

**Protocolo de retorno** — todo agent devolve `STATUS:`. Trate assim, sempre:
| STATUS | Ação do orquestrador |
|---|---|
| `OK` / `PASSED` / `APPROVED` | segue para a próxima etapa |
| `APPROVED_WITH_NOTES` | segue; carregue os 🟡 para o relatório final |
| `REJECTED` / `FAILED` | volta ao developer com o relatório; **conta 1 retry** (`config.dev.retries`) |
| `BLOCKED` | **PARE e PERGUNTE ao humano** usando `blocked_reason` (o agent não tem canal) |
| `UPSTREAM_BUG` | escale ao humano; **não** consome retry |

### ETAPA 1 — Tech Lead (agent `factory:dev-tech-lead`) → `{DIR}/tech-lead-$ARGUMENTS.md`
Prompt = briefing comum. **Gate:** artefato salvo (mapa de impacto p/ Story, root-cause p/ Bug) e
`scope` retornado (`backend`/`frontend`/`ambos`).

### ETAPA 2 — Developer (agent `factory:dev-developer`) → código nos repos
Prompt = briefing comum + `plan_path: {DIR}/tech-lead-$ARGUMENTS.md` + `scope` + `repo_path`.
- **`config.dev.developer_split: true`** e `scope == ambos` → suba **duas instâncias na mesma mensagem**
  (uma `scope: backend`, outra `scope: frontend`), rodando em paralelo em repos distintos.
- **`developer_split: false`** → uma instância com `scope: ambos`.
- **Re-run** (após REJECTED/FAILED) → suba **só o `scope_to_fix`**, com `review_report` no prompt.

**Gate:** `git diff --stat` coerente com o plano em cada repo. Developer **não** toca `docs/` nem commita.

### Doc Sync (posição = `config.dev.doc_sync_order`) → `{DIR}/doc-sync-report-$ARGUMENTS.md`
Agent `dev-doc-sync`; prompt = briefing comum. Se `config.dev.commit.by == doc_sync`, **ele commita**
(código+docs + ponteiro de submódulo); senão só edita no disco.

### ETAPA 3 — Code Review (agent `factory:dev-code-reviewer`, até `config.dev.retries` tentativas)
Prompt = briefing comum + `plan_path` + `attempt` + `developer_notes`.
`REJECTED` → ETAPA 2 com `scope_to_fix` + `review_report`. `rerun_doc_sync: sim` → re-rode o doc-sync.
Esgotou retries → escale e **PARE**.

### ETAPA 4 — Self Test (agent `factory:dev-self-test`, até `config.dev.retries` tentativas)
Prompt = briefing comum + `plan_path`.
`FAILED` → ETAPA 2 com `scope_to_fix` + `failure`. Esgotou retries → escale e **PARE**.
**Publique** o `self_test_section` devolvido na task: `tracker.comment($ARGUMENTS, self_test_section)`
(ou `tracker.append`, conforme o driver) — o agent não escreve no tracker.

---

## ETAPA 5 — Finalização (commit + handoff)
Conforme `config.dev.commit`:
- **`by: pipeline`**: commit seletivo em cada repo afetado com `config.git.commit_format`
  (`{key}`→$ARGUMENTS, prefixo por `task.type` via `config.git.branch_prefix`). Doc-sync já editou (não commitou).
- **`by: doc_sync`** (PHCS): o doc-sync já commitou código+docs e bumpou o ponteiro do submódulo.
- **Push** conforme `config.dev.commit.push`: `manual` → **não** faz push (skill `/push` à parte, após QA);
  `mr` → abre Merge Request.
- **Transição:** `tracker.transition($ARGUMENTS → qa_gate)` (handoff p/ a fábrica QA).
- Restaure o WIP stashado se desejar (`git stash list | grep {id}`).

### Relatório final
```markdown
## Pipeline DEV — $ARGUMENTS — {data} — {config.project}
Tipo: {task.type} | Branch: {BRANCH} | Repos: backend/frontend | Status: backlog → in_progress → qa_gate
| Etapa | Status | Detalhe |
| 0 Prep · 1 Tech Lead · 2 Developer · Doc-Sync · 3 Review · 4 Self-Test · 5 Commit/Handoff |
Ressalvas 🟡 pendentes: {de APPROVED_WITH_NOTES}
Próximo: task em `qa_gate` → rodar a fábrica QA (`/factory:qa $ARGUMENTS`).
```

## REGRAS
- Cada worker é um **agent** em contexto próprio; o corpo do papel é o system prompt dele — **não** repita as
  regras do papel no prompt, passe só o briefing (task/paths/scope).
- **Só você** fala com tracker e humano. `BLOCKED` de qualquer agent = pergunta ao humano, não improvise a resposta.
- Etapa falhou `config.dev.retries`× → **PARE** e escale. `UPSTREAM_BUG` não consome retry.
- Developer **NUNCA** edita `docs/` (doc-sync faz). Code-reviewer pode pedir re-run do doc-sync.
- **NUNCA** commit/branch em `config.git.protected`. **NUNCA** `push --force` (o `/push` usa `--force-with-lease`).
- Branch de dev sai de `config.git.dev_base`; pode ser **compartilhada** (vários commits acumulam) — ver `issue.branch_field`.
- Push não é automático quando `commit.push == manual`. Movimento `qa_gate → in_qa → done` é da fábrica QA.
- Em qualquer dúvida, **pergunte ao humano**.
