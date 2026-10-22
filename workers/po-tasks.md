# PO Tasks — Epic + Stories in the tracker (generic/config-driven)
> **Worker of the `factory` plugin** — read by path, not a command. `{plugin}` = path that comes in the
> orchestrator prompt as `Plugin: ...`; `{initiative}` = value that comes as `Initiative: ...`.
> Write everything you produce in `config.language` (absent → the language of the task).
> If the prompt carries `Project root: <path>`, resolve every relative path (config, `docs/`, `tasks/`) against it.

Breaks the blueprint into **Epic + Stories** in the project's tracker. **Does not know whether it is kanban-MD, GitLab or
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
Read `docs/initiatives/{name}/blueprint.md` — features, acceptance criteria, dependencies, complexity.
Does not exist → **STOP** ("run po-blueprint first").

## 1. Create the Epic
`epic_ref = tracker.create_epic(slug={name}, title="[{Initiative}] {Name}", body, meta={labels:[generated]})`
(`{Initiative}` = the word "Initiative" in `config.language`, e.g. `Iniciativa` for `pt-BR`.)
— body with summary, MVP scope (bullets) and pointers to research/codemap/blueprint.

## 2. Create one Story per MVP feature
For EACH feature:
`story_ref = tracker.create_story(title="{Feature}", body, meta={epic_ref, depends_on:[…], labels:[generated], complexity, priority})`
- **CRITICAL:** `body` = the **complete feature block from the blueprint** (context + backend + frontend
  + error handling + acceptance criteria + compliance). It is what the tech-lead/DEV will consume. **Do not summarize.**
- The driver resolves id and location (markdown: next `issue.id_format` in `story_folder`; gitlab/github/jira: server).

## 3. Resolve dependencies (reciprocal)
For each Story with `depends_on:[Y]`: `tracker.link_dependency(story_ref, Y)` (the driver records the inverse —
`blocks[]` in markdown, issue link in gitlab/jira, "blocked by" in github). Validate there are no cycles.

## 4. Update the Epic
`tracker.update_epic(epic_ref, stories[])` — index/table of the Stories (ID, title, complexity, status, deps).

## 5. Report → `docs/initiatives/{name}/tasks-report.md`
```markdown
# Tasks Report: {Initiative} — {date}
## Epic created: {epic_ref}
## Stories created | ID | Title | Complexity | Dependencies | Ref |
## Next steps (PO reviews; DEV starts with the 1st Story respecting depends_on)
## Reference: research.md · codemap.md · blueprint.md
```

## RULES
- **ALWAYS** create the Epic before the Stories; 1 MVP feature = 1 Story.
- **ALWAYS** include the **COMPLETE** blueprint block in the Story body (do not summarize).
- **ALWAYS** label `factory-generated`; **ALWAYS** reciprocal dependencies via `link_dependency`.
- **ALWAYS** update the Epic with the Stories table after creating all of them.
- **NEVER** create a Story for scope outside the MVP (Phase 2+ stays only in the Epic as reference).
- **NEVER** overwrite an existing issue/file (id collided → the driver increments/uses the server).
- **NEVER** promote a Story beyond the backlog nor prioritize a Sprint — that belongs to the DEV factory / human decision.
- Dependency only when real — independent Stories run in parallel (no artificial `depends_on`).
