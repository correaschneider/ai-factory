# PO Tasks — Epic + Stories in the tracker (generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{initiative}` = value that comes as `Initiative: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).
> If the prompt carries `Project root: <path>`, resolve every relative path (config, `docs/`, `tasks/`) against it.

Breaks the brief (lean) or the blueprint (standard/deep) into **Stories, plus an Epic when there are several**, in the project's tracker. **Does not know whether it is kanban-MD, GitLab or
Jira** — uses the **authoring ops** of `{plugin}/CONTRACT.md` (`create_epic`, `create_story`, `link_dependency`,
`update_epic`); the driver of `config.tracker.driver` translates them.

## INITIATIVE: `{initiative}`
If empty, use the most recent `blueprint.md` in `docs/initiatives/`.

---

## STEP 0 — Config
Read `docs/factory.config.md`. Validate the authoring keys (`{plugin}/CONTRACT.md`): markdown→
`tracker.{board_path,epic_folder,story_folder}` + `issue.id_format`; gitlab→`tracker.project_path`; github→`tracker.repo`.
Missing/`TBD` → **STOP**. Load `{plugin}/drivers/trackers/{config.tracker.driver}.md`.

## FIRST STEP
Source by `Depth` (from the prompt; absent → `deep`):
- `lean` → `docs/initiatives/{name}/brief.md` (the "Stories" table + the rest of the brief). Missing → **STOP** ("run po-brief first").
- `standard`/`deep` → `docs/initiatives/{name}/blueprint.md` — features, acceptance criteria, dependencies,
  complexity. Missing → **STOP** ("run po-blueprint first").

**Labels on everything created:** `generated` + `depth:{Depth}` (the DEV factory reads the depth from it).

## 0. Epic or not
- `lean` with **1 Story** → no Epic: create only the Story (`meta.epic_ref` empty) and skip steps 1 and 4.
- Otherwise → Epic + Stories as below.

## 1. Create the Epic
`epic_ref = tracker.create_epic(slug={name}, title="[{Initiative}] {Name}", body, meta={labels:[generated, depth:{Depth}]})`
(`{Initiative}` = the word "Initiative" in `config.language`, e.g. `Iniciativa` for `pt-BR`.)
— body with summary, MVP scope (bullets), the **decisions shared by all Stories** (written only here) and
pointers to the artifacts of this depth (brief, or research/codemap/blueprint).

## 2. Create one Story per MVP feature (lean: per row of the brief's "Stories" table)
For EACH feature:
`story_ref = tracker.create_story(title="{Feature}", body, meta={epic_ref, depends_on:[…], labels:[generated, depth:{Depth}], complexity, priority})`
- **CRITICAL:** `body` = the **complete feature block from the blueprint** (context + backend + frontend
  + error handling + acceptance criteria + compliance), or, in `lean`, the brief's rows for that Story (where to
  change, decisions, criteria, risks). It is what the DEV will consume. **Do not summarize.**
- **Do not copy** the Epic's shared decisions/context into each Story: write `Epic: #{epic_ref}` at the top and
  let the reader follow the link. Copying the same block into every Story only adds length.
- The driver resolves id and location (markdown: next `issue.id_format` in `story_folder`; gitlab/github/jira: server).

## 3. Resolve dependencies (reciprocal)
For each Story with `depends_on:[Y]`: `tracker.link_dependency(story_ref, Y)` (the driver records the inverse —
`blocks[]` in markdown, issue link in gitlab/jira, "blocked by" in github). Validate there are no cycles.

## 4. Update the Epic
`tracker.update_epic(epic_ref, stories[])` — index/table of the Stories (ID, title, complexity, status, deps).

## 5. Report → `docs/initiatives/{name}/tasks-report.md`
```markdown
# Tasks Report: {Initiative} — {date}
## Depth: {Depth} · Epic created: {epic_ref | none (lean, 1 Story)}
## Stories created | ID | Title | Complexity | Dependencies | Ref |
## Next steps (PO reviews; DEV starts with the 1st Story respecting depends_on)
## Reference: the artifacts of this depth (brief.md | codemap.md + blueprint.md | research.md + codemap.md + blueprint.md)
```

## RULES
- **ALWAYS** create the Epic before the Stories (when there is one); 1 MVP feature = 1 Story = 1 PR.
- **ALWAYS** label `depth:{Depth}` on the Epic and the Stories.
- **ALWAYS** include the **COMPLETE** blueprint block in the Story body (do not summarize).
- **ALWAYS** label `factory-generated`; **ALWAYS** reciprocal dependencies via `link_dependency`.
- **ALWAYS** update the Epic with the Stories table after creating all of them.
- **NEVER** create a Story for scope outside the MVP (Phase 2+ stays only in the Epic as reference).
- **NEVER** overwrite an existing issue/file (id collided → the driver increments/uses the server).
- **NEVER** promote a Story beyond the backlog nor prioritize a Sprint — that belongs to the DEV factory / human decision.
- Dependency only when real — independent Stories run in parallel (no artificial `depends_on`).
