# Tracker Driver — ClickUp (ClickUp MCP)

**Config keys:** `list_id` (lista onde vivem as tasks), `status{}` no formato **nome do status** (string,
match case-insensitive exato que o ClickUp exige), `labels{}` (tags), `issue.branch_field`.
**Acesso:** ClickUp MCP (`mcp__clickup__clickup_*`).
**Capabilities:** ClickUp tem status arbitrários por lista → status lógico = **nome do status** (igual Jira).
Tags fazem papel de label. Sem sub-issue por padrão → `create_child_bug` = task nova na mesma lista + link.
⚠️ O ClickUp **não deriva a branch** da chave (o id da task não vira branch): a branch sai de
`issue.branch_field` (ex.: `CU-{id}`) — ver `fetch`.

---

### 1. fetch(id)
- `mcp__clickup__clickup_get_task` (task_id=id, `include:["description"]`). `title`=`name`, `description`, `assignee`=`assignees[0]`.
- `type` = heurística: task com tag/label `bug` → bug, senão story.
- `status_lógico` = casar `status` (string do ClickUp) contra `config.tracker.status` (match case-insensitive).
- `branch` = convenção de `config.scm.branch_convention` aplicada ao id (ex.: `CU-{id}`) — **não** derivável do prefixo da chave.
- `linked_mr` = varrer `description` + `mcp__clickup__clickup_get_task_comments` por URLs/refs de MR (a fábrica CR usa isto em `find_mrs`).

### 2. read_blueprint(id) → `fetch().description`.

### 3. transition(id, alvo)
- `alvo_status = config.tracker.status[alvo]` (nome exato do status na lista).
- `mcp__clickup__clickup_update_task` (task_id=id, `status: alvo_status`).
- ⚠️ Antes de mover, se o comando precisar do status anterior (rollback), capture `fetch().status_lógico` primeiro.

### 4. comment(id, md) → `mcp__clickup__clickup_create_comment` (⚠️ **`entity_type: "task"` + `entity_id: id`**, NÃO `task_id`; `comment_text=md`). ClickUp renderiza markdown.

### 5. create_child_bug(task, title, md)
- `mcp__clickup__clickup_create_task` na mesma lista (`list_id`), name=title, markdown_description=md, tag `bug`.
- Ligar à task: `mcp__clickup__clickup_add_task_link` (ou dependência) → task ↔ novo bug. Retornar o novo id.

### 6. label(id, alvo) → `mcp__clickup__clickup_add_tag_to_task` (task_id=id, tag=`config.tracker.labels[alvo]`).

---

## Ops de autoria (fábrica PO) — opcional
Se a fábrica PO rodar com ClickUp: `create_epic`/`create_story` via `clickup_create_task` (épico = task com tag
`epic`; story = task ligada por `clickup_add_task_link`). `link_dependency` = `clickup_add_task_dependency`.
`update_epic` = editar `markdown_description` do épico com o checklist de stories. IDs são atribuídos pelo ClickUp.

## Pré-requisito
Servidor ClickUp MCP conectado. Descobrir `list_id`/nomes de status válidos: `clickup_get_task` com
`expand_statuses:true` devolve `available_statuses` da lista — use pra validar os nomes do config no passo 0.
