# SCM Driver — GitHub (gh CLI)

Where the PRs live. **Read-only on the repo** (never checks out / never switches the local branch).
Terminology: the contract's "MR" = **PR** on GitHub.

**Config keys:** `scm.repos` (map `backend|frontend → {repo}` in the format `org/repo`), `scm.mr_target`
(base branch to filter by, e.g. `develop`), `scm.branch_convention`, `scm.exclude_branch_suffix` (optional).
**Access:** authenticated `gh` (`gh auth status`). The plugin never reads a credential file: it only uses the CLI.

---

### S1. find_mrs(task) → find PRs
1. **By link:** scan `task.description` + comments for URLs `https://github.com/<org/repo>/pull/<n>` and refs `#<n>`.
2. **Fallback by branch:** derive it via `scm.branch_convention` and list the open PRs in each repo:
   ```bash
   gh pr list --head "<branch>" --repo <org/repo> --state open --json number,headRefName,baseRefName,url,title,state
   ```
3. **Filter:** keep only `baseRefName == config.scm.mr_target`; exclude the twin with `scm.exclude_branch_suffix`.
4. Return `[{repo, iid: number, url, source_branch: headRefName, target_branch: baseRefName, state, title}]`.

### S2. mr_view(repo, iid)
```bash
gh pr view <n> --repo <repo> --json state,title,headRefName,baseRefName,url
```
CR only runs if `state == OPEN`. `MERGED`/`CLOSED` → skip.

### S3. mr_diff(repo, iid) — **read-only, no checkout**
```bash
gh pr diff <n> --repo <repo>
```

### S4. mr_comment(repo, iid, md)
```bash
gh pr comment <n> --repo <repo> --body "<markdown>"
```

## Access prerequisite
Authenticated `gh`. Minimum allowlist: `gh pr list|view|diff|comment`, `git fetch|diff|log|show|merge-base`.
