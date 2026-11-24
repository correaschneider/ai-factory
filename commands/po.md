---
description: Factory PO — initiative → triage, then a lean brief, a standard plan or the deep research pipeline, and the tasks in the tracker
argument-hint: <initiative> [--depth lean|standard|deep] [--model role=value]
---
# Factory PO — Orchestrator of the PO factory (generic/config-driven)

Turns a roadmap **initiative** into ready Stories (and an Epic when there are several) in the tracker. A **triage**
step first decides **how deep** the documentation has to go — not every request deserves a market study.
**Nothing project-specific**: product, codebase, stack and tracker come from `factory.config.md`. Tracker through
the authoring ops of `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`.

## INITIATIVE: $ARGUMENTS
If empty, ask which initiative to process (e.g. "Yampi integration") or use the most recent
artifact in `docs/initiatives/<x>/`.

---

## STEP 0 — Load and validate config (MANDATORY)
1. Read `docs/factory.config.md`. Missing → **STOP** ("Run `/factory:init`").
2. Validate the **PO factory keys** (`${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`): `product.{domain,personas}`, `docs_map.codebase`,
   `stack.{backend,frontend}`, and the tracker authoring keys (markdown→`tracker.{board_path,epic_folder,story_folder}`+`issue.id_format`; gitlab→`tracker.project_path`; github→`tracker.repo`). Missing/`TBD` → **STOP** saying which one.
3. Load the bindings (never a hardcoded value). Load `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md`.
4. Initiative folder: `name = kebab-case($ARGUMENTS)` → `docs/initiatives/{name}/`. `mkdir -p`.
5. **Output language:** write every artifact, tracker comment, MR/PR comment and message to the user in
   `config.language` (e.g. `pt-BR`, `en`); if the key is absent, use the language the user is writing in. These
   instructions are in English; the output is not.

**Arguments:** strip `--depth <x>` and `--model ...` from `$ARGUMENTS` before using it as the initiative.
`--depth` outside `lean|standard|deep` → **STOP**.

**Models:** resolve each worker's model following the order in `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Models per
role" (arg `--model role=value` → `config.models.<role>` → `config.models.default` → plugin default) and
pass it in the `model` parameter of **every** worker launch. Value outside `fable|opus|sonnet|haiku|inherit` → **STOP**.

---

## STEP 1 — Triage (you do it, no sub-agent; cheap and fast)
Goal: decide the **depth** and catch work that already exists. Spend minutes, not a research pass.

### 1a. Look for existing work
`tracker.search(<3-6 key terms of the initiative>)` (CONTRACT op E) — open **and** closed epics/stories.
For each relevant hit, read its body/status: does it already cover this initiative, fully or partly?

### 1b. Re-check stated blockers
If a hit (or its open stories) says it is **blocked** by something concrete (a folder/file not merged, a branch,
another issue), verify it **now** — `git ls-tree`/`git log` on the base branch, `tracker.fetch` of the blocking issue.
A blocker that no longer holds is a finding to report, not a reason to wait.

### 1c. Classify the depth
Read the initiative and skim the CodeBase index (`config.docs_map.codebase`) — no deep reading yet.

| Signal | Points to |
|---|---|
| Removal, rename, config, copy/text, maintenance SQL, dependency bump, bug with a known cause | **lean** |
| Change inside an area that already exists, with a known solution | **standard** |
| New capability or product area; several valid solutions and no pick yet; market/UX references matter | **deep** |
| Touches money, auth/permissions, personal data, irreversible data change, or a new external integration | at least **standard** (deep if the solution is also open) |

Ties → `config.po.default_depth` (absent → `standard`). Business decisions that are still open (a KPI formula, a
process rule) do **not** raise the depth by themselves: they become questions in the brief/blueprint.

### 1d. Confirm with the human (one message)
```
Triage — {initiative}
Existing work: <#ref title (status) — covers all|part|none> … | none found
Stale blockers: <#ref "blocked by X" — X already in {base}> | none
Suggested depth: lean|standard|deep — <2-3 reasons from the table>
Options: [proceed with <depth>] [use another depth] [continue the existing #ref instead] [cancel]
```
- `--depth` given → skip the depth question, but **still report** 1a/1b findings and stop if work already exists.
- Existing work covers the initiative → do not create duplicates; ask whether to continue it, refine it or cancel.
- Record the outcome in `docs/initiatives/{name}/triage.md` (≤ 20 lines: findings + chosen depth + who chose).

`DEPTH` = the confirmed value. It travels as the label `depth:{DEPTH}` on everything created (DEV inherits it).

---

## STEP 2 — Pipeline by depth (each step = sub-agent via Task, isolated context)
Apply the **gate** after each step: validate the expected artifact; failed → **STOP** and report.
Every worker prompt line carries ` | Depth: {DEPTH}`.

| DEPTH | Steps | Artifacts in `docs/initiatives/{name}/` |
|---|---|---|
| **lean** | Brief → Tasks | `brief.md` (≤ ~80 lines) |
| **standard** | Code Map → Blueprint → Tasks | `codemap.md` + `blueprint.md` (≤ ~300 lines together) |
| **deep** | Researcher → Code Map → Blueprint → Tasks | `research.md` + `codemap.md` + `blueprint.md` |

### Brief (lean only) → `brief.md`
```
Read and follow `${CLAUDE_PLUGIN_ROOT}/workers/po-brief.md`. Initiative: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Folder: docs/initiatives/{name}/ | Depth: lean
```
**Gate:** pain + where-to-change table (file and line) + acceptance criteria + risks + stories (1 to 3), within the size cap.
`STATUS: ESCALATE` from the worker → show the reason and ask: re-run as `standard`, or keep `lean` with the risk noted.

### Researcher (deep only) → `research.md`
```
Read and follow `${CLAUDE_PLUGIN_ROOT}/workers/po-researcher.md`. Initiative: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Folder: docs/initiatives/{name}/ | Depth: deep
```
**Gate:** file exists with a comparison table + MVP recommendation (+ compliance check if `config.product.compliance` is non-empty).

### Code Map (standard, deep) → `codemap.md`
```
Read and follow `${CLAUDE_PLUGIN_ROOT}/workers/po-codemap.md`. Initiative: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Folder: docs/initiatives/{name}/ | Depth: {DEPTH}
```
**Gate:** mapped what already exists (via `config.docs_map.codebase`) + gaps + dependencies + risks.

### Blueprint (standard, deep) → `blueprint.md`
```
Read and follow `${CLAUDE_PLUGIN_ROOT}/workers/po-blueprint.md`. Initiative: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Folder: docs/initiatives/{name}/ | Depth: {DEPTH}
```
**Gate:** every feature has backend + frontend + error handling + testable acceptance criteria + complexity;
`standard` → also within the size cap.

### Tasks (all depths) → Stories (+ Epic) in the tracker
```
Read and follow `${CLAUDE_PLUGIN_ROOT}/workers/po-tasks.md`. Initiative: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Folder: docs/initiatives/{name}/ | Depth: {DEPTH}
```
**Gate:** Stories created (and the Epic, when the worker creates one), linked, labeled `depth:{DEPTH}`, and
`tasks-report.md` lists the IDs.

> The order is fixed inside each depth. Researcher and Code Map *could* run in parallel in `deep`, but the
> sequence is safer (the code map benefits from the research).

---

## STEP 3 — Final report and handoff
```markdown
## PO Pipeline — {Initiative} — {date} — {config.project}
Depth: {DEPTH} ({suggested|forced}) · Triage: docs/initiatives/{name}/triage.md
| Step | Status | Output |
|------|--------|--------|
| Triage | ✅ | existing work: … · stale blockers: … |
| <steps of this depth> | ✅ | docs/initiatives/{name}/<artifact> |
| Tasks | ✅ | [Epic +] N Stories |

### Stories created (handoff to the DEV factory)
| ID | Feature | Complexity |
### Open decisions for the PO
<questions left in the brief/blueprint, if any>
### Next steps
1. PO: review the brief/blueprint + Stories.  2. DEV: start with the first Story (DEV pipeline — it inherits the depth).
```

## RULES
- STEP 0 always first; without a valid config (or with `TBD`), it does not run.
- **Triage always runs** (even with `--depth`): never create a duplicate of existing work without asking.
- The depth only goes **up** without asking (worker `ESCALATE` → ask); never lower it on your own.
- Each sub-agent in its **own context** (Task). Fixed order inside each depth.
- Gate failed at any step → **STOP** and report; do not skip or invent a missing artifact.
- All intermediates in `docs/initiatives/{name}/` (traceability).
- Stories **are born in the tracker backlog** (markdown: `story_folder`; gitlab/github: open issue) — promoting them is the DEV factory's job.
- The factory **creates and organizes, it does not prioritize** the Sprint (human decision).
