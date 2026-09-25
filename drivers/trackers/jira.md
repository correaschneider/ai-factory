# Tracker Driver — Jira (Atlassian MCP)

**Config keys:** `cloud_id`, `project_key`, `status{qa_gate,in_qa,done}` (nomes de status),
`transitions{}` (fallback id), `labels{}`, `fields{}`, `forms{}`, `git.branch_prefix`.
**Acesso:** MCP `mcp__claude_ai_Atlassian__*`.
**Capabilities:** todas nativas. Status nativos distintos (sem precisar de label discriminadora).
Link de bug via `createIssueLink` (relação "Relates", não parent).

---

### 1. fetch(id)
- `getJiraIssue(cloud_id, id)`.
- `title=fields.summary`; `type` = (issuetype.name=="Bug" ? bug : story); `parent_id=fields.parent?.key`;
  `assignee=fields.assignee`; `description=fields.description` (ADF→markdown).
- `status_lógico` = reverse-lookup de `fields.status.name` em `config.tracker.status` (nomes são únicos).
- `branch` = da MR/branch ligada à issue (dev panel) se houver; senão **convenção** `{git.branch_prefix[type]}{id}`.

### 2. read_blueprint(id)  → `fields.description` (ADF→markdown). = `fetch().description`.

### 3. transition(id, alvo)
- `nome_destino = config.tracker.status[alvo]`.
- **SEMPRE** `getTransitionsForJiraIssue(id)` → achar transição cujo destino == `nome_destino`.
- **Fallback / desempate:** se a busca retornar **0 ou >1** candidatas, use o id de
  `config.tracker.transitions[alvo]`. Se ainda assim não houver transição válida a partir do status
  atual: **PARE** e reporte (não force).
- `transitionJiraIssue(id, transition_id)`.

### 4. comment(id, md)  → `addCommentToJiraIssue(cloud_id, id, body)`; converter **markdown→ADF** antes (o MCP espera ADF).

### 5. create_child_bug(task, title, md)
- `createJiraIssue(cloud_id, project_key, issuetype="Bug", summary=title, description=md(ADF))`.
- `createIssueLink(new_id, task, type="Relates")` — **ligado à task em QA**, não filho do épico.
- Retornar `new_id`.

### 6. label(id, alvo)  → `editJiraIssue(cloud_id, id, fields:{labels:[+ config.tracker.labels[alvo]]})`.
