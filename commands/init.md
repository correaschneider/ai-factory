---
description: Factory Init — gera o docs/factory.config.md do projeto (detecta stack e tracker)
argument-hint: [caminho-do-projeto]
---
# Init Factory — Gerador do `docs/factory.config.md` (genérico/config-driven)

Detecta a stack e o tracker do projeto no diretório-alvo e **gera `docs/factory.config.md`** preenchido,
seguindo o schema do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`. É o passo que faltava: os commands `factory-*` mandam
"Rode `/factory:init`" quando o config não existe. Este command **cria** esse config — não inventa
valores: o que não conseguir inferir com segurança vira **`TBD`** (com comentário do porquê), e a
validação final reaponta cada `TBD` pra você completar.

## ALVO: $ARGUMENTS
Caminho do projeto. Vazio → use o **cwd**. O config sempre é gravado em `<alvo>/docs/factory.config.md`.

---

## ETAPA 0 — Pré-checagem (OBRIGATÓRIO)
1. Resolva `<alvo>` (arg ou cwd). Confirme que é um repositório (`<alvo>/.git` ou subpasta de um repo).
2. Se `<alvo>/docs/factory.config.md` **já existe** → mostre as 5 primeiras linhas e **PERGUNTE**:
   sobrescrever, atualizar só os `TBD`, ou abortar. Sem resposta clara → **PARE**.
3. Carregue `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` (fonte das chaves obrigatórias) e os drivers disponíveis
   (`ls ${CLAUDE_PLUGIN_ROOT}/drivers/trackers/*.md`). Nunca grave chave fora do schema do CONTRACT.

---

## ETAPA 1 — Detectar a stack (read-only)
Use `Glob`/`Grep`/`Read` (ou um sub-agent `Explore`) no `<alvo>`. **Inferir, não chutar** — sem
evidência clara, marque `TBD`.

- **Linguagem/framework/orm/test/build** (por repo):
  - `composer.json` + `artisan` → Laravel/PHP (orm Eloquent, test PHPUnit, pkg composer).
  - `package.json`: `@nestjs/*`→NestJS · `next`→Next.js · `@angular/core`→Angular.
    ORM: `prisma`→Prisma · `@mikro-orm`/`typeorm` idem · `waterline`→Waterline.
    Test: `vitest`/`jest` (dev-deps); E2E: `cypress`/`playwright`.
  - `build`: leia `scripts` do `package.json` (`build`/`lint`) ou os artisan equivalentes; preencha o
    comando real (ex.: `pnpm build`). Não souber o boot-check → `TBD`.
  - **Fora da lista acima → sugestão por evidência** (não deixe `TBD` mudo). Colete sinais e escolha o
    candidato mais forte:
    - `dependencies` de runtime (não dev-deps) cujo pacote é framework/ORM, cruzado com `scripts.start`/`dev`
      (o binário chamado ali costuma ser o framework) e com o `main`/entrypoint;
    - arquivos de config característicos na raiz do repo (`*.config.*`, `.<nome>rc`, `<nome>-cli.json`,
      pastas `config/`/`api/` com estrutura típica);
    - fora do Node: `pyproject.toml`/`requirements.txt`/`manage.py`, `Gemfile`, `pom.xml`/`build.gradle`,
      `go.mod`, `Cargo.toml` → dependência principal declarada ali.
    Grave como `TBD   # sugestão: "<Framework>" — evidência: <arquivo:chave>, <arquivo:chave>`. **Mínimo 2
    evidências independentes** pra sugerir; com 1 só → `TBD   # candidato fraco: <nome> (<evidência>)`;
    com 0 → `TBD   # sem evidência`. Mesma regra vale pra `orm`, `test`, `e2e` e `build`.
- **Package manager:** `pnpm-lock.yaml`→pnpm · `yarn.lock`→yarn · `package-lock.json`→npm · `composer.lock`→composer.
- **Layout / repos** (`workspace.layout` + `workspace.repos.{backend,frontend}.path`):
  `.gitmodules`→`monorepo-submodule` · `projects/*` ou pastas separadas→`multi-repo` · um app só→`single`.
  Ache os paths de backend/frontend relativos a `workspace.root`.
- **Docker:** `docker-compose.yml`/`compose.yaml` (raiz ou por repo). Extraia nomes de container/serviço e
  portas pra `docker.*` e `env.{app_url,api_url}`. Sem stack local subível → `docker.ensure_up: false`.
- **Git:** branch default (`git -C <alvo> symbolic-ref --short refs/remotes/origin/HEAD` ou `git remote show origin`)
  → `git.base_branch`/`git.dev_base` (repita o valor se coincidirem; **não assuma que são iguais** — ver CONTRACT).
  `git.remote` (default `origin`); `protected` = branches permanentes que achar (`main`/`master`/`develop`/`dev`/release globs).
- **Docs/convenções:** ache a pasta de CodeBase (`docs/`, `docs/backend|frontend|shared`) → `docs_map.codebase`;
  convenções (`docs/conventions`) → `docs_map.conventions`.

---

## ETAPA 2 — Tracker (driver + mapeamento)
1. **Detectar candidato:** remote contém `gitlab`→`gitlab` · `.gitlab-ci.yml` idem · pasta kanban de MDs
   (ex.: `tasks/{todo,in-progress,em-qa,done}`)→`markdown` · projeto Jira conhecido→`jira`.
2. **CONFIRME com o humano** o driver (é a escolha de maior impacto — não decida sozinho se houver dúvida).
   Tracker que ainda não tem driver = criar `drivers/trackers/<nome>.md` (modelo B) — avise, não improvise no config.
3. Preencha as chaves do driver (ver CONTRACT) e o **mapa de status lógico**:
   - `gitlab` → `project_path`; status = `{state, label?}`; **`qa_gate` ≠ `in_qa`** (mesma `state` + label distinta).
   - `jira` → `cloud_id`, `project_key`; status = nome nativo (`qa_gate:"PR"`, `in_qa:"Em QA"`, `done:"Done"`).
   - `markdown` → `board_path`, `epic_folder`, `story_folder`, `backlog_folder`; status = `{folder, label?}`;
     `issue.id_format` (ex.: `APP-%03d`). `qa_gate`/`in_qa` podem dividir folder se a label os distinguir.
   - **Regra crítica (CONTRACT):** `qa_gate` e `in_qa` DEVEM resolver pra seletores **distintos**. Se colapsarem → `TBD`.
4. `issue.{prefix,id_regex}` (+ `id_format` no markdown; `branch_field` se a branch **não** deriva da chave).
5. `tracker.labels.approved` é obrigatória; demais (`needs_human`, `upstream_bug`, `generated`...) quando o fluxo usar.

---

## ETAPA 2.5 — Confirmar sugestões (antes de gravar)
Se a ETAPA 1 produziu `# sugestão:`/`# candidato fraco:`, **pergunte ao humano numa só rodada**
(`AskUserQuestion`, uma pergunta por chave, até 4 por rodada): opção 1 = a sugestão (com a evidência na
descrição), opção 2 = o candidato alternativo se houver; "Other" permite digitar. Resposta confirmada →
grava o **valor concreto** (sem `TBD`). Sem resposta / "não sei" → mantém `TBD` **com o comentário de
sugestão** (a ETAPA 0 das fábricas mostra a sugestão ao parar).

---

## ETAPA 3 — Gerar `docs/factory.config.md`
`mkdir -p <alvo>/docs`. Escreva o front-matter YAML no schema do CONTRACT, **nesta ordem** (omita blocos
sem sentido pro projeto, mas mantenha os obrigatórios). Todo valor inferido vai concreto; o resto é
`TBD   # por quê`. Esqueleto:

```yaml
---
# ════════════════════ FACTORY CONFIG — <Projeto> ════════════════════
project:   <slug>
company:   <empresa>
language:  pt-BR

tracker:
  driver:   <gitlab|jira|markdown|...>
  # + chaves do driver (project_path | cloud_id+project_key | board_path+epic/story_folder)
  status:
    backlog:     <seletor>     # só obrigatório p/ fábrica DEV
    in_progress: <seletor>     # idem
    qa_gate:     <seletor>     # handoff DEV→QA — DISTINTO de in_qa
    in_qa:       <seletor>     # DISTINTO de qa_gate
    done:        <seletor>
  labels: { approved: <label> }

issue:    { prefix: "<P->", id_regex: '<regex>' }   # +id_format/branch_field conforme driver

git:
  base_branch: <origin/...>    # QA faz diff contra isto
  dev_base:    <origin/...>    # DEV ramifica disto (pode == base_branch — repita)
  protected:   [ ... ]
  branch_prefix: { story: 'feat/', bug: 'fix/' }
  commit_format: '<...>'
  remote: origin

workspace:
  root:   <abs ou .>
  layout: <single|multi-repo|monorepo-submodule>
  repos:  { backend: { path: <...> }, frontend: { path: <...> } }

stack:
  backend:  { framework: "<...>", orm: <...>, db: <...>, pkg: <...>, test: "<...>", build: '<...>' }
  frontend: { framework: "<...>", ui: "<...>", e2e: <Cypress|...>, build: '<...>', lint: '<...>' }
  arch_notes_doc: <...>

env:    { app_url: <...>, api_url: <...> }

docker:
  compose:   <docker compose | arquivo>
  ensure_up: <true|false>      # false se a app é remota
  run:       '<comando de teste>'
  # run_frontend: '<...>'      # presente → back/front rodam separados

evidence:
  mode_var: EVIDENCE_MODE
  slowmo_var: SLOW_MO
  slowmo: 500
  resolution: 1920x1080
  artifacts: { videos: <...>, screenshots: <...>, backend_result: <...>, frontend_result: <...> }

tests:
  dir: <...>
  layout: { backend: '<...>', frontend: '<...>' }
  # backend_helpers / frontend_cmds / roles / seeder / smoke_script conforme o projeto

docs_map: { codebase: <docs...>, conventions: <...> }

product:                       # contexto p/ fábrica PO
  domain: "<...>"
  personas:    []
  competitors: []
  compliance:  []

dev:                           # mecânica da fábrica DEV
  developer_split: <true|false>
  doc_sync_order:  after_self_test
  retries:         3
  commit: { by: doc_sync, push: <mr|push> }

# models:                      # opcional — omitido = padrões do plugin (CONTRACT → "Modelos por papel")
#   default: inherit           # nível 1 fable · nível 2 opus · nível 3 sonnet
#   dev.developer: opus
---

# Notas do projeto
- <quirks, inconsistências herdadas, "não rodar X", etc.>
```

---

## ETAPA 4 — Validar e reportar (mesmo critério da ETAPA 0 das fábricas)
1. Releia o config gerado e confira as **chaves obrigatórias do `factory.config.md`** (CONTRACT):
   `project`, `company`, `tracker.driver`, `tracker.status.{qa_gate,in_qa,done}` (**distintos!**),
   `tracker.labels.approved`, `issue.id_regex`, `git.base_branch`, `workspace.root`,
   `workspace.repos.{backend,frontend}.path`, `tests.dir`, `tests.layout.{backend,frontend}`,
   `stack.backend.test`, `stack.frontend.e2e`, `env.{app_url,api_url}`, `docker.{run,ensure_up}`,
   `evidence.{mode_var,slowmo_var,slowmo,resolution}`, `evidence.artifacts.*`
   (+ extras do driver: jira→`cloud_id,project_key`; markdown→`board_path`; gitlab→`project_path`).
2. Liste, por fábrica, o que ainda falta pra cada uma rodar limpa:
   - **PO:** `product.{domain,personas}`, `docs_map.codebase`, `stack.{backend,frontend}`, autoria do tracker.
   - **DEV:** `tracker.status.{backlog,in_progress,qa_gate}`, `git.{dev_base,protected,branch_prefix,commit_format,remote}`,
     `workspace.{root,repos}`, `stack.*.build`, `docs_map.codebase`, `dev.*`.
   - **QA:** chaves de `docker`/`evidence`/`tests` acima (E2E configurado? senão marque QA como adiada).
3. **Relatório final:**
```markdown
## Init Factory — {project} — {data}
Config: <alvo>/docs/factory.config.md  (criado|atualizado)
| Bloco | Status |
|-------|--------|
| Stack detectada | ✅ <resumo> |
| Tracker | ✅ driver=<...> (ou ⚠️ confirmar) |
| TBD pendentes | <N> → <lista de chaves> |
| Sugestões | <N confirmadas> gravadas · <M pendentes> ficaram `TBD # sugestão` → <chave: valor sugerido> |
### Pronto pra rodar
- PO: <sim | falta X>   · DEV: <sim | falta Y>   · QA: <sim | adiada: falta Z>
### Próximo passo
- Preencher os TBD e rodar `/factory:po` (ou `/factory:dev`) no projeto.
```

## REGRAS
- **Nunca invente** valor de tracker/branch/url só pra "fechar" o config — `TBD` com motivo é melhor que errado.
- Sugestão **não é valor**: só vira concreto com confirmação humana (ETAPA 2.5); sem ela, fica no comentário do `TBD`.
- Só grava chaves do schema do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`; tracker sem driver → avisar (criar `drivers/trackers/<nome>.md`), não forçar.
- `qa_gate` e `in_qa` **sempre distintos** (senão a ETAPA 0 das fábricas re-roda task em andamento).
- Detecção é **read-only**; a única escrita é `docs/factory.config.md` (+ `mkdir -p docs`).
- Em dúvida relevante (driver, base_branch vs dev_base, ensure_up), **pergunte** em vez de assumir.
