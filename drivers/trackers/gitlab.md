# Tracker Driver — GitLab (GitLab MCP)

**Config keys:** `project_path` (ou via remote), `status{}` no formato `{state, label?}`, `labels{}`,
`git.branch_prefix`.
**Acesso:** GitLab MCP.
**Capabilities:** GitLab não tem status arbitrário → status lógico = `state` (opened/closed)
**+ label de estágio** (obrigatória p/ distinguir `qa_gate` de `in_qa`, já que ambos são `opened`).
Sem sub-issue nativo → `create_child_bug` = issue relacionada + link.
⚠️ As labels de estágio (`qa_gate.label`, `in_qa.label`) são **mutuamente exclusivas**: `transition`
remove as outras de estágio ao aplicar a nova.

---

### 1. fetch(id)
- GitLab MCP: get issue por `iid`. `title`, `description`, `assignee`.
- `type` = por label `bug`→bug, senão story (heurística; se o projeto não rotula tipo, default story).
- `status_lógico` = casar `{state, label}` da issue contra `config.tracker.status` pelo seletor **mais
  específico** (o que exige label vence). Ex.: opened+`ready-for-qa`→`qa_gate`; opened+`qa-iniciada`→`in_qa`; closed→`done`.
- `branch` = MR ligada à issue (source branch); senão convenção `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → `issue.description`. = `fetch().description`.

### 3. transition(id, alvo)
- `sel = config.tracker.status[alvo]` (`{state, label?}`).
- Ajustar `state` (open/close) se diferente. Se `sel.label`: **remover** as labels de estágio dos
  outros status lógicos e **adicionar** `sel.label`.

### 4. comment(id, md)  → criar **note** no issue (GitLab aceita markdown nativo).

### 5. create_child_bug(task, title, md)
- Criar issue (`title`, `description=md`, label `bug`). Ligar à task (related issue / `/relate`).
- Retornar `iid`.

### 6. label(id, alvo)  → adicionar `config.tracker.labels[alvo]`.

---

## Ops de autoria (fábrica PO)
**Chaves extras:** `project_path` (grupo/projeto onde criar). GitLab atribui o `iid` (sem next-id manual).
GitLab não tem "Epic" no tier free → o épico é uma **issue** com label `epic` (ou Milestone, se o projeto usar);
declare a escolha no config se divergir. Sub-issue inexistente → relação via **issue links**.

### A. create_epic(slug, title, body, meta)
- Criar issue (`title`, `description=body`, labels `[epic, factory-generated, …]`) em `project_path`.
  (Se o projeto usa GitLab Premium Epics, criar Epic nativo.) Retornar `epic_ref = iid`.

### B. create_story(title, body, meta)
- Criar issue (`title`, `description=body`, labels `[factory-generated, complexity::{x}, …]`).
- Ligar ao épico: issue link **relates_to** `meta.epic_ref` (ou campo Epic se nativo). Retornar `story_ref = iid`.

### C. link_dependency(story_ref, depends_on_ref)
- Criar issue link **blocks**: `depends_on_ref` *blocks* `story_ref` (GitLab mantém o inverso automaticamente).

### D. update_epic(epic_ref, stories[])
- Editar a description do épico: inserir checklist/tabela de stories (`- [ ] #iid Título`). Issues já ligadas aparecem em "Linked items".
