# PO Brief — Understand the pain and how to apply it (lean depth) — generic/config-driven
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{initiative}` = value that comes as `Initiative: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).
> If the prompt carries `Project root: <path>`, resolve every relative path (config, `docs/`, `tasks/`) against it.

The **lean** replacement for research + codemap + blueprint. Answers three questions and nothing more:
**what hurts, where it lives in the code, and how to apply the change**. No market study, no benchmark, no
alternatives table. It is written for a developer who will open the files next — short, exact, verifiable.

## INITIATIVE: `{initiative}`
If empty, use `docs/initiatives/{name}/triage.md` as context.

---

## STEP 0 — Config
Read `docs/factory.config.md`. Load `config.{product,stack,docs_map,git}`.
Read `docs/initiatives/{name}/triage.md` if it exists (existing work and blockers already checked).

## 1. Understand the pain (≤ 5 lines in the output)
Who is affected, what goes wrong or what is unwanted today, and the decision being asked for.

## 2. Find where it lives
- Start from the CodeBase maps (`config.docs_map.codebase`) to find the area.
- Then **pin it in the code** on `config.git.base_branch`: `git grep` the names, open only the files that matter,
  and record `path:line` for each point to change. A lean brief is only useful if the locations are exact.
- Cover every layer the change touches (frontend, backend/functions, database: triggers, policies/RLS, jobs,
  KPIs/reports that read the data, docs that state the old rule).

## 3. Decide how to apply
- One row per point to change: the action (delete, edit, add) in one short sentence.
- Where database changes go, follow the project's convention (CodeBase/`AGENTS.md`); never invent a new place.
- What must **not** be touched (e.g. generated folders, other features sharing the same files).

## 4. Escalate when lean is not enough
Return `STATUS: ESCALATE` (and write no brief) when you find that the solution itself is open (several valid
approaches with real trade-offs), or the change touches money, auth/permissions or personal data in a way that
needs a full blueprint. A business **decision** still open is not a reason to escalate: write it as a question.

## OUTPUT → `docs/initiatives/{name}/brief.md` (cap ≈ 80 lines)
```markdown
# Brief — {Initiative}
> Depth: lean · {date} · base: {config.git.base_branch}@{short sha}
## Pain
## Where to change
| Layer | Point (path:line) | Action |
## Decisions for the PO (only if any — each with a recommendation)
1. <question> — Recommended: <answer>
## Acceptance criteria
- [ ] <command or check anyone can run: grep, build, test, HTTP call, SQL count, manual step per role>
## Risks
- <what can break and how it is handled; out of scope>
## Stories
| # | Story | PR | Complexity |
```

## Stories in a lean brief
- **1 Story = 1 reviewable PR.** Do not split by layer (front/back/db) — split only when two parts can ship and be
  tested independently, and only if a single PR would be too big to review. Maximum 3.
- Removals, renames and config changes go in **one** Story unless there is a hard deploy-order constraint that
  cannot be handled inside one PR.

## RETURN (final text = return value)
```
STATUS: OK | ESCALATE
artifact: docs/initiatives/{name}/brief.md
stories: <n>
escalate_reason: <only when ESCALATE — what makes it need standard/deep>
```

## RULES
- **ALWAYS** exact `path:line` from the base branch; **NEVER** a location you did not open.
- **ALWAYS** testable acceptance criteria; **NEVER** repeat the same fact in two sections.
- **NEVER** research the market or list alternatives the PO did not ask for.
- **NEVER** write production code — the brief is a specification.
- Over the cap → cut prose, not locations or criteria.
