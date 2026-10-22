# QA Frontend — E2E Test Creation (reads real code, generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{task_id}` = value that comes as `Task: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).

Creates the E2E tests by extracting **selectors, routes and flows from the IMPLEMENTED CODE**. They run via Docker
pointing at `config.env`. **Nothing project- or tool-specific**: paths and helpers come from
`factory.config.md`; syntax, login, waiting, selectors and evidence come from the **E2E driver**.

## Task ID: `{task_id}`
If empty, ask which task (format in `config.issue.id_regex`).

---

## STEP 0 — Load and validate config (MANDATORY)
1. Read `docs/factory.config.md`. Does not exist → **STOP**.
2. Validate required keys (`{plugin}/CONTRACT.md`) + the frontend ones: `tests.layout.frontend`,
   `stack.frontend.e2e`, `workspace.repos.frontend.path`, `env.{app_url,api_url}`. Missing/`TBD` → **STOP**.
3. Load bindings (never a hardcoded value).
4. **E2E driver:** `<name>` = first word of `config.stack.frontend.e2e` in lowercase (absent →
   `cypress`). Load `{plugin}/drivers/e2e/<name>.md`; does not exist → **STOP** ("create `drivers/e2e/<name>.md`").
   From here on, **E1–E5** = sections of that driver.

---

## 1. Read the plan
Most recent `qa-plan-{task_id}.md` in `docs/initiatives/*/`. Understand the E-XX (and G-XX) scenarios.

## 2. Read the REAL CODE (real selectors/routes/guards)
```bash
cd {config.workspace.root}/{config.workspace.repos.frontend.path}
git diff --name-only {config.git.base_branch}..HEAD
```
- **Routes/routing:** real path + guards + component. Respect the **stack's routing mode**
  (e.g. hash routing → `/#/path`) — see `config.stack.frontend`.
- **Templates:** form field names (`formControlName`/`name`), button classes, modal/dialog
  structure, `data-testid`, visible texts (for text selectors).
- **Components:** form group, button methods (submit/delete), modal/notification libs used,
  role/profile checks.

Check `config.docs_map.codebase` for the stack's UI quirks (shared components, overlays, etc.).

## 3. Read the project's test helpers
`config.tests.frontend_cmds` (programmatic login, authenticated request, navigation: custom commands,
fixtures or setup, depending on the tool) + the existing test base (`config.tests.layout.frontend`)
to reuse the pattern. Login: **always** programmatic, as **E2** dictates (not through the form, which is slow).
Roles: `config.tests.roles`.

## 4. Map real selectors (table BEFORE writing)
| Element | Real selector (from the template) | Fallback |
|---|---|---|
Preference order and fallback: **E4**. Unstable selector → `// TODO: add data-testid="…"`.
Do **not** guess a selector without reading the template.

## WHERE TO CREATE
In `config.tests.layout.frontend`, with the name and extension from **E1**. Video on and screenshot on failure,
as **E5** enables them from `config.evidence`.

## TEMPLATE (agnostic skeleton — adapt to the stack's idioms)
```
// Header: Feature, Task {task_id}, source plan, files the selectors came from, divergences
// before each test: programmatic login per role (E2, via config.tests.frontend_cmds)
// after: cleanup of created data via API (E2), using a data prefix to filter
// 1 plan scenario = 1 test in E1 syntax; name starts with the ID (E-01, …)
// Coverage: loads authenticated · unauthenticated redirects · create · form validation
//            · edit · delete w/ confirmation · backend error shown (notification) · permission by role
//            · G-XX regression (if in the plan)
// Waits with assertion and timeout (E3), NOT fixed sleep for UI; REAL selectors from the template (E4)
```
> Framework idioms (headless overlays, custom checkbox, waiting for a component to become enabled, normalizing
> a list response, hash routing) vary by stack — follow `config.stack.frontend` and
> `config.docs_map.codebase`. Do **not** copy literals from another project.

## RULES
- **ALWAYS** read templates + routing BEFORE; use **real** `formControlName`/selectors/routes.
- **ALWAYS** programmatic login per role (E2, `config.tests.frontend_cmds`).
- **ALWAYS** reference the plan scenario in the test name (E-01, …); document divergences as a comment.
- **ALWAYS** cleanup via API request in `after` (with a data prefix to avoid collisions).
- **ALWAYS** mark an unstable selector with `// TODO: data-testid`.
- **NEVER** guess a nonexistent selector/route; **NEVER** hardcode IDs; **NEVER** mock HTTP (it runs against the real backend).
- **NEVER** use a fixed sleep to wait for the UI — use an assertion with timeout (E3; sleep only for async state after a mutation).
- Each acceptance criterion = ≥1 test (the corresponding E-XX).
