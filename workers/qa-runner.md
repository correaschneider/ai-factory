# QA Runner — Docker + Execução + Evidências (genérico, config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{task_id}` = valor que vem como `Task: ...`.

Executa os testes da task via Docker, coleta evidências (vídeos, screenshots, métricas) e
reporta no tracker. **Não contém nada específico de projeto**: ambiente, docker, paths de
evidência e tracker vêm do `factory.config.md`. Toda interação com issue-tracker passa pelas
6 ops abstratas do `{plugin}/CONTRACT.md` (o comando não sabe se é Jira/GitLab/kanban-MD).

> Os testes rodam via Docker apontando para as URLs de `config.env` — não precisa de sudo nem
> libs gráficas locais. Onde a stack é local (`config.docker.ensure_up: true`), o runner sobe
> os containers antes de testar.

## Task ID: `{task_id}`

Se vazio, pergunte qual task testar (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO, antes de tudo)

1. Leia `docs/factory.config.md` do projeto. Não existe → **PARE** ("Rode `/factory:init`").
2. **Valide as chaves obrigatórias** (lista em `{plugin}/CONTRACT.md`, incluindo as do runner:
   `docker.run`, `docker.ensure_up`, `evidence.artifacts.{videos,screenshots,backend_result,frontend_result}`).
   Faltou **ou** `TBD` → **PARE** e diga exatamente qual chave preencher.
3. Carregue os bindings. Daqui pra frente **nunca** use valor fixo — sempre `config.<chave>`.
4. **Tracker Driver:** carregue `{plugin}/drivers/trackers/{config.tracker.driver}.md`. Toda `tracker.<op>(...)`
   roda por esse driver, conforme `{plugin}/CONTRACT.md`.
5. `task = tracker.fetch({task_id})`.
   - Pasta da iniciativa: `task.parent_id` → `docs/initiatives/{nome-normalizado-do-pai}/`;
     senão → `docs/initiatives/{task_id}/`. `mkdir -p`.
   - **Gate:** confirme `task.status_lógico == in_qa` (o pipeline já transicionou na ETAPA 1).
     Se rodando o runner avulso e a task está em `qa_gate`, transicione `→ in_qa` antes.

```bash
RUN_TS=$(date '+%Y-%m-%d_%H-%M-%S')
EVIDENCE_DIR="docs/initiatives/{nome}/evidencias/$RUN_TS"
mkdir -p "$EVIDENCE_DIR/videos" "$EVIDENCE_DIR/screenshots"
```

---

## FASE 1 — Preparar ambiente

### 1.1 Branch da task (driver-resolved)
A branch vem de `{task.branch}` (resolvida pelo driver — **não** assuma `{prefix}{id}`;
trackers como markdown/ClickUp podem derivar de `CU-{clickup_id}`).

```bash
cd {config.workspace.root}/{config.workspace.repos.backend.path}
git fetch {config.git.remote}
git checkout "{task.branch}" 2>/dev/null || git checkout -b "{task.branch}" "{config.git.remote}/{task.branch}"
git pull {config.git.remote} "{task.branch}" 2>/dev/null

AHEAD=$(git rev-list --count {config.git.base_branch}..HEAD 2>/dev/null || echo 0)
BEHIND=$(git rev-list --count HEAD..{config.git.base_branch} 2>/dev/null || echo 0)
echo "Branch {task.branch}: +$AHEAD / -$BEHIND vs {config.git.base_branch}"
```
Conflito de merge → `tracker.comment` e **PARE**.

### 1.2 Subir a stack (só se `config.docker.ensure_up: true`)
Quando a app é local (não URL externa), garanta os containers no ar antes de testar:

```bash
# só executa este bloco quando config.docker.ensure_up == true
docker compose -f {config.docker.compose} ps | grep -q "Up" || { docker compose -f {config.docker.compose} up -d; sleep 15; }
```
- **Preparar o banco de teste:** faça `exec` no container `{config.docker.containers.app}` e rode o
  **migrate + seed da stack** (migrate do test-DB + seed de `config.tests.seeder`, se definido) — o comando
  exato vem da convenção de `config.stack.backend` (não hardcode aqui).

> `ensure_up: false` (app remota/externa) → pule este passo inteiro; os testes batem direto nas URLs.

### 1.3 Serviços online
```bash
curl -s -o /dev/null -w "%{http_code}" {config.env.api_url}
curl -s -o /dev/null -w "%{http_code}" {config.env.app_url}
```
Algum ≠ 200 → `tracker.comment(serviço offline)` e **PARE** (não rode testes).

### 1.4 Smoke test
- `config.tests.smoke_script` definido → execute-o.
- Senão → login via `{config.env.api_url}` + 1 endpoint autenticado (use o helper do projeto em
  `config.tests.backend_helpers`/`frontend_cmds`).

Smoke falhou → salve a saída em `$EVIDENCE_DIR/`, `tracker.comment` e **PARE** (não rode a suite).

---

## FASE 2 — Executar testes

```bash
TEST_START=$(date +%s)
TDIR={config.tests.dir}    # se "auto": existe qa-tests/ ? qa-tests : tests
```

**Modelo de execução (decide pelo config):**
- `config.docker.run_frontend` **ausente** → `config.docker.run` é o **pipeline completo**
  (back + front numa chamada). Rode-o e capture o exit.
- `config.docker.run_frontend` **presente** → backend e frontend são comandos **independentes**:
  rode `config.docker.run` (backend) e `config.docker.run_frontend` **EM PARALELO** (`&` + `wait`),
  cada um com seu exit.

```bash
# limpar evidências anteriores do harness (globs de config.evidence.artifacts)
# rodar suite(s) com tee p/ $EVIDENCE_DIR/*.log
# Evidências/qualidade de vídeo: exporte {config.evidence.mode_var}=true,
#   {config.evidence.slowmo_var}={config.evidence.slowmo}, resolução {config.evidence.resolution}
TEST_END=$(date +%s); DUR=$((TEST_END-TEST_START)); echo "⏱️ ${DUR}s"
```

> Se o pipeline travar num spec de **outra** task (suites sequenciais), rode só os specs da feature
> (`--spec '.../{feature}/**'`) e confirme `Spec Ran:` no log. Conflito de Xvfb → display alternativo (`:98`).

### 2.1 Coletar evidências (paths vêm do config — relativos a `workspace.root`)
```bash
cp {config.evidence.artifacts.videos}      "$EVIDENCE_DIR/videos/"      2>/dev/null || true
cp {config.evidence.artifacts.screenshots} "$EVIDENCE_DIR/screenshots/" 2>/dev/null || true
cp {config.evidence.artifacts.backend_result}  "$EVIDENCE_DIR/" 2>/dev/null || true
cp {config.evidence.artifacts.frontend_result} "$EVIDENCE_DIR/" 2>/dev/null || true
```
Estrutura: `docs/initiatives/{nome}/evidencias/{RUN_TS}/{videos,screenshots,...}` — preserva execuções anteriores por timestamp.

### 2.2 Parsear totais
- **Backend:** parse de `config.evidence.artifacts.backend_result` conforme `config.stack.backend.test`
  (jUnit XML → `tests`/`failures`/`errors`; JSON → `numTotalTests`/`numFailedTests`).
- **Frontend:** parse de `config.evidence.artifacts.frontend_result` (Cypress JSON → `totalTests`/`totalPassed`/`totalFailed`).
- Para cada falha: nome completo, mensagem, stack (primeiras ~30 linhas), caminho do vídeo/screenshot.

---

## FASE 3 — Reportar

### 3.1 Relatório → `docs/initiatives/{nome}/qa-report-{task_id}.md`
```markdown
# QA Report — {task_id} — {data} — {config.project}
## Ambiente
- Branch: {task.branch} (+A / -B vs {config.git.base_branch})
- Backend {config.env.api_url} ✅ · Frontend {config.env.app_url} ✅ · Smoke ✅
## Métricas — Duração total: Xm Ys
## Resultados por cenário
| Suite | ID | Cenário | Status | Duração |
## Resumo
| Suite | Total | ✅ | ❌ | ⏭ |
## Falhas detalhadas (msg + stack + hipótese + evidência)
## Evidências — 🎬 videos/ (X) · 📸 screenshots/ (Y)
## Veredicto: ✅ ALL PASSED / ❌ X FAILURES
```

### 3.2 ALL PASSED
- `tracker.comment({task_id}, relatório)`
- `tracker.transition({task_id} → done)`
- `tracker.label({task_id}, approved)`

### 3.3 HAS FAILURES — 1 bug por falha, **ligado à task**
Para **cada** teste falho: `tracker.create_child_bug(task={task_id}, "[QA Auto] {nome}", corpo)`
— corpo com erro, stack, evidência (nome do vídeo/screenshot). Aplique `tracker.label(new_id, generated)`.
Depois `tracker.comment({task_id}, resumo consolidado + lista de bugs criados)`.
A task **permanece em `in_qa`** (não transiciona para `done`).

> **Refinamento conhecido (a decidir, hoje fora do genérico):** uma versão antiga do runner distinguia falha de
> **regressão** (área adjacente → cria bug filho, mantém em QA) de falha na **própria feature**
> (volta a task pro DEV). Isso exige um status lógico `returned`/`in_progress` no CONTRACT — fica
> documentado como evolução; o comportamento-base aqui é "falhou → cria bug(s) + permanece em `in_qa`".

---

## FASE 4 — Limpeza
- `config.docker.ensure_up: false` (app externa) → `docker compose -f {config.docker.compose} down` se subiu algo efêmero.
- `config.docker.ensure_up: true` (stack compartilhada com outras tasks) → **NÃO derrubar**; só limpar
  os volumes de evidência já copiados.

---

## TRACKER (driver-based — ver `drivers/trackers/`)
Este comando **não** mapeia tracker. Chama `fetch`, `read_blueprint`, `transition`, `comment`,
`create_child_bug`, `label`; o driver de `config.tracker.driver` traduz.
**Adicionar tracker = criar `drivers/trackers/<nome>.md` + setar `tracker.driver`. Nenhuma linha daqui muda.**

## REGRAS (genéricas)
- ETAPA 0 (carregar + **validar** config) sempre primeiro; sem config válido, não roda.
- Artefatos **sempre** em `docs/initiatives/{nome}/`; evidências em `evidencias/{timestamp}/`.
- **SEMPRE** smoke antes da suite; serviços offline / smoke falhou → comentar e **PARAR**.
- Backend e frontend **em paralelo** quando `docker.run_frontend` existe (são independentes).
- **SEMPRE** coletar vídeos+screenshots e incluir tabela por cenário + métricas de tempo no relatório.
- **1 bug por falha** (não agrupar), via `tracker.create_child_bug` (ligado à task, não ao épico).
- **NUNCA** transicionar para `done` com qualquer falha. **NUNCA** mascarar falha ("flaky" não é desculpa).
- Verifique `Spec Ran:` no log; pipeline travou em spec de outra task → rodar specs isolados.
