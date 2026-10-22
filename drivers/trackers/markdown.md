# Tracker Driver — Markdown kanban (filesystem)

**Config keys:** `tracker.board_path`, `tracker.backlog_folder` (where to create a new bug, e.g. `todo`),
`status{}` in the format `{folder, label?}`, `labels{}`, `issue.id_format`, `issue.branch_field`.
**Access:** filesystem (no MCP).
**Capabilities:** everything via files. ⚠️ No concurrency lock (assumes 1 editor at a time).
When `qa_gate` and `in_qa` use the **same folder**, they are told apart by a **stage label** in the frontmatter.

---

### 1. fetch(id)
- `find {board_path} -name "{id}-*.md"` → keep the current folder `<current>`.
- Parse the frontmatter (`id, title, type, parent, assignee, labels`) + body.
- `logical_status` = match `{folder=<current>, label∈frontmatter.labels}` against `config.tracker.status`
  by the **most specific** selector (the one requiring a label wins).
- `branch` = `frontmatter[{config.issue.branch_field}]` if it exists (e.g. `clickup_id` → `CU-{value}`);
  otherwise convention `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → body of the `.md`. = `fetch().description`.

### 3. transition(id, target)
- `sel = config.tracker.status[target]` (`{folder, label?}`). Resolve `<current>` via find (step 1).
- If `sel.folder` ≠ `<current>`: `mv {board_path}/<current>/{id}-*.md {board_path}/{sel.folder}/`.
- If `sel.label`: remove the stage labels of the other statuses and add `sel.label` to the frontmatter.

### 4. comment(id, md)  → append `\n\n## Comment ({timestamp})\n{md}` (timestamp comes from the environment).

### 5. create_child_bug(task, title, md)
- New id via `config.issue.id_format` (scan existing ids for the next number).
- Write `{board_path}/{config.tracker.backlog_folder}/{new_id}-{slug}.md` with frontmatter
  `parent: {task}`, `type: bug`, body `md`. Return `new_id`.

### 6. label(id, target)  → add `config.tracker.labels[target]` to the frontmatter's `labels:`.

---

## Authoring ops (PO factory)
**Extra keys:** `tracker.epic_folder` (e.g. `epics`), `tracker.story_folder` (e.g. `todo`), `issue.id_format`.

### A. create_epic(slug, title, body, meta)
- Write `{board_path}/{epic_folder}/EPIC-{slug}.md` with frontmatter `type: epic, slug, status: active,
  labels: [factory-generated, …]` + body. Return `epic_ref = EPIC-{slug}`.

### B. create_story(title, body, meta)
- `id` = next via `issue.id_format` (scan `board_path` for `^id:` → highest number +1).
- Write `{board_path}/{story_folder}/{id}-{slug}.md` with frontmatter `id, type: story, status: todo,
  epic: {meta.epic_ref}, depends_on: {meta.depends_on}, blocks: [], complexity, priority,
  branch: {git.branch_prefix.story}{id}, labels: [factory-generated, …]` + body = blueprint block.
- Return `story_ref = {id}` (+ path).

### C. link_dependency(story_ref, depends_on_ref)
- In the `depends_on_ref` file, add `story_ref` to `blocks: []` (reciprocal of `depends_on`).
- Validate there is no cycle.

### D. update_epic(epic_ref, stories[])
- Edit `EPIC-{slug}.md`: fill the `## Stories` section with the table `| ID | Title | Complexity | Status | Dependencies |` (relative links).
