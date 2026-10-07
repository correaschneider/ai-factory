# Configuração

O `docs/factory.config.md` é um arquivo Markdown com um bloco YAML no topo (o *front-matter*) e notas livres
depois. O `/factory:init` gera a primeira versão; o time mantém e versiona junto com o código.

Chave ausente ou com valor `TBD` numa chave que a fábrica precisa faz a fábrica **parar** na ETAPA 0 e dizer
qual é.

## Exemplo completo

```yaml
---
project:  minha-app
company:  Minha Empresa
language: pt-BR

tracker:
  driver: gitlab                      # jira | clickup | gitlab | github | markdown
  project_path: grupo/minha-app       # chave do driver gitlab
  status:
    backlog:         { state: opened, label: backlog }
    in_progress:     { state: opened, label: doing }
    qa_gate:         { state: opened, label: ready-for-qa }   # diferente de in_qa
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
  repos: { backend: grupo/minha-app-api, frontend: grupo/minha-app-web }
  mr_target: develop
  branch_convention: 'feat/{slug}'

git:
  base_branch: origin/develop         # QA compara contra esta
  dev_base:    origin/develop         # DEV cria a branch a partir desta
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
  domain: "Plataforma de agendamento para clínicas"
  personas: [recepcionista, médico, paciente]
  competitors: []
  compliance: [LGPD]

dev:
  developer_split: true
  doc_sync_order: after_self_test     # before_review | after_self_test
  retries: 3
  commit: { by: pipeline, push: mr }  # by: pipeline | doc_sync · push: manual | mr

models:                               # opcional
  default: inherit
---

# Notas do projeto
- Particularidades, "não rodar X", armadilhas herdadas.
```

## Blocos

| Bloco | Para que serve | Quem usa |
|---|---|---|
| `project`, `company`, `language` | identificação e idioma dos artefatos | todas |
| `tracker` | driver, chaves do driver, mapa de status e labels lógicos | todas |
| `issue` | formato do id da task (`id_regex`, `prefix`, `id_format` no Markdown, `branch_field` quando a branch não deriva do id) | todas |
| `scm` | code host, repositórios, branch de destino dos MRs, convenção de branch | CR |
| `git` | branch base do QA, branch de onde a DEV sai, branches protegidas, formato de commit | DEV, QA |
| `workspace` | raiz e caminhos de backend e frontend, layout dos repositórios | todas |
| `stack` | framework, ORM, banco, testes, E2E (`cypress` ou `playwright`: escolhe o driver de E2E), comandos de build e lint | todas |
| `env` | URLs da aplicação e da API para smoke e E2E | QA |
| `docker` | como subir a stack e rodar os testes | DEV, QA |
| `evidence` | variáveis de evidência e onde ficam vídeos, screenshots e resultados | QA |
| `tests` | pasta, layout, helpers, papéis, seeder, script de smoke | QA |
| `docs_map` | onde está o CodeBase (mapas do código) e as convenções | PO, DEV, CR |
| `product` | domínio, personas, concorrentes, compliance | PO |
| `dev` | divisão back/front, posição do doc sync, tentativas, commit e push | DEV |
| `models` | modelo por papel | todas |

## Chaves obrigatórias por fábrica

=== "Todas"
    `project`, `company`, `tracker.driver`, `tracker.status.{qa_gate, in_qa, done}` (distintos),
    `tracker.labels.approved`, `issue.id_regex`, `git.base_branch`, `workspace.root`,
    `workspace.repos.{backend, frontend}.path`, mais as chaves do driver (`project_path` no GitLab, `repo` no GitHub,
    `cloud_id` e `project_key` no Jira, `board_path` no Markdown).

=== "PO"
    `product.domain`, `product.personas`, `docs_map.codebase`, `stack.backend`, `stack.frontend` e as de
    autoria do driver (Markdown: `tracker.board_path`, `epic_folder`, `story_folder`, `issue.id_format`).

=== "DEV"
    `tracker.status.{backlog, in_progress, qa_gate}` (distintos),
    `git.{dev_base, protected, branch_prefix, commit_format, remote}`, `workspace.{root, repos}`,
    `stack.{backend, frontend}.build`, `docs_map.codebase`,
    `dev.{developer_split, doc_sync_order, retries, commit.by, commit.push}`.

=== "QA"
    `tests.dir`, `tests.layout.{backend, frontend}`, `stack.backend.test`, `stack.frontend.e2e`,
    `env.{app_url, api_url}`, `docker.run`, `docker.ensure_up`,
    `evidence.{mode_var, slowmo_var, slowmo, resolution}`, `evidence.artifacts.*`.

=== "CR"
    `tracker.status.{review_gate, in_review, review_approved, review_returned}` (`review_gate` diferente de
    `in_review`), `scm.driver`, `scm.repos`, `scm.mr_target`, `scm.branch_convention`, `workspace.root`,
    `stack`, `docs_map.codebase`.

## Pegadinhas

- **`git.dev_base` e `git.base_branch` podem ser diferentes.** A DEV cria a branch a partir de `dev_base`;
  o QA compara contra `base_branch`. Se forem iguais no seu fluxo, repita o valor.
- **Portões distintos.** `qa_gate` ≠ `in_qa` e `review_gate` ≠ `in_review`, sempre.
- **Opcionais úteis:** `docker.run_frontend` (roda o frontend separado e em paralelo), `tests.smoke_script`,
  `tests.seeder`, `dev.self_test.pre_migrate_stash`, `stack.frontend.lint`, `scm.exclude_branch_suffix`.
