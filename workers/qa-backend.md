# QA Backend — Test Creation (reads real code, generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{task_id}` = value that comes as `Task: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).

Creates the backend tests that run on the **project's stack** (`config.stack.backend.test`), using the
**IMPLEMENTED code as the source of truth**. **Nothing project-specific**: framework, paths,
helpers and idioms come from `factory.config.md`.

## Task ID: `{task_id}`
If empty, ask which task (format in `config.issue.id_regex`).

---

## STEP 0 — Load and validate config (MANDATORY)
1. Read `docs/factory.config.md`. Does not exist → **STOP**.
2. Validate required keys (`{plugin}/CONTRACT.md`) + the backend ones: `tests.layout.backend`,
   `stack.backend.test`, `workspace.repos.backend.path`. Missing/`TBD` → **STOP**.
3. Load bindings (never a hardcoded value). Tracker driver only if you need to comment.

---

## 1. Read the plan
Take the most recent `qa-plan-{task_id}.md` in `docs/initiatives/*/`. Understand the I-XX / U-XX scenarios.

## 2. Read the REAL CODE (source of truth)
List the changed files and **open** the backend ones to understand HOW to test:
```bash
cd {config.workspace.root}/{config.workspace.repos.backend.path}
git diff --name-only {config.git.base_branch}..HEAD
```
By layer (convention of `config.stack.backend`), extract what is **real** (it may diverge from the blueprint):
- **Controllers/handlers:** exact endpoint+method, required params, returned statuses, error codes/messages.
- **Validation** (FormRequest/DTO/schema): rules (`required`/`unique`/`exists`…), custom messages.
- **Models/entities:** fields (`fillable`/columns), casts/types, relations, global scopes, connection.
- **Services:** signature of public methods, behavior, side effects (queue? event? log?).
- **Routes/middlewares + migrations:** URI/applied middleware; table/columns/indexes/FKs.

Check `config.docs_map.codebase` for stack conventions/quirks (naming, multi-DB, soft-delete, etc.).

## 3. Read the project's test helpers
`config.tests.backend_helpers` (auth, client, cleanup, factories) + the existing test base
(`config.tests.layout.backend`) to reuse the project's setup pattern.

## 4. Compare plan × real code
| Plan scenario | Real endpoint | Real params | Real status/error | Adjust? |
|---|---|---|---|---|
Diverged → **test it as it WAS implemented** (code is the truth) + document the divergence in the test.

## WHERE TO CREATE
In `config.tests.layout.backend` (integration `{feature}` + unit, according to the project's layout).
Framework and runner: `config.stack.backend.test`.

## TEMPLATE (agnostic skeleton — adapt to the stack's idioms)
```
// Header: Feature, Task {task_id}, source plan, plan↔code Divergences
// Setup: authenticate 1 client per relevant role (config.tests.roles) via config.tests.backend_helpers
// Isolation: use the stack's mechanism
//   - RefreshDatabase / transaction (Laravel)   - ephemeral SQLite + forks pool (Vitest/NestJS)
//   - factory + trackForCleanup/cleanup in teardown (remote HTTP)
// 1 plan scenario = 1 test; the name references the ID (e.g. test_I01_..., 'I-01: ...')
// Categories: CRUD happy path · validation · not-found 404 · auth 401 · permission 401/403
//             · multi-tenancy (if any) · business rules from the criteria · G-XX regression
// Assertions with REAL statuses/params/messages from the code (not from the plan)
// Side effects: the stack's queue/event fake (e.g. Queue::fake / sync) when the action dispatches a job
```
> The skeleton is illustrative: follow the stack's real idioms (`config.stack.backend`) and the project's
> helpers. Do **not** copy literals from another project.

## RULES
- **ALWAYS** read the real code BEFORE writing; use statuses/params/error codes/fields **from the code**.
- **ALWAYS** reference the plan scenario in the test name (I-01, U-01, G-01).
- **ALWAYS** isolate via the stack's mechanism; full cleanup in teardown.
- **ALWAYS** document plan↔code divergence as a comment (`// Divergence: …`).
- **NEVER** guess error codes/field names; **NEVER** test a nonexistent endpoint; **NEVER** mock the ORM.
- Found a bug while reading the code → mark `// POTENTIAL BUG: …` but write the test normally.
- Feature dispatches a job/event → test with the stack's fake/sync.
