---
description: Factory DEV — takes a task from the backlog to the QA handoff
argument-hint: <task-id> [--depth lean|standard|deep] [--model role=value]
---
# Factory DEV — Orchestrator of the DEV factory (generic/config-driven)

Takes a task from the backlog to the QA handoff: prepares the environment, implements through **isolated agents**
(`factory:dev-*`), reviews, validates and does the commit/handoff. **Nothing project-specific**: tracker, paths, stack,
branch and commit mechanics come from `factory.config.md`. Tracker through the ops of `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`.

> **You are the only one who talks to the tracker and to the human.** The workers are agents (`agents/dev-*.md` in the plugin):
> they have no tracker driver and no channel to ask questions. You resolve the task, pass the fields in the briefing and
> handle their `STATUS:` returns.

## Task ID: $ARGUMENTS
If empty, ask which task to process (format in `config.issue.id_regex`).

---

## STEP 0 — Preparation
1. **Config:** read `docs/factory.config.md`; validate the **DEV factory keys** (`${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`).
   Missing/`TBD` → **STOP**. Load `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md`.
2. **Task + gate:** `task = tracker.fetch($ARGUMENTS)`. Status must be `backlog` or `in_progress`
   (otherwise → **STOP**/WARN: it may be rework or a return from QA). `name = task.parent_id ? kebab(parent) : $ARGUMENTS`;
   `DIR = docs/initiatives/{name}/`; `mkdir -p {DIR}`.
3. **Branch:** `BRANCH = task.branch` (driver-resolved; e.g. ClickUp = `CU-{clickup_id}`, shared between Stories
   of the same epic; PHCS = `{branch_prefix}{slug}`). Do **not** assume `{prefix}{id}`.
4. **Affected repos:** detect backend/frontend from the task body (paths/keywords from the conventions in
   `config.stack` + `config.workspace.repos`). None detected → **ASK** the human.
5. **Bring up the stack** if `config.docker.ensure_up: true` (`docker compose -f {config.docker.compose} up -d` + health in `config.env`).
6. **Stash WIP** in each affected repo (`git stash push -u -m "auto-stash {id}"`) — preserves it, does not discard it.
7. **Transition:** `tracker.transition($ARGUMENTS → in_progress)`.
8. **Branch in each affected repo:** `git fetch {config.git.remote}`; checkout `BRANCH` if it exists
   (local/origin), otherwise **create it from `config.git.dev_base`** (⚠️ `dev_base`, not `base_branch`).
9. **Depth:** `DEPTH` = `--depth` argument, else `task.depth` (label `depth:*` on the task or its parent, resolved by
   the driver), else `config.dev.default_depth`, else `deep` (tasks created before depth existed keep the full
   pipeline). `--depth` outside `lean|standard|deep` → **STOP**. Strip `--depth`/`--model` from `$ARGUMENTS`.
10. **Output language:** write every artifact, tracker comment, MR/PR comment and message to the user in
   `config.language` (e.g. `pt-BR`, `en`); if the key is absent, use the language the user is writing in. These
   instructions are in English; the output is not.

### Common briefing (build it once; it goes into every agent's prompt)
```
task_id: $ARGUMENTS | config_path: docs/factory.config.md | initiative_dir: {DIR}
branch: {BRANCH} | repos: {affected, with each one's path}
depth: {DEPTH}
task: type={task.type} parent_id={task.parent_id} complexity={task.complexity}
      depends_on={task.depends_on} description=<task body>
```


**Models:** resolve each worker's model following the order in `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Models per
role" (arg `--model role=value` → `config.models.<role>` → `config.models.default` → plugin default) and
pass it in the `model` parameter of **every** worker launch. Strip the `--model ...` from `$ARGUMENTS`
before using it as ID/initiative. Value outside `fable|opus|sonnet|haiku|inherit` → **STOP**.

---

## PIPELINE (agents; each in its own context)
Base order: **tech-lead → developer(s) → [doc-sync] → code-review → self-test → [doc-sync]**.
**doc-sync** comes in at the point defined by `config.dev.doc_sync_order` (`before_review` or `after_self_test`).

### What runs at each depth
| Step | lean | standard | deep |
|---|---|---|---|
| 1 Tech Lead | **skipped** — the plan is the task body (+ `{DIR}/brief.md` if it exists) | yes, `mode: short` | yes, full |
| 2 Developer | yes | yes | yes |
| Doc Sync | only if the task lists doc changes or the diff touches what `config.docs_map` documents (when skipped and `commit.by: doc_sync`, STEP 5 commits as `by: pipeline`) | yes | yes |
| 3 Code Review | only if **sensitive** (see below) | yes | yes |
| 4 Self Test | yes | yes | yes |

**lean — plan without tech-lead:** write the task body to `{DIR}/plan-$ARGUMENTS.md` (append `{DIR}/brief.md`
when it exists) and use it as `plan_path`. `scope` comes from STEP 0.4 (affected repos): back only → `backend`,
front only → `frontend`, both → `both`.

**lean — sensitive diff (runs Code Review):** after the developer, if any is true —
diff > `config.dev.lean_review_lines` changed lines (default 300); or it touches auth/permissions, scoping/RLS/policies,
migrations/DDL or data-deleting SQL, payments, secrets/credentials, or a path in `config.dev.sensitive_paths`.

**Escalation:** any agent may return `STATUS: ESCALATE` with `escalate_reason`. Stop and ask the human:
raise the depth (e.g. lean → standard: run the Tech Lead now and continue from the Developer with the new plan) or
keep the current depth with the risk written in the final report. **Never raise or lower it on your own.**

**Return protocol** — every agent returns `STATUS:`. Handle it like this, always:
| STATUS | Orchestrator action |
|---|---|
| `OK` / `PASSED` / `APPROVED` | move on to the next step |
| `APPROVED_WITH_NOTES` | move on; carry the 🟡 into the final report |
| `REJECTED` / `FAILED` | back to the developer with the report; **counts 1 retry** (`config.dev.retries`) |
| `BLOCKED` | **STOP and ASK the human** using `blocked_reason` (the agent has no channel) |
| `UPSTREAM_BUG` | escalate to the human; does **not** consume a retry |
| `ESCALATE` | **STOP and ASK the human** whether to raise the depth (see Escalation); does **not** consume a retry |

### STEP 1 — Tech Lead (agent `factory:dev-tech-lead`) → `{DIR}/tech-lead-$ARGUMENTS.md` — standard/deep only
Prompt = common briefing + `mode: short` (standard) or `mode: full` (deep). **Gate:** artifact saved (impact map for a Story, root cause for a Bug) and
`scope` returned (`backend`/`frontend`/`both`).

### STEP 2 — Developer (agent `factory:dev-developer`) → code in the repos
Prompt = common briefing + `plan_path` (`{DIR}/tech-lead-$ARGUMENTS.md`, or `{DIR}/plan-$ARGUMENTS.md` in lean) + `scope` + `repo_path`.
- **`config.dev.developer_split: true`** and `scope == both` → launch **two instances in the same message**
  (one `scope: backend`, the other `scope: frontend`), running in parallel in separate repos.
- **`developer_split: false`** → one instance with `scope: both`.
- **Re-run** (after REJECTED/FAILED) → launch **only the `scope_to_fix`**, with `review_report` in the prompt.

**Gate:** `git diff --stat` consistent with the plan in each repo. The developer does **not** touch `docs/` nor commit.

### Doc Sync (position = `config.dev.doc_sync_order`) → `{DIR}/doc-sync-report-$ARGUMENTS.md`
Agent `factory:dev-doc-sync`; prompt = common briefing. If `config.dev.commit.by == doc_sync`, **it commits**
(code+docs + submodule pointer); otherwise it only edits on disk.

### STEP 3 — Code Review (agent `factory:dev-code-reviewer`, up to `config.dev.retries` attempts) — lean: only when sensitive
Prompt = common briefing + `plan_path` + `attempt` + `developer_notes`.
`REJECTED` → STEP 2 with `scope_to_fix` + `review_report`. `rerun_doc_sync: yes` → re-run doc-sync.
Retries exhausted → escalate and **STOP**.

### STEP 4 — Self Test (agent `factory:dev-self-test`, up to `config.dev.retries` attempts)
Prompt = common briefing + `plan_path`.
`FAILED` → STEP 2 with `scope_to_fix` + `failure`. Retries exhausted → escalate and **STOP**.
**Publish** the returned `self_test_section` on the task: `tracker.comment($ARGUMENTS, self_test_section)`
(or `tracker.append`, depending on the driver) — the agent does not write to the tracker.

---

## STEP 5 — Wrap-up (commit + handoff)
According to `config.dev.commit`:
- **`by: pipeline`**: selective commit in each affected repo with `config.git.commit_format`
  (`{key}`→$ARGUMENTS, prefix by `task.type` via `config.git.branch_prefix`). Doc-sync has already edited (not committed).
- **`by: doc_sync`** (PHCS): doc-sync has already committed code+docs and bumped the submodule pointer.
  If doc-sync was **skipped by depth** (lean), nothing is committed yet → commit here exactly as in `by: pipeline`
  (and bump the submodule pointer if the project uses one).
- **Push** according to `config.dev.commit.push`: `manual` → does **not** push (separate `/push` skill, after QA);
  `mr` → opens a Merge Request.
- **Transition:** `tracker.transition($ARGUMENTS → qa_gate)` (handoff to the QA factory).
- Restore the stashed WIP if desired (`git stash list | grep {id}`).

### Final report
```markdown
## DEV Pipeline — $ARGUMENTS — {date} — {config.project}
Type: {task.type} | Depth: {DEPTH} | Branch: {BRANCH} | Repos: backend/frontend | Status: backlog → in_progress → qa_gate
| Step | Status | Detail |
| 0 Prep · 1 Tech Lead · 2 Developer · Doc-Sync · 3 Review · 4 Self-Test · 5 Commit/Handoff |
Skipped by depth: {steps not run and why} · Escalations: {asked / decided}
Pending 🟡 caveats: {from APPROVED_WITH_NOTES}
Next: task in `qa_gate` → run the QA factory (`/factory:qa $ARGUMENTS`).
```

## RULES
- Each worker is an **agent** in its own context; the role body is its system prompt — do **not** repeat the
  role's rules in the prompt, pass only the briefing (task/paths/scope).
- **Only you** talk to the tracker and the human. `BLOCKED` from any agent = a question to the human, do not improvise the answer.
- Step failed `config.dev.retries`× → **STOP** and escalate. `UPSTREAM_BUG` and `ESCALATE` do not consume a retry.
- Steps skipped by depth are **named** in the final report — never silently.
- The developer **NEVER** edits `docs/` (doc-sync does). The code-reviewer may request a doc-sync re-run.
- **NEVER** commit/branch on `config.git.protected`. **NEVER** `push --force` (`/push` uses `--force-with-lease`).
- The dev branch comes from `config.git.dev_base`; it may be **shared** (several commits accumulate) — see `issue.branch_field`.
- Push is not automatic when `commit.push == manual`. Moving `qa_gate → in_qa → done` is the QA factory's job.
- When in any doubt, **ask the human**.
