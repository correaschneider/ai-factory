# Tracker Driver — ClickUp (ClickUp MCP)

**Config keys:** `list_id` (list where the tasks live), `status{}` in **status name** format (string,
exact case-insensitive match as ClickUp requires), `labels{}` (tags), `issue.branch_field`.
**Access:** ClickUp MCP (`mcp__clickup__clickup_*`).
**Capabilities:** ClickUp has arbitrary statuses per list → logical status = **status name** (same as Jira).
Tags play the role of labels. No sub-issue by default → `create_child_bug` = new task in the same list + link.
⚠️ ClickUp **does not derive the branch** from the key (the task id does not become a branch): the branch comes from
`issue.branch_field` (e.g. `CU-{id}`) — see `fetch`.

---

### 1. fetch(id)
- `mcp__clickup__clickup_get_task` (task_id=id, `include:["description"]`). `title`=`name`, `description`, `assignee`=`assignees[0]`.
- `type` = heuristic: task with tag/label `bug` → bug, otherwise story.
- `logical_status` = match `status` (ClickUp string) against `config.tracker.status` (case-insensitive match).
- `branch` = convention from `config.scm.branch_convention` applied to the id (e.g. `CU-{id}`) — **not** derivable from the key prefix.
- `linked_mr` = scan `description` + `mcp__clickup__clickup_get_task_comments` for MR URLs/refs (the CR factory uses this in `find_mrs`).

### 2. read_blueprint(id) → `fetch().description`.

### 3. transition(id, target)
- `target_status = config.tracker.status[target]` (exact status name in the list).
- `mcp__clickup__clickup_update_task` (task_id=id, `status: target_status`).
- ⚠️ Before moving, if the command needs the previous status (rollback), capture `fetch().logical_status` first.

### 4. comment(id, md) → `mcp__clickup__clickup_create_comment` (⚠️ **`entity_type: "task"` + `entity_id: id`**, NOT `task_id`; `comment_text=md`). ClickUp renders markdown.

### 5. create_child_bug(task, title, md)
- `mcp__clickup__clickup_create_task` in the same list (`list_id`), name=title, markdown_description=md, tag `bug`.
- Link to the task: `mcp__clickup__clickup_add_task_link` (or dependency) → task ↔ new bug. Return the new id.

### 6. label(id, target) → `mcp__clickup__clickup_add_tag_to_task` (task_id=id, tag=`config.tracker.labels[target]`).

---

## Authoring ops (PO factory) — optional
If the PO factory runs with ClickUp: `create_epic`/`create_story` via `clickup_create_task` (epic = task with tag
`epic`; story = task linked via `clickup_add_task_link`). `link_dependency` = `clickup_add_task_dependency`.
`update_epic` = edit the epic's `markdown_description` with the stories checklist. IDs are assigned by ClickUp.

## Prerequisite
ClickUp MCP server connected. To discover `list_id`/valid status names: `clickup_get_task` with
`expand_statuses:true` returns the list's `available_statuses` — use it to validate the config names in step 0.
