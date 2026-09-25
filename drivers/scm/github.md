# SCM Driver — GitHub (gh CLI)

Onde vivem os PRs. **Read-only sobre o repo** (nunca faz checkout / nunca troca branch local).
Terminologia: "MR" do contrato = **PR** no GitHub.

**Config keys:** `scm.repos` (mapa `backend|frontend → {repo}` no formato `org/repo`), `scm.mr_target`
(branch base p/ filtrar, ex.: `develop`), `scm.branch_convention`, `scm.exclude_branch_suffix` (opcional).
**Acesso:** `gh` autenticado (`gh auth status`). O plugin nunca lê arquivo de credencial: usa só a CLI.

---

### S1. find_mrs(task) → find PRs
1. **Por link:** varra `task.description` + comentários por URLs `https://github.com/<org/repo>/pull/<n>` e refs `#<n>`.
2. **Fallback por branch:** derive por `scm.branch_convention` e liste PRs abertos em cada repo:
   ```bash
   gh pr list --head "<branch>" --repo <org/repo> --state open --json number,headRefName,baseRefName,url,title,state
   ```
3. **Filtrar:** manter só `baseRefName == config.scm.mr_target`; excluir gêmea com `scm.exclude_branch_suffix`.
4. Retornar `[{repo, iid: number, url, source_branch: headRefName, target_branch: baseRefName, state, title}]`.

### S2. mr_view(repo, iid)
```bash
gh pr view <n> --repo <repo> --json state,title,headRefName,baseRefName,url
```
CR só roda se `state == OPEN`. `MERGED`/`CLOSED` → pular.

### S3. mr_diff(repo, iid) — **read-only, sem checkout**
```bash
gh pr diff <n> --repo <repo>
```

### S4. mr_comment(repo, iid, md)
```bash
gh pr comment <n> --repo <repo> --body "<markdown>"
```

## Pré-requisito de acesso
`gh` autenticado. Allowlist mínima: `gh pr list|view|diff|comment`, `git fetch|diff|log|show|merge-base`.
