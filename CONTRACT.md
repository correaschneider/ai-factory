# Factory Contract — schema do config, ops dos drivers, chaves obrigatórias e modelos

> `{plugin}` = raiz do plugin `factory`: nos commands é `${CLAUDE_PLUGIN_ROOT}`; nos workers vem no prompt
> do orquestrador como `Plugin: <caminho>`.

Todo comando da fábrica fala com o issue-tracker **apenas** por estas operações abstratas.
Nenhum comando sabe se é Jira, GitLab, CRM, etc. — ele chama a operação e o **driver**
(selecionado por `config.tracker.driver`) traduz pra chamada real.

> **Regra de ouro:** se você está editando um *comando* pra suportar um tracker, está errado.
> Tracker novo = **novo `drivers/trackers/<nome>.md`** + `tracker.driver: <nome>` no config. Nada mais.

---

## Gramática de substituição (como o comando lê o config)

- `{config.<caminho.pontilhado>}` — ex.: `{config.git.base_branch}`.
- Mapas por chave: `{config.workspace.repos.backend.path}` (repos é **mapa** `backend|frontend`, não lista).
- **Proibido** deixar placeholder literal no output. Se uma chave estiver ausente ou com valor
  `TBD`, o comando **PARA** (ver "Chaves obrigatórias").
  Ao parar, **mostre o comentário da linha** se houver (`# sugestão: ...` / `# candidato fraco: ...`,
  gerado pelo `/factory:init`) — o humano confirma e preenche em vez de investigar do zero.

---

## Nomes lógicos (resolvidos via config, nunca hardcoded no driver)

- **Status lógicos:** `backlog`, `in_progress`, `qa_gate`, `in_qa`, `done` → `config.tracker.status.<lógico>`
  (ciclo de vida completo: PO cria em `backlog` → DEV move `backlog`→`in_progress`→`qa_gate` → QA move `qa_gate`→`in_qa`→`done`).
  `backlog`/`in_progress` só são obrigatórios p/ a fábrica DEV; `qa_gate` é o **ponto de handoff** DEV→QA.
- **Status lógicos da fábrica CR** (code review de MR/PR): `review_gate` (task pronta pra CR — entrada),
  `in_review` (CR em andamento), `review_approved` (aprovado → **avança**), `review_returned` (reprovado → **retorna**)
  → `config.tracker.status.<lógico>`. `review_gate` e `in_review` DEVEM ser seletores distintos (mesma regra do
  `qa_gate`×`in_qa`). Só obrigatórios p/ a fábrica CR.
- **Labels lógicas:** `approved`, `auto`, `generated`, `needs_human`, `upstream_bug` → `config.tracker.labels.<lógico>`
- **Tipos de issue:** `bug` | `story`

### Resolução de status (regra crítica)
`config.tracker.status.<lógico>` resolve pra um **seletor de backend**, cuja forma depende do driver:

| driver | forma do seletor | exemplo |
|--------|------------------|---------|
| jira | nome do status (string) | `qa_gate: "PR"` |
| gitlab | `{ state: opened\|closed, label?: <stage> }` | `qa_gate: {state: opened, label: ready-for-qa}` |
| github | `{ state: open\|closed, label?: <stage> }` | `qa_gate: {state: open, label: ready-for-qa}` |
| markdown | `{ folder: <pasta>, label?: <stage> }` | `in_qa: {folder: em-qa, label: qa-iniciada}` |

**REGRA:** `qa_gate` e `in_qa` **DEVEM** resolver pra seletores **distintos** (nome distinto, ou
mesmo state/folder + label distinta). É proibido colapsar os dois no mesmo valor — senão o gate da
ETAPA 0 não distingue "pronta pra QA" de "já em QA" e re-roda task em andamento.
No `fetch`, o driver retorna o status lógico pelo seletor **mais específico** que casar (o que tem label vence).

---

## Operações (as que a fábrica QA usa)

| # | Operação | Entrada | Saída / Efeito |
|---|----------|---------|----------------|
| 1 | `fetch(id)` | id | `Task{ id, title, type, status_lógico, parent_id?, branch?, linked_mr?, description, assignee? }` |
| 2 | `read_blueprint(id)` | id | spec/blueprint. **Default = `fetch().description`**; op separada só se o spec vive fora da description |
| 3 | `transition(id, alvo)` | id, status **lógico** | leva a issue ao seletor de `config.tracker.status[alvo]` (troca state/folder e/ou label, removendo labels de estágio conflitantes) |
| 4 | `comment(id, md)` | id, markdown | adiciona comentário (driver converte markdown→formato do backend) |
| 5 | `create_child_bug(task, title, md)` | **id da task em QA**, título, corpo | cria bug **ligado à task** (relação "relates/linked", NÃO filho do épico) → retorna `new_id` |
| 6 | `label(id, alvo)` | id, label **lógica** | aplica `config.tracker.labels[alvo]` |

**`branch`/`linked_mr`:** `fetch` DEVE devolver a branch de dev da task (o pipeline faz `diff`/`pull`).
Cada driver declara como resolve (convenção do tipo `{prefix}{id}`, MR ligada, ou campo no card).
⚠️ Quando a branch **não** é derivável da chave (ex.: ClickUp com branch `CU-{clickup_id}`), o driver lê do
campo apropriado — o comando nunca assume `{prefix}{id}`.

> Ops de outros comandos (fora do piloto): `assign`, `query_backlog`. Mesmo padrão.

---

## Ops de autoria (fábrica PO — `po-tasks`)

O `po-tasks` cria Epic + Stories no tracker por estas ops. O driver traduz: **markdown** = arquivos
no kanban (`board_path`); **gitlab/github/jira** = Issues no servidor.

| # | Operação | Entrada | Saída / Efeito |
|---|----------|---------|----------------|
| A | `create_epic(slug, title, body, meta)` | slug, título, corpo, `{labels}` | cria o épico/iniciativa → `epic_ref` |
| B | `create_story(title, body, meta)` | título, corpo (= bloco completo do blueprint), `{epic_ref, depends_on[], labels[], complexity, priority}` | cria a story (type=story) ligada ao épico → `story_ref` (inclui `id`) |
| C | `link_dependency(story_ref, depends_on_ref)` | dois refs | registra a dependência **recíproca** (markdown: `blocks[]`/`depends_on[]`; gitlab/jira: link relates/blocks; github: "blocked by" nativo) |
| D | `update_epic(epic_ref, stories[])` | épico + lista de stories | atualiza o índice/tabela de stories no épico |

**Como o driver resolve id e local:**
- markdown → id sequencial via `issue.id_format` (varre `board_path` pelo maior número); grava em
  `tracker.epic_folder` (épico) e `tracker.story_folder` (stories).
- gitlab/github/jira → id atribuído pelo servidor; grava no `project_path`/`repo`/`project_key`; link nativo de issues.

**Chaves obrigatórias da fábrica PO (validar no ETAPA 0 do `/factory:po`):**
`product.{domain,personas}` (+ `competitors`/`compliance` quando o domínio exigir) — researcher;
`docs_map.codebase` — codemap; `stack.{backend,frontend}` — blueprint;
tasks: markdown→`tracker.{board_path,epic_folder,story_folder}` + `issue.id_format`; gitlab→`project_path`; github→`tracker.repo`.

---

## Chaves obrigatórias da fábrica DEV (validar no ETAPA 0 do `/factory:dev`)
`tracker.status.{backlog,in_progress,qa_gate}` (distintos!); `git.{dev_base,protected,branch_prefix,commit_format,remote}`;
`workspace.{root,repos}`; `stack.{backend,frontend}.build`; `docs_map.codebase`;
`dev.{developer_split,doc_sync_order,retries,commit.{by,push}}`. Opcionais: `dev.self_test.pre_migrate_stash`,
`stack.frontend.lint`, `tests.seeder`.

> **`git.dev_base` ≠ `git.base_branch`:** a fábrica DEV cria a branch a partir de `git.dev_base` (ex.:
> ramificar de `origin/beta`); o QA faz o diff contra `git.base_branch` (ex.: `origin/dev`). Coincidiram
> (PHCS: ambos `develop`) → repita o valor; não assuma que são iguais.

> **Transição no DEV:** o `/factory:dev` usa `tracker.transition` com `in_progress` (ao iniciar) e `qa_gate`
> (handoff p/ QA). Nenhuma op nova de driver — `transition` já cobre (são só mais status lógicos).

---

## Eixo SCM (code host) — fábrica CR

A task vive no **tracker**; os MRs/PRs vivem no **code host** (SCM). Podem ser sistemas diferentes
(ex.: task no **ClickUp** + MR no **GitLab**). Por isso a fábrica CR tem um **2º eixo**:
o driver de SCM em `config.scm.driver` traduz as ops de MR abaixo (arquivos em `drivers/scm/<nome>.md`).
Quando tracker e code host são o mesmo sistema (ex.: PHCS = GitLab Issues + MR), `scm.driver` pode
apontar pro mesmo backend — continuam sendo eixos separados no config.

> **Mesma regra de ouro:** code host novo = **novo `drivers/scm/<nome>.md`** + `scm.driver: <nome>`. Nenhum comando muda.

| # | Operação | Entrada | Saída / Efeito |
|---|----------|---------|----------------|
| S1 | `find_mrs(task)` | `Task` (do `fetch`) | lista de MRs abertos com `target == config.scm.mr_target`. Fontes: (a) URLs/refs no `task.description` + comentários; (b) **fallback** por convenção de branch `config.scm.branch_convention` (varre `config.scm.repos`). Exclui a branch-gêmea `config.scm.exclude_branch_suffix`. → `[{repo, iid, url, source_branch, target_branch, state, title}]` |
| S2 | `mr_view(repo, iid)` | repo, iid | metadados + `state` (open/merged/closed). CR só roda em `open`. |
| S3 | `mr_diff(repo, iid)` | repo, iid | diff unificado do MR (vs merge-base com o target). **Read-only — nunca faz checkout** (não altera branch local). |
| S4 | `mr_comment(repo, iid, md)` | repo, iid, markdown | posta comentário/nota **no próprio MR** (≠ `comment` do tracker, que é na task). |

**Chaves obrigatórias da fábrica CR** (validar no passo 0; faltou/`TBD` → PARAR):
`tracker.driver`; `tracker.status.{review_gate,in_review,review_approved,review_returned}` (review_gate≠in_review);
`scm.driver`; `scm.repos` (mapa); `scm.mr_target`; `scm.branch_convention`; `workspace.root`;
`stack.{backend,frontend}` (só o que o projeto tiver — deriva o checklist de review); `docs_map.codebase` (detectar duplicação).
Opcionais: `scm.exclude_branch_suffix`; `tracker.labels.{approved,needs_human}`.

---

## O que cada driver DEVE declarar
1. **`Config keys`** que lê. 2. **`Capabilities`** + **fallback** quando falta equivalente nativo
   (ex.: sem sub-issue → bug irmão + link). 3. **Pré-requisito de acesso** (MCP/CLI/API).

## Mínimo viável
Serve qualquer tracker que cumpra as 6 ops (com fallback aceitável) **e** tenha meio programático
(MCP/CLI/API). `qa_gate` e `in_qa` precisam ser **representáveis distintamente** — se o backend não
tem status nativos, use uma **label/stage** discriminadora declarada no config.

---

## Chaves obrigatórias do `factory.config.md` (validar no passo 0; faltou/`TBD` → PARAR)
`project`, `company`, `tracker.driver`, `tracker.status.{qa_gate,in_qa,done}` (distintos!),
`tracker.labels.approved`, `issue.id_regex`, `git.base_branch`,
`workspace.root`, `workspace.repos.{backend,frontend}.path`,
`tests.dir`, `tests.layout.{backend,frontend}`, `stack.backend.test`, `stack.frontend.e2e`,
`env.{app_url,api_url}`, `docker.run`, `docker.ensure_up`, `evidence.{mode_var,slowmo_var,slowmo,resolution}`,
`evidence.artifacts.{videos,screenshots,backend_result,frontend_result}`.
(Drivers exigem chaves extras próprias: jira→`cloud_id,project_key`; markdown→`tracker.board_path`; github→`tracker.repo`.)

**Chaves opcionais do runner:** `docker.run_frontend` (presente → back/front são comandos separados rodados
em paralelo; ausente → `docker.run` é o pipeline completo); `tests.smoke_script` (ausente → smoke por login +
1 endpoint); `tests.seeder` (usado no migrate/seed só quando `docker.ensure_up: true`).

---

## Modelos por papel (`models`, opcional)

Cada worker roda num modelo resolvido pelo **orquestrador**, nesta ordem (o primeiro que existir vence):
1. `--model <papel>=<valor>` nos argumentos da execução (override pontual);
2. `config.models.<papel>` no `factory.config.md`;
3. `config.models.default`, se ≠ `inherit`;
4. o **padrão do plugin** (tabela abaixo; nos agents da DEV é o `model:` do frontmatter).

O orquestrador passa o valor no parâmetro `model` ao subir cada worker. **O modelo do próprio orquestrador
não é configurável** — é o da sessão (`inherit`).

Valores válidos: `fable` · `opus` · `sonnet` · `haiku` · `inherit`. Só apelido (acompanha a versão mais
nova do modelo); qualquer outro valor → **PARE** na ETAPA 0 dizendo qual chave.

| Nível | Papéis (`<fábrica>.<papel>`) | Padrão |
|---|---|---|
| 1 — julgamento | `dev.tech_lead`, `dev.code_reviewer`, `cr.security`, `po.blueprint`, `qa.planner` | `fable` |
| 2 — volume | `dev.developer`, `qa.backend`, `qa.frontend`, `po.researcher`, `po.codemap`, `cr.reviewer` | `opus` |
| 3 — mecânico | `dev.self_test`, `dev.doc_sync`, `qa.runner`, `po.tasks` | `sonnet` |

```yaml
models:                 # opcional — omitido = padrões da tabela
  default: inherit
  dev.developer: fable
  qa.runner: haiku
```
