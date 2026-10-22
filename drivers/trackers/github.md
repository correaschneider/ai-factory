# Tracker Driver — GitHub Issues (gh CLI)

**Config keys:** `tracker.repo` (`owner/repo`; absent → the `origin` remote), `status{}` in the format
`{state, label?}` with `state` ∈ `open|closed`, `labels{}`, `git.branch_prefix`. Optional:
`tracker.epic_type` (name of the *issue type* used for epics, e.g. `Epic`; absent → label `epic`).
**Access:** authenticated `gh` (`gh auth status`), in a version that has the `--parent` and `--add-blocked-by` flags (check with `gh issue create --help`). The plugin
never reads a credential file: it only uses the CLI. Without `gh`, the GitHub MCP server works for the same
calls.
**Capabilities:** GitHub has no arbitrary status → logical status = `state` (open/closed) **+ stage
label** (required to distinguish `qa_gate` from `in_qa`, both `open`). It has native **sub-issues** and
**dependencies** ("blocked by"); where the repository lacks them (old GitHub Enterprise, feature
disabled), the fallback is a **cross-reference** in the body of both issues.
⚠️ Stage labels are **mutually exclusive**: `transition` removes those of the other logical statuses
when applying the new one.

In every command below, `-R {repo}` with `repo = config.tracker.repo`.

---

### 1. fetch(id)
```bash
gh issue view {id} -R {repo} --json number,title,body,state,labels,assignees,parent,closedByPullRequestsReferences,issueType
```
- `type` = `bug` if it has the `bug` label (or `issueType.name == "Bug"`), otherwise `story`.
- `logical_status` = match `{state, labels}` against `config.tracker.status` by the **most specific** selector
  (the one requiring a label wins). E.g.: open+`ready-for-qa`→`qa_gate`; open+`in-qa`→`in_qa`; closed→`done`.
- `parent_id` = `parent.number` (sub-issue of an epic), otherwise empty.
- `branch`, in order:
  1. branch linked to the issue: `gh issue develop --list {id} -R {repo}` (first in the list);
  2. branch of the PR that closes the issue: `closedByPullRequestsReferences[0]` →
     `gh pr view <n> -R {repo} --json headRefName`;
  3. convention `{git.branch_prefix[type]}{id}` (or `issue.branch_field`, if the config defines it).

### 2. read_blueprint(id)  → the issue's `body` (= `fetch().description`).

### 3. transition(id, target)
- `sel = config.tracker.status[target]`.
- Labels: remove the stage labels of the **other** logical statuses present on the issue and add
  `sel.label` (if any), in one call:
  `gh issue edit {id} -R {repo} --remove-label <l1> --remove-label <l2> --add-label {sel.label}`.
- State: `sel.state == closed` and issue open → `gh issue close {id} -R {repo}`;
  `sel.state == open` and issue closed → `gh issue reopen {id} -R {repo}`.
- Label missing in the repository → create it first: `gh label create {label} -R {repo}` (without overwriting).

### 4. comment(id, md)
`gh issue comment {id} -R {repo} --body-file -` (native Markdown, passed via standard input).

### 5. create_child_bug(task, title, md)
```bash
gh issue create -R {repo} --title "{title}" --body-file - --label bug --parent {task}
```
- `--parent` makes the bug a **sub-issue of the task** (not of the epic).
- No sub-issue support → create without `--parent` and comment on the task `Related bug: #<n>`; the bug's body
  starts with `Related to #{task}`.
- Return the created number (the URL `gh` prints ends with it).

### 6. label(id, target)  → `gh issue edit {id} -R {repo} --add-label {config.tracker.labels[target]}`.

---

## Authoring ops (PO factory)
**Extra keys:** `tracker.repo`. GitHub assigns the number (no manual next-id).

### A. create_epic(slug, title, body, meta)
- `gh issue create -R {repo} --title "{title}" --body-file - --label factory-generated` plus
  `--type {tracker.epic_type}` if configured, otherwise `--label epic`.
- Return `epic_ref` = number.

### B. create_story(title, body, meta)
- `gh issue create -R {repo} --title "{title}" --body-file - --parent {meta.epic_ref} --label factory-generated`
  (+ `--label complexity:{x}` when there is a complexity).
- No sub-issues → create without `--parent`; the link is kept by the epic's table (op D) and by
  `Epic: #{epic_ref}` at the top of the body.
- Return `story_ref` = number.

### C. link_dependency(story_ref, depends_on_ref)
- `gh issue edit {story_ref} -R {repo} --add-blocked-by {depends_on_ref}` (GitHub shows the inverse,
  "blocking", on the other issue).
- No native dependency → append `Depends on #{depends_on_ref}` to the story's body and
  `Blocks #{story_ref}` to the dependency's body.

### D. update_epic(epic_ref, stories[])
- Rewrite only the stories section of the epic's body (read with `gh issue view --json body`, edit,
  `gh issue edit {epic_ref} -R {repo} --body-file -`): table `| # | Title | Complexity | Depends on |`
  with `#<n>` on each row. Sub-issues already show up in the epic's panel; the table guarantees the index
  even without sub-issues.
