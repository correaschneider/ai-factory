# Getting started

## Prerequisites

- **Claude Code** installed.
- **A git repository** for the project, with backend, frontend or both.
- **Access to the tracker** where the tasks live:
    - Jira, ClickUp or GitLab: the tracker's MCP server configured in Claude Code;
    - `markdown` driver: nothing, the tasks are files in the repository itself.
- **The code host CLI**, if you are going to use the CR factory: `glab` (GitLab) or `gh` (GitHub), already authenticated.
- **Docker**, if the QA factory is going to bring up the local stack to run the tests.

## 1. Install the plugin

```bash
claude plugin marketplace add correaschneider/ai-factory
```

```bash
claude plugin install factory@ai-factory
```

Open a new Claude Code session. The commands show up as `/factory:init`, `/factory:po`,
`/factory:dev`, `/factory:qa` and `/factory:cr`.

!!! tip "Updating later"
    `claude plugin marketplace update ai-factory` followed by `claude plugin update factory@ai-factory`.
    The new version takes effect from the next session.

## 2. Generate the project config

Inside the repository:

```text
/factory:init
```

`/factory:init` reads the project (lockfiles, `package.json`, `composer.json`, `docker-compose`, git remote,
docs folders) and writes `docs/factory.config.md`. Whatever it cannot infer safely is marked as `TBD`,
with the reason next to it. When it has a guess backed by evidence (for example, a framework outside the
known list), it asks before writing.

Review the file, fill in the `TBD`s and **commit it**: the config is part of the project and applies to the whole team.

!!! warning "The rule that trips people up the most"
    The `qa_gate` (ready for QA) and `in_qa` (QA in progress) statuses must be **different** in your
    tracker. If they are the same, the factory cannot tell a task waiting for QA from one already being tested.
    The same applies to `review_gate` and `in_review` in the CR factory.

## 3. Run an initiative end to end

```text
/factory:po Login with Google
```

The PO factory researches how the market solves the problem, maps what already exists in the code, writes the
blueprint and creates **1 Epic + 1 Story per feature** in the tracker. Everything goes into
`docs/initiatives/login-with-google/`.

Review the blueprint and the stories. Then, one story at a time:

```text
/factory:dev APP-012
```

The DEV factory plans, implements, reviews, validates the build and moves the task to `qa_gate`. If the
team's flow has code review on MR/PR:

```text
/factory:cr APP-012
```

And, finally:

```text
/factory:qa APP-012
```

The QA factory writes and runs the tests, records the evidence and closes the task, or opens bugs linked to it.

## 4. Choose the models (optional)

Each role has a default model (judgment on `fable`, volume on `opus`, mechanical tasks on `sonnet`).
To change it for a single run only:

```text
/factory:dev APP-012 --model dev.developer=fable
```

Or permanently for the project, in the `models:` block of the config. Details in
[Models per role](reference/models.md).
