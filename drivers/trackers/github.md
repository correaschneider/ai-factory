# Tracker Driver — GitHub Issues (gh CLI)

**Config keys:** `tracker.repo` (`owner/repo`; ausente → o remote `origin`), `status{}` no formato
`{state, label?}` com `state` ∈ `open|closed`, `labels{}`, `git.branch_prefix`. Opcional:
`tracker.epic_type` (nome do *issue type* usado para épico, ex.: `Epic`; ausente → label `epic`).
**Acesso:** `gh` autenticada (`gh auth status`), numa versão que tenha as flags `--parent` e `--add-blocked-by` (confira em `gh issue create --help`). O plugin
nunca lê arquivo de credencial: usa só a CLI. Sem `gh`, o servidor MCP do GitHub serve para as mesmas
chamadas.
**Capabilities:** GitHub não tem status arbitrário → status lógico = `state` (open/closed) **+ label de
estágio** (obrigatória para distinguir `qa_gate` de `in_qa`, ambos `open`). Tem **sub-issues** e
**dependências** ("blocked by") nativos; onde o repositório não tiver (GitHub Enterprise antigo, recurso
desligado), o fallback é **referência cruzada** no corpo das duas issues.
⚠️ As labels de estágio são **mutuamente exclusivas**: `transition` remove as dos outros status lógicos
ao aplicar a nova.

Em todo comando abaixo, `-R {repo}` com `repo = config.tracker.repo`.

---

### 1. fetch(id)
```bash
gh issue view {id} -R {repo} --json number,title,body,state,labels,assignees,parent,closedByPullRequestsReferences,issueType
```
- `type` = `bug` se tiver a label `bug` (ou `issueType.name == "Bug"`), senão `story`.
- `status_lógico` = casar `{state, labels}` contra `config.tracker.status` pelo seletor **mais específico**
  (o que exige label vence). Ex.: open+`ready-for-qa`→`qa_gate`; open+`in-qa`→`in_qa`; closed→`done`.
- `parent_id` = `parent.number` (sub-issue de um épico), senão vazio.
- `branch`, na ordem:
  1. branch ligada à issue: `gh issue develop --list {id} -R {repo}` (primeira da lista);
  2. branch do PR que fecha a issue: `closedByPullRequestsReferences[0]` →
     `gh pr view <n> -R {repo} --json headRefName`;
  3. convenção `{git.branch_prefix[type]}{id}` (ou `issue.branch_field`, se o config definir).

### 2. read_blueprint(id)  → `body` da issue (= `fetch().description`).

### 3. transition(id, alvo)
- `sel = config.tracker.status[alvo]`.
- Labels: remover as labels de estágio dos **outros** status lógicos presentes na issue e adicionar
  `sel.label` (se houver), numa chamada:
  `gh issue edit {id} -R {repo} --remove-label <l1> --remove-label <l2> --add-label {sel.label}`.
- Estado: `sel.state == closed` e issue aberta → `gh issue close {id} -R {repo}`;
  `sel.state == open` e issue fechada → `gh issue reopen {id} -R {repo}`.
- Label inexistente no repositório → criar antes: `gh label create {label} -R {repo}` (sem sobrescrever).

### 4. comment(id, md)
`gh issue comment {id} -R {repo} --body-file -` (Markdown nativo, passado pela entrada padrão).

### 5. create_child_bug(task, title, md)
```bash
gh issue create -R {repo} --title "{title}" --body-file - --label bug --parent {task}
```
- `--parent` faz o bug nascer como **sub-issue da task** (não do épico).
- Sem suporte a sub-issue → criar sem `--parent` e comentar na task `Bug relacionado: #<n>`; o corpo do bug
  começa com `Relacionado a #{task}`.
- Retornar o número criado (a URL que o `gh` imprime termina nele).

### 6. label(id, alvo)  → `gh issue edit {id} -R {repo} --add-label {config.tracker.labels[alvo]}`.

---

## Ops de autoria (fábrica PO)
**Chaves extras:** `tracker.repo`. O GitHub atribui o número (sem next-id manual).

### A. create_epic(slug, title, body, meta)
- `gh issue create -R {repo} --title "{title}" --body-file - --label factory-generated` mais
  `--type {tracker.epic_type}` se configurado, senão `--label epic`.
- Retornar `epic_ref` = número.

### B. create_story(title, body, meta)
- `gh issue create -R {repo} --title "{title}" --body-file - --parent {meta.epic_ref} --label factory-generated`
  (+ `--label complexity:{x}` quando houver complexidade).
- Sem sub-issue → criar sem `--parent`; a ligação fica pela tabela do épico (op D) e por
  `Épico: #{epic_ref}` no topo do corpo.
- Retornar `story_ref` = número.

### C. link_dependency(story_ref, depends_on_ref)
- `gh issue edit {story_ref} -R {repo} --add-blocked-by {depends_on_ref}` (o GitHub mostra o inverso,
  "blocking", na outra issue).
- Sem dependência nativa → acrescentar `Depende de #{depends_on_ref}` no corpo da story e
  `Bloqueia #{story_ref}` no corpo da dependência.

### D. update_epic(epic_ref, stories[])
- Reescrever só a seção de stories do corpo do épico (ler com `gh issue view --json body`, editar,
  `gh issue edit {epic_ref} -R {repo} --body-file -`): tabela `| # | Título | Complexidade | Depende de |`
  com `#<n>` em cada linha. As sub-issues já aparecem no painel do épico; a tabela garante o índice
  mesmo sem sub-issues.
