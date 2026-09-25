# Tracker Driver — Markdown kanban (filesystem)

**Config keys:** `tracker.board_path`, `tracker.backlog_folder` (onde criar bug novo, ex.: `todo`),
`status{}` no formato `{folder, label?}`, `labels{}`, `issue.id_format`, `issue.branch_field`.
**Acesso:** filesystem (nenhum MCP).
**Capabilities:** tudo via arquivo. ⚠️ Sem lock de concorrência (assume 1 editor por vez).
Quando `qa_gate` e `in_qa` usam a **mesma pasta**, distinguem-se por **label de estágio** no frontmatter.

---

### 1. fetch(id)
- `find {board_path} -name "{id}-*.md"` → guardar a pasta atual `<atual>`.
- Parsear frontmatter (`id, title, type, parent, assignee, labels`) + corpo.
- `status_lógico` = casar `{folder=<atual>, label∈frontmatter.labels}` contra `config.tracker.status`
  pelo seletor **mais específico** (o que exige label vence).
- `branch` = `frontmatter[{config.issue.branch_field}]` se existir (ex.: `clickup_id` → `CU-{valor}`);
  senão convenção `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → corpo do `.md`. = `fetch().description`.

### 3. transition(id, alvo)
- `sel = config.tracker.status[alvo]` (`{folder, label?}`). Resolver `<atual>` via find (passo 1).
- Se `sel.folder` ≠ `<atual>`: `mv {board_path}/<atual>/{id}-*.md {board_path}/{sel.folder}/`.
- Se `sel.label`: remover labels de estágio dos outros status e adicionar `sel.label` no frontmatter.

### 4. comment(id, md)  → append `\n\n## Comentário ({timestamp})\n{md}` (timestamp vem do ambiente).

### 5. create_child_bug(task, title, md)
- Novo id via `config.issue.id_format` (varrer ids existentes p/ próximo número).
- Escrever em `{board_path}/{config.tracker.backlog_folder}/{new_id}-{slug}.md` com frontmatter
  `parent: {task}`, `type: bug`, corpo `md`. Retornar `new_id`.

### 6. label(id, alvo)  → adicionar `config.tracker.labels[alvo]` em `labels:` do frontmatter.

---

## Ops de autoria (fábrica PO)
**Chaves extras:** `tracker.epic_folder` (ex.: `epics`), `tracker.story_folder` (ex.: `todo`), `issue.id_format`.

### A. create_epic(slug, title, body, meta)
- Escrever `{board_path}/{epic_folder}/EPIC-{slug}.md` com frontmatter `type: epic, slug, status: active,
  labels: [factory-generated, …]` + corpo. Retornar `epic_ref = EPIC-{slug}`.

### B. create_story(title, body, meta)
- `id` = próximo via `issue.id_format` (varrer `board_path` por `^id:` → maior número +1).
- Escrever `{board_path}/{story_folder}/{id}-{slug}.md` com frontmatter `id, type: story, status: todo,
  epic: {meta.epic_ref}, depends_on: {meta.depends_on}, blocks: [], complexity, priority,
  branch: {git.branch_prefix.story}{id}, labels: [factory-generated, …]` + corpo = bloco do blueprint.
- Retornar `story_ref = {id}` (+ caminho).

### C. link_dependency(story_ref, depends_on_ref)
- No arquivo de `depends_on_ref`, adicionar `story_ref` ao `blocks: []` (recíproco do `depends_on`).
- Validar ausência de ciclo.

### D. update_epic(epic_ref, stories[])
- Editar `EPIC-{slug}.md`: preencher a seção `## Stories` com tabela `| ID | Título | Complexidade | Status | Dependências |` (links relativos).
