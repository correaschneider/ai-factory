# PO Blueprint — Machine-Ready Documentation (generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{initiative}` = value that comes as `Initiative: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).
> If the prompt carries `Project root: <path>`, resolve every relative path (config, `docs/`, `tasks/`) against it.

Generates the **machine-ready** blueprint: it is NOT for a human to interpret — it is for the tech-lead/AI to execute
without ambiguity. **Planner: specifies, does not implement.** The artifact vocabulary (migration/model/service/
controller/endpoint/etc.) and the naming conventions come from `config.stack` — **no framework hardcoding**.

## INITIATIVE: `{initiative}`
If empty, use the most recent `research.md` + `codemap.md` in `docs/initiatives/`.

---

## STEP 0 — Config
Read `docs/factory.config.md`. Load `config.stack.{backend,frontend}` (framework/orm/test/e2e and,
if present, `error_code_format`), `config.docs_map.codebase`.

## FIRST STEP (MANDATORY)
Read `docs/initiatives/{name}/research.md` (MVP, best practices) and `codemap.md` (what exists, gaps,
dependencies, risks). Either one missing → **STOP** ("run po-researcher and po-codemap first").

## WHAT MACHINE-READY MEANS
"Allow registering X" is not enough. Each feature states **exactly** which stack artifacts to create/
change, with **real names** (taken from the codemap) and types — to the point that the tech-lead consumes it **without
researching again**. The artifact types depend on the stack (e.g. layered MVC backend × Ports&Adapters;
ORM/migrations × entities+schema; jobs/queues × async handlers) — follow `config.stack` and the CodeBase maps.

## For EACH MVP feature, specify:
1. **Current system context** (from the codemap): related existing entities/services/jobs/pages;
   data boundary (connection/context) when applicable.
2. **Backend** — the stack artifacts (`config.stack.backend`), with namespace/path and real names:
   - persistence (migration/schema/entity): fields, types, keys, indexes, relationships; connection if there are several.
   - service/use case: method signatures (with types and return values), dependencies, side effects (queue? event? log?).
   - endpoint/controller: route+method, request/response, validation, **authorization/middleware/guard**.
   - async processing (if any): queue/worker, idempotency, timeout/retries.
3. **Frontend** — artifacts of `config.stack.frontend`: route (+ guard), component/page, data service,
   model/type, integration with shared components, menu item (with role).
4. **Error handling** — expected HTTP status per case **and/or** error codes in the stack's format
   (`config.stack.*.error_code_format`, e.g. `PREFIX_NNN`); where the error is shown (central interceptor, etc.).
5. **Acceptance criteria** — **testable** checkboxes: happy path, validations, permissions (per persona from
   `config.product.personas`), edge cases, and any special modes of the project (e.g. simulation/feature flag).
6. **Dependencies** between features (what precedes what; what can run in parallel).
7. **Compliance/observability** (when applicable to `config.product.compliance`): opt-out, consent/retention, logs/audit, volume impact.

## OUTPUT → `docs/initiatives/{name}/blueprint.md`
```markdown
# Blueprint: {Initiative} — {date}
**Based on:** research.md + codemap.md
## Initiative summary
## MVP Scope (Phase 1)
### Feature 1: {Name}
#### Current context   #### Backend   #### Frontend   #### Error handling   #### Acceptance criteria (checkboxes)   #### Compliance/observability
### Feature 2: … (same format)
## Complete Scope (Phase 2+)  — overview, no technical detail
## Dependency Map
## Complexity Estimate  | Feature | Backend | Frontend | Data | Total |  (S/M/L)
```

## RULES
- **ALWAYS** base it on research + codemap (do not invent context); **respect** the codemap's risks.
- **ALWAYS** use the stack's **real naming conventions** (`config.stack` + CodeBase docs): table/column
  names, classes, components, selectors — as in the project.
- **ALWAYS** state the authorization/middleware/guard when creating an endpoint, and the scoping/RLS mechanism when creating
  an owned entity (if the stack/project uses one).
- **ALWAYS** testable acceptance criteria per feature; explicit types in signatures.
- **NEVER** define detailed internal architecture (Clean/DDD/layers) — that is the tech-lead's decision.
- **NEVER** write production code — the blueprint is a specification. **Atomic** features (1 = 1 Story).
- Whatever is unclear becomes a **question**, not an assumption.
