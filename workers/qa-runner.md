# QA Runner — Docker + Execution + Evidence (generic, config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{task_id}` = value that comes as `Task: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).

Runs the task's tests via Docker, collects evidence (videos, screenshots, metrics) and
reports to the tracker. **Contains nothing project-specific**: environment, docker, evidence
paths and tracker come from `factory.config.md`. Every interaction with the issue tracker goes through the
6 abstract ops of `{plugin}/CONTRACT.md` (the command does not know whether it is Jira/GitLab/MD kanban).

> The tests run via Docker pointing at the URLs in `config.env` — no sudo or local graphical
> libs needed. Where the stack is local (`config.docker.ensure_up: true`), the runner brings up
> the containers before testing.

## Task ID: `{task_id}`

If empty, ask which task to test (format in `config.issue.id_regex`).

---

## STEP 0 — Load and validate config (MANDATORY, before anything else)

1. Read the project's `docs/factory.config.md`. Does not exist → **STOP** ("Run `/factory:init`").
2. **Validate the required keys** (list in `{plugin}/CONTRACT.md`, including the runner ones:
   `docker.run`, `docker.ensure_up`, `evidence.artifacts.{videos,screenshots,backend_result,frontend_result}`).
   Missing **or** `TBD` → **STOP** and say exactly which key to fill in.
3. Load the bindings. From here on **never** use a hardcoded value — always `config.<key>`.
4. **Tracker Driver:** load `{plugin}/drivers/trackers/{config.tracker.driver}.md`. Every `tracker.<op>(...)`
   runs through that driver, according to `{plugin}/CONTRACT.md`.
4b. **E2E driver:** `<name>` = first word of `config.stack.frontend.e2e` in lowercase (absent →
   `cypress`); load `{plugin}/drivers/e2e/<name>.md` (used in E5, E6 and E7). Does not exist → **STOP**.
5. `task = tracker.fetch({task_id})`.
   - Initiative folder: `task.parent_id` → `docs/initiatives/{normalized-parent-name}/`;
     otherwise → `docs/initiatives/{task_id}/`. `mkdir -p`.
   - **Gate:** confirm `task.logical_status == in_qa` (the pipeline already transitioned it in STEP 1).
     If running the runner standalone and the task is in `qa_gate`, transition `→ in_qa` first.

```bash
RUN_TS=$(date '+%Y-%m-%d_%H-%M-%S')
EVIDENCE_DIR="docs/initiatives/{name}/evidence/$RUN_TS"
mkdir -p "$EVIDENCE_DIR/videos" "$EVIDENCE_DIR/screenshots"
```

---

## PHASE 1 — Prepare the environment

### 1.1 Task branch (driver-resolved)
The branch comes from `{task.branch}` (resolved by the driver — do **not** assume `{prefix}{id}`;
trackers such as markdown/ClickUp may derive it from `CU-{clickup_id}`).

```bash
cd {config.workspace.root}/{config.workspace.repos.backend.path}
git fetch {config.git.remote}
git checkout "{task.branch}" 2>/dev/null || git checkout -b "{task.branch}" "{config.git.remote}/{task.branch}"
git pull {config.git.remote} "{task.branch}" 2>/dev/null

AHEAD=$(git rev-list --count {config.git.base_branch}..HEAD 2>/dev/null || echo 0)
BEHIND=$(git rev-list --count HEAD..{config.git.base_branch} 2>/dev/null || echo 0)
echo "Branch {task.branch}: +$AHEAD / -$BEHIND vs {config.git.base_branch}"
```
Merge conflict → `tracker.comment` and **STOP**.

### 1.2 Bring up the stack (only if `config.docker.ensure_up: true`)
When the app is local (not an external URL), make sure the containers are up before testing:

```bash
# only run this block when config.docker.ensure_up == true
docker compose -f {config.docker.compose} ps | grep -q "Up" || { docker compose -f {config.docker.compose} up -d; sleep 15; }
```
- **Prepare the test database:** `exec` into the `{config.docker.containers.app}` container and run the
  **stack's migrate + seed** (test-DB migrate + seed from `config.tests.seeder`, if defined) — the exact
  command comes from the convention of `config.stack.backend` (do not hardcode it here).

> `ensure_up: false` (remote/external app) → skip this whole step; the tests hit the URLs directly.

### 1.3 Services online
```bash
curl -s -o /dev/null -w "%{http_code}" {config.env.api_url}
curl -s -o /dev/null -w "%{http_code}" {config.env.app_url}
```
Any ≠ 200 → `tracker.comment(service offline)` and **STOP** (do not run tests).

### 1.4 Smoke test
- `config.tests.smoke_script` defined → run it.
- Otherwise → login via `{config.env.api_url}` + 1 authenticated endpoint (use the project's helper in
  `config.tests.backend_helpers`/`frontend_cmds`).

Smoke failed → save the output in `$EVIDENCE_DIR/`, `tracker.comment` and **STOP** (do not run the suite).

---

## PHASE 2 — Run tests

```bash
TEST_START=$(date +%s)
TDIR={config.tests.dir}    # if "auto": qa-tests/ exists ? qa-tests : tests
```

**Execution model (decided by the config):**
- `config.docker.run_frontend` **absent** → `config.docker.run` is the **full pipeline**
  (back + front in one call). Run it and capture the exit code.
- `config.docker.run_frontend` **present** → backend and frontend are **independent** commands:
  run `config.docker.run` (backend) and `config.docker.run_frontend` **IN PARALLEL** (`&` + `wait`),
  each with its own exit code.

```bash
# clean previous harness evidence (globs from config.evidence.artifacts)
# run suite(s) with tee to $EVIDENCE_DIR/*.log
# Evidence/video quality: export {config.evidence.mode_var}=true,
#   {config.evidence.slowmo_var}={config.evidence.slowmo}, resolution {config.evidence.resolution}
#   (how the tool consumes these variables: E5 of the E2E driver)
TEST_END=$(date +%s); DUR=$((TEST_END-TEST_START)); echo "⏱️ ${DUR}s"
```

> If the pipeline hangs on a test from **another** task (sequential suites), run only the feature's tests the
> way **E6** of the E2E driver describes and confirm in the log what ran.

### 2.1 Collect evidence (paths come from the config — relative to `workspace.root`)
```bash
cp {config.evidence.artifacts.videos}      "$EVIDENCE_DIR/videos/"      2>/dev/null || true
cp {config.evidence.artifacts.screenshots} "$EVIDENCE_DIR/screenshots/" 2>/dev/null || true
cp {config.evidence.artifacts.backend_result}  "$EVIDENCE_DIR/" 2>/dev/null || true
cp {config.evidence.artifacts.frontend_result} "$EVIDENCE_DIR/" 2>/dev/null || true
```
Structure: `docs/initiatives/{name}/evidence/{RUN_TS}/{videos,screenshots,...}` — keeps previous runs by timestamp.

### 2.2 Parse totals
- **Backend:** parse `config.evidence.artifacts.backend_result` according to `config.stack.backend.test`
  (jUnit XML → `tests`/`failures`/`errors`; JSON → `numTotalTests`/`numFailedTests`).
- **Frontend:** parse `config.evidence.artifacts.frontend_result` according to **E7** of the E2E driver
  (total, passed, failed and, per failure, name, message and artifacts).
- For each failure: full name, message, stack (first ~30 lines), path to the video/screenshot.

---

## PHASE 3 — Report

### 3.1 Report → `docs/initiatives/{name}/qa-report-{task_id}.md`
```markdown
# QA Report — {task_id} — {date} — {config.project}
## Environment
- Branch: {task.branch} (+A / -B vs {config.git.base_branch})
- Backend {config.env.api_url} ✅ · Frontend {config.env.app_url} ✅ · Smoke ✅
## Metrics — Total duration: Xm Ys
## Results per scenario
| Suite | ID | Scenario | Status | Duration |
## Summary
| Suite | Total | ✅ | ❌ | ⏭ |
## Detailed failures (msg + stack + hypothesis + evidence)
## Evidence — 🎬 videos/ (X) · 📸 screenshots/ (Y)
## Verdict: ✅ ALL PASSED / ❌ X FAILURES
```

### 3.2 ALL PASSED
- `tracker.comment({task_id}, report)`
- `tracker.transition({task_id} → done)`
- `tracker.label({task_id}, approved)`

### 3.3 HAS FAILURES — 1 bug per failure, **linked to the task**
For **each** failed test: `tracker.create_child_bug(task={task_id}, "[QA Auto] {name}", body)`
— body with error, stack, evidence (video/screenshot name). Apply `tracker.label(new_id, generated)`.
Then `tracker.comment({task_id}, consolidated summary + list of created bugs)`.
The task **stays in `in_qa`** (does not transition to `done`).

> **Known refinement (to be decided, currently outside the generic flow):** an old version of the runner told a
> **regression** failure (adjacent area → creates child bug, stays in QA) apart from a failure in the **feature itself**
> (sends the task back to DEV). That requires a logical status `returned`/`in_progress` in the CONTRACT — it stays
> documented as a future evolution; the base behavior here is "failed → create bug(s) + stay in `in_qa`".

---

## PHASE 4 — Cleanup
- `config.docker.ensure_up: false` (external app) → `docker compose -f {config.docker.compose} down` if something ephemeral was brought up.
- `config.docker.ensure_up: true` (stack shared with other tasks) → **DO NOT tear down**; only clean
  the evidence volumes already copied.

---

## TRACKER (driver-based — see `drivers/trackers/`)
This command does **not** map the tracker. It calls `fetch`, `read_blueprint`, `transition`, `comment`,
`create_child_bug`, `label`; the driver from `config.tracker.driver` translates them.
**Adding a tracker = create `drivers/trackers/<name>.md` + set `tracker.driver`. Not a single line here changes.**

## RULES (generic)
- STEP 0 (load + **validate** config) always first; without a valid config, it does not run.
- Artifacts **always** in `docs/initiatives/{name}/`; evidence in `evidence/{timestamp}/`.
- **ALWAYS** smoke before the suite; services offline / smoke failed → comment and **STOP**.
- Backend and frontend **in parallel** when `docker.run_frontend` exists (they are independent).
- **ALWAYS** collect videos+screenshots and include a per-scenario table + time metrics in the report.
- **1 bug per failure** (do not group), via `tracker.create_child_bug` (linked to the task, not the epic).
- **NEVER** transition to `done` with any failure. **NEVER** mask a failure ("flaky" is no excuse).
- Confirm in the log which tests ran (E6); pipeline hung on another task's test → run only the feature's.
