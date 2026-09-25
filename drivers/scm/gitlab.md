# SCM Driver — GitLab (glab CLI)

Onde vivem os MRs. **Read-only sobre o repo** (nunca faz checkout / nunca troca branch local).

**Config keys:** `scm.repos` (mapa `backend|frontend → {repo}` no formato `grupo/projeto`), `scm.mr_target`
(branch alvo p/ filtrar, ex.: `beta`), `scm.branch_convention` (ex.: `CU-{id}`), `scm.exclude_branch_suffix` (opcional, ex.: `-hml`).
**Acesso:** `glab` autenticado (token no `~/.config/glab-cli/config.yml`).

---

### S1. find_mrs(task)
1. **Por link:** varra `task.description` + comentários (o `fetch`/`comment` do tracker já traz o texto) por:
   - URLs `https://gitlab.com/<grupo/projeto>/-/merge_requests/<iid>`
   - refs curtas `!<iid>` (resolver o projeto pelo contexto/nome citado).
2. **Fallback por branch** (se nenhum link): derive a source branch por `scm.branch_convention` (ex.: `CU-{task.id}`)
   e liste os MRs abertos em **cada** repo de `scm.repos`:
   ```bash
   glab mr list --source-branch "<branch>" --repo <grupo/projeto>   # já filtra open por padrão
   ```
3. **Filtrar:** manter só os MRs com `target_branch == config.scm.mr_target`. Confirme com `glab mr view`.
   Excluir a branch-gêmea `source_branch` terminada em `scm.exclude_branch_suffix` (ex.: com sufixo `-hml`, ignorar `feat-123-hml`, a gêmea que vai pra branch de homologação).
4. Retornar `[{repo, iid, url, source_branch, target_branch, state, title}]` (backend, frontend, ou ambos).

### S2. mr_view(repo, iid)
```bash
glab mr view <iid> --repo <repo>                 # metadados + state
glab mr view <iid> --repo <repo> -F json | jq -r .state   # state programático
```
CR **só** roda se `state == opened`. `merged`/`closed` → pular (registrar como pulado).

### S3. mr_diff(repo, iid) — **read-only, sem checkout**
Preferir o diff do próprio MR (não altera nada local):
```bash
glab mr diff <iid> --repo <repo>
```
Alternativa (diff contra o merge-base, se precisar de mais contexto local, ainda sem trocar de branch):
`git fetch <remote> <source_branch>` → `git diff $(git merge-base <remote>/<target> FETCH_HEAD) FETCH_HEAD`.

### S4. mr_comment(repo, iid, md)
```bash
glab mr note <iid> --repo <repo> -m "<markdown>"   # GitLab aceita markdown nativo
```

## Pré-requisito de acesso
`glab` no PATH e autenticado. Allowlist mínima: `glab mr list|view|diff|note`, `git fetch|diff|log|show|merge-base`.
