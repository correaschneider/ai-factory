# Tracker Driver — Jira (Atlassian MCP)

**Config keys:** `cloud_id`, `project_key`, `status{qa_gate,in_qa,done}` (status names),
`transitions{}` (fallback id), `labels{}`, `fields{}`, `forms{}`, `git.branch_prefix`.
**Access:** MCP `mcp__claude_ai_Atlassian__*`.
**Capabilities:** all native. Distinct native statuses (no discriminating label needed).
Bug link via `createIssueLink` ("Relates" relation, not parent).

---

### 1. fetch(id)
- `getJiraIssue(cloud_id, id)`.
- `title=fields.summary`; `type` = (issuetype.name=="Bug" ? bug : story); `parent_id=fields.parent?.key`;
  `assignee=fields.assignee`; `description=fields.description` (ADF→markdown).
- `logical_status` = reverse lookup of `fields.status.name` in `config.tracker.status` (names are unique).
- `branch` = from the MR/branch linked to the issue (dev panel) if any; otherwise the **convention** `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → `fields.description` (ADF→markdown). = `fetch().description`.

### 3. transition(id, target)
- `target_name = config.tracker.status[target]`.
- **ALWAYS** `getTransitionsForJiraIssue(id)` → find the transition whose destination == `target_name`.
- **Fallback / tie-break:** if the lookup returns **0 or >1** candidates, use the id from
  `config.tracker.transitions[target]`. If there is still no valid transition from the current
  status: **STOP** and report (do not force it).
- `transitionJiraIssue(id, transition_id)`.

### 4. comment(id, md)  → `addCommentToJiraIssue(cloud_id, id, body)`; convert **markdown→ADF** first (the MCP expects ADF).

### 5. create_child_bug(task, title, md)
- `createJiraIssue(cloud_id, project_key, issuetype="Bug", summary=title, description=md(ADF))`.
- `createIssueLink(new_id, task, type="Relates")` — **linked to the task in QA**, not a child of the epic.
- Return `new_id`.

### 6. label(id, target)  → `editJiraIssue(cloud_id, id, fields:{labels:[+ config.tracker.labels[target]]})`.
