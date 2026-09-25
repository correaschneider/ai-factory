# Drivers

A driver is a Markdown file that teaches the factory how to talk to a system. There are two axes:

- **tracker** (`drivers/trackers/`): where the tasks live; chosen by `tracker.driver`;
- **SCM** (`drivers/scm/`): where the MRs/PRs live, used by the CR factory; chosen by `scm.driver`.

## Included drivers

| Driver | Axis | Access | Shape of the status in the config |
|---|---|---|---|
| `jira` | tracker | Atlassian MCP server | status name: `qa_gate: "PR"` |
| `clickup` | tracker | ClickUp MCP server | status name: `in_qa: "em qa"` |
| `gitlab` | tracker | GitLab MCP server | state + label: `{state: opened, label: ready-for-qa}` |
| `github` | tracker | `gh` CLI, authenticated (or the GitHub MCP server) | state + label: `{state: open, label: ready-for-qa}` |
| `markdown` | tracker | files only, no MCP | folder + label: `{folder: em-qa, label: qa-iniciada}` |
| `gitlab` | SCM | authenticated `glab` CLI | — |
| `github` | SCM | authenticated `gh` CLI | — |

The `markdown` driver turns a repository folder into a kanban: each task is a file, each column is
a folder. It is useful for projects without a tracker or for testing the factory.

## Tracker operations

| Operation | Input | Effect |
|---|---|---|
| `fetch(id)` | id | returns `{id, title, type, status_lógico, parent_id, branch, linked_mr, description, assignee}` |
| `read_blueprint(id)` | id | the task's specification; by default, the description itself |
| `transition(id, target)` | id, logical status | takes the task to the `tracker.status[target]` selector, changing state, folder or labels |
| `comment(id, md)` | id, Markdown | comments; the driver converts the Markdown to the system's format |
| `create_child_bug(task, title, md)` | task, title, body | creates a bug **linked to the task** and returns the id |
| `label(id, target)` | id, logical label | applies `tracker.labels[target]` |
| `create_epic` · `create_story` · `link_dependency` · `update_epic` | — | authoring of epics and stories (PO factory) |

Two details every driver handles:

- **Branch.** `fetch` must return the task's development branch. Each driver declares how: by
  convention from the id, through the linked MR or through a task field. The factory never assumes the format.
- **The most specific status wins.** If two selectors match (same state, one with a label), `fetch` returns
  the one with the label.

## SCM operations

| Operation | Effect |
|---|---|
| `find_mrs(task)` | open MRs targeting `scm.mr_target`: first through the task's links, then through the branch convention; excludes the twin branch |
| `mr_view(repo, iid)` | metadata and state (open, merged, closed) |
| `mr_diff(repo, iid)` | unified diff against the target, **without checkout** |
| `mr_comment(repo, iid, md)` | comments on the MR (unlike the tracker's `comment`, which is on the task) |

## Writing a new driver

A new tracker is **a new file**, no command changes:

1. Create `drivers/trackers/<name>.md` (or `drivers/scm/<name>.md`).
2. Declare three things:
    - the **config keys** the driver reads (for example, `tracker.workspace_id`);
    - the **capabilities** and the **fallback** for each operation without a native equivalent (no sub-issue, for
      example: a sibling bug with a link);
    - the **access prerequisite**: which MCP, CLI or API must be configured.
3. Show, for each operation, the real call (MCP tool, CLI command) and how the result becomes the
   contract format.
4. Use `tracker.driver: <name>` in the project config.

**Minimum viable:** the system must fulfill the six QA operations (with an acceptable fallback), have programmatic
access (MCP, CLI or API) and be able to represent `qa_gate` and `in_qa` distinctly, even if only
through a label.

The existing drivers in
[`drivers/`](https://github.com/correaschneider/ai-factory/tree/main/drivers) serve as a model.
