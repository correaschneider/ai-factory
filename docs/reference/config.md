# Configuration

`docs/factory.config.md` is a Markdown file with a YAML block at the top (the *front-matter*) and free-form notes
after it. `/factory:init` generates the first version; the team maintains it and versions it along with the code.

A missing key, or a key set to `TBD`, that the factory needs makes the factory **stop** at STEP 0 and tell you
which one it is.

## Full example

```yaml
---
project:  my-app
company:  My Company
language: en-US

tracker:
  driver: gitlab                      # jira | clickup | gitlab | github | markdown
  project_path: group/my-app          # gitlab driver key
  status:
    backlog:         { state: opened, label: backlog }
    in_progress:     { state: opened, label: doing }
    qa_gate:         { state: opened, label: ready-for-qa }   # different from in_qa
    in_qa:           { state: opened, label: in-qa }
    done:            { state: closed }
    review_gate:     { state: opened, label: ready-for-review }
    in_review:       { state: opened, label: reviewing }
    review_approved: { state: opened, label: review-ok }
    review_returned: { state: opened, label: changes-requested }
  labels:
    approved:  qa-approved
    generated: factory-generated

issue:
  prefix: "#"
  id_regex: '^#?\d+$'

scm:
  driver: gitlab                      # gitlab | github
  repos: { backend: group/my-app-api, frontend: group/my-app-web }
  mr_target: develop
  branch_convention: 'feat/{slug}'

git:
  base_branch: origin/develop         # QA compares against this one
  dev_base:    origin/develop         # DEV creates the branch from this one
  protected:   [main, develop]
  branch_prefix: { story: 'feat/', bug: 'fix/' }
  commit_format: '{type}({key}): {mensagem}'
  remote: origin

workspace:
  root: .
  layout: multi-repo                  # single | multi-repo | monorepo-submodule
  repos:
    backend:  { path: projects/backend }
    frontend: { path: projects/frontend }

stack:
  backend:  { framework: "NestJS 12", orm: Prisma, db: PostgreSQL, pkg: pnpm,
              test: "Vitest", build: 'pnpm build' }
  frontend: { framework: "Next.js 16", ui: "MUI", e2e: cypress,
              build: 'pnpm build', lint: 'pnpm lint' }

env:    { app_url: http://localhost:3000, api_url: http://localhost:4000 }

docker:
  compose: docker compose
  ensure_up: true
  run: 'docker compose run --rm tests'

evidence:
  mode_var: EVIDENCE_MODE
  slowmo_var: SLOW_MO
  slowmo: 500
  resolution: 1920x1080
  artifacts: { videos: tests/videos, screenshots: tests/screenshots,
               backend_result: tests/backend.xml, frontend_result: tests/frontend.xml }

tests:
  dir: tests
  layout: { backend: 'tests/backend/{feature}', frontend: 'tests/e2e/{feature}' }
  roles: [admin, user]

docs_map: { codebase: docs, conventions: docs/conventions }

product:
  domain: "Scheduling platform for clinics"
  personas: [receptionist, doctor, patient]
  competitors: []
  compliance: [LGPD]

dev:
  developer_split: true
  doc_sync_order: after_self_test     # before_review | after_self_test
  retries: 3
  commit: { by: pipeline, push: mr }  # by: pipeline | doc_sync · push: manual | mr

models:                               # optional
  default: inherit
---

# Project notes
- Quirks, "don't run X", inherited pitfalls.
```

## Blocks

| Block | What it is for | Used by |
|---|---|---|
| `project`, `company`, `language` | identification and language of the artifacts | all |
| `tracker` | driver, driver keys, logical status and label map | all |
| `issue` | task id format (`id_regex`, `prefix`, `id_format` in Markdown, `branch_field` when the branch doesn't derive from the id) | all |
| `scm` | code host, repositories, MR target branch, branch convention | CR |
| `git` | QA base branch, branch DEV starts from, protected branches, commit format | DEV, QA |
| `workspace` | root and paths of backend and frontend, repository layout | all |
| `stack` | framework, ORM, database, tests, E2E (`cypress` or `playwright`: picks the E2E driver), build and lint commands | all |
| `env` | application and API URLs for smoke and E2E | QA |
| `docker` | how to bring up the stack and run the tests | DEV, QA |
| `evidence` | evidence variables and where videos, screenshots and results go | QA |
| `tests` | folder, layout, helpers, roles, seeder, smoke script | QA |
| `docs_map` | where the CodeBase (code maps) and the conventions are | PO, DEV, CR |
| `product` | domain, personas, competitors, compliance | PO |
| `dev` | back/front split, doc sync position, attempts, commit and push | DEV |
| `models` | model per role | all |

## Required keys per factory

=== "All"
    `project`, `company`, `tracker.driver`, `tracker.status.{qa_gate, in_qa, done}` (distinct),
    `tracker.labels.approved`, `issue.id_regex`, `git.base_branch`, `workspace.root`,
    `workspace.repos.{backend, frontend}.path`, plus the driver keys (`project_path` in GitLab, `repo` in GitHub,
    `cloud_id` and `project_key` in Jira, `board_path` in Markdown).

=== "PO"
    `product.domain`, `product.personas`, `docs_map.codebase`, `stack.backend`, `stack.frontend` and the driver's
    authoring keys (Markdown: `tracker.board_path`, `epic_folder`, `story_folder`, `issue.id_format`).

=== "DEV"
    `tracker.status.{backlog, in_progress, qa_gate}` (distinct),
    `git.{dev_base, protected, branch_prefix, commit_format, remote}`, `workspace.{root, repos}`,
    `stack.{backend, frontend}.build`, `docs_map.codebase`,
    `dev.{developer_split, doc_sync_order, retries, commit.by, commit.push}`.

=== "QA"
    `tests.dir`, `tests.layout.{backend, frontend}`, `stack.backend.test`, `stack.frontend.e2e`,
    `env.{app_url, api_url}`, `docker.run`, `docker.ensure_up`,
    `evidence.{mode_var, slowmo_var, slowmo, resolution}`, `evidence.artifacts.*`.

=== "CR"
    `tracker.status.{review_gate, in_review, review_approved, review_returned}` (`review_gate` different from
    `in_review`), `scm.driver`, `scm.repos`, `scm.mr_target`, `scm.branch_convention`, `workspace.root`,
    `stack`, `docs_map.codebase`.

## Gotchas

- **`git.dev_base` and `git.base_branch` can be different.** DEV creates the branch from `dev_base`;
  QA compares against `base_branch`. If they are the same in your flow, repeat the value.
- **Distinct gates.** `qa_gate` ≠ `in_qa` and `review_gate` ≠ `in_review`, always.
- **Useful optional keys:** `docker.run_frontend` (runs the frontend separately and in parallel), `tests.smoke_script`,
  `tests.seeder`, `dev.self_test.pre_migrate_stash`, `stack.frontend.lint`, `scm.exclude_branch_suffix`.
