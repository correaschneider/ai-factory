# Tracker Driver — GitLab (GitLab MCP)

**Config keys:** `project_path` (or via remote), `status{}` in the format `{state, label?}`, `labels{}`,
`git.branch_prefix`.
**Access:** GitLab MCP.
**Capabilities:** GitLab has no arbitrary status → logical status = `state` (opened/closed)
**+ stage label** (required to distinguish `qa_gate` from `in_qa`, since both are `opened`).
No native sub-issue → `create_child_bug` = related issue + link.
⚠️ Stage labels (`qa_gate.label`, `in_qa.label`) are **mutually exclusive**: `transition`
removes the other stage labels when applying the new one.

---

### 1. fetch(id)
- GitLab MCP: get issue by `iid`. `title`, `description`, `assignee`.
- `type` = by label `bug`→bug, otherwise story (heuristic; if the project does not label types, default story).
- `logical_status` = match the issue's `{state, label}` against `config.tracker.status` by the **most
  specific** selector (the one requiring a label wins). E.g.: opened+`ready-for-qa`→`qa_gate`; opened+`qa-iniciada`→`in_qa`; closed→`done`.
- `branch` = MR linked to the issue (source branch); otherwise convention `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → `issue.description`. = `fetch().description`.

### 3. transition(id, target)
- `sel = config.tracker.status[target]` (`{state, label?}`).
- Adjust `state` (open/close) if different. If `sel.label`: **remove** the stage labels of the
  other logical statuses and **add** `sel.label`.

### 4. comment(id, md)  → create a **note** on the issue (GitLab accepts native markdown).

### 5. create_child_bug(task, title, md)
- Create an issue (`title`, `description=md`, label `bug`). Link it to the task (related issue / `/relate`).
- Return `iid`.

### 6. label(id, target)  → add `config.tracker.labels[target]`.

---

## Authoring ops (PO factory)
**Extra keys:** `project_path` (group/project where to create). GitLab assigns the `iid` (no manual next-id).
GitLab has no "Epic" in the free tier → the epic is an **issue** with label `epic` (or a Milestone, if the project uses them);
declare the choice in the config if it differs. No sub-issue → relation via **issue links**.

### A. create_epic(slug, title, body, meta)
- Create an issue (`title`, `description=body`, labels `[epic, factory-generated, …]`) in `project_path`.
  (If the project uses GitLab Premium Epics, create a native Epic.) Return `epic_ref = iid`.

### B. create_story(title, body, meta)
- Create an issue (`title`, `description=body`, labels `[factory-generated, complexity::{x}, …]`).
- Link it to the epic: issue link **relates_to** `meta.epic_ref` (or the Epic field if native). Return `story_ref = iid`.

### C. link_dependency(story_ref, depends_on_ref)
- Create an issue link **blocks**: `depends_on_ref` *blocks* `story_ref` (GitLab keeps the inverse automatically).

### D. update_epic(epic_ref, stories[])
- Edit the epic's description: insert a checklist/table of stories (`- [ ] #iid Title`). Already-linked issues show up under "Linked items".
