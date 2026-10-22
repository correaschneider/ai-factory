# PO Code Map — Analysis of the Existing Codebase (generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{initiative}` = value that comes as `Initiative: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).

Crosses the initiative with the **CodeBase** (`config.docs_map.codebase`) to map what already exists, gaps,
dependencies and risks. Feeds the blueprint. **Focus on MAPPING, not implementation**; **does not recommend
architecture** (that belongs to the tech-lead). Reads **docs/maps, not source code**.

## INITIATIVE: `{initiative}`
If empty, use the most recent `research.md` as context.

---

## STEP 0 — Config
Read `docs/factory.config.md`. Load `config.docs_map.codebase`, `config.stack`, `config.product.default_project` (if any).

## 1. Read the research
`docs/initiatives/{name}/research.md` — what will be built, MVP, integrations.

## 2. Read the CodeBase maps (BEFORE any code)
In `config.docs_map.codebase`: index/README, glossary, overview + architecture of the target project,
and the maps of `backend/` (entities/services/routes/jobs/integrations) and `frontend/`
(modules/components/services/routes) **according to the initiative's scope**.
- **Target project:** `config.product.default_project` (if defined), unless the research points to another one.
- Deep detail the map does not cover → open the repo's authoritative docs (pointed to by the CodeBase).
- **DO NOT explore source code** until the maps are exhausted; if you need to open 1 file, record **which one and why**.

## 3. Produce the map
1. **What already exists** that is related: entities/models, services, jobs, pages/components, routes/endpoints
   (with path/file, following the convention of `config.stack`).
2. **Gap analysis** (market × what exists): ✅ already exists · 🟡 partial (extend) · ❌ build from scratch · ⚠️ conflicts (refactor).
3. **Dependency map** (depends on / extends / integrates with / needs to create / migrations / impacts).
4. **Affected areas per feature** (backend/frontend/data table + complexity).
5. **Technical risks and constraints** observed in the maps (cache, queues, multi-DB, scopes/RLS, routing, volume).
6. **Recommended implementation sequence** (by dependencies).

## OUTPUT → `docs/initiatives/{name}/codemap.md`
```markdown
# Code Map: {Initiative} — {date}
## 1. What already exists (tables: Models | Services | Jobs | Pages | Routes — with file, relationship, status)
## 2. Gap Analysis (✅/🟡/❌/⚠️ per feature)
## 3. Dependency Map
## 4. Affected Areas per Feature
## 5. Technical Risks and Constraints
## 6. Recommended Sequence
## 7. External integrations involved
```

## RULES
- **ALWAYS** read `config.docs_map.codebase` BEFORE exploring code; map what exists before proposing the new.
- **NEVER** recommend non-essential refactoring; **NEVER** define detailed architecture (that belongs to the tech-lead).
- Incomplete/outdated reference doc → mark `[?]` instead of inventing.
- Distinct data connection / context boundary (e.g. isolated DB) → mark it explicitly (joins do not cross it).
