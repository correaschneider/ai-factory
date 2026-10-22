# SCM Driver — GitLab (glab CLI)

Where the MRs live. **Read-only on the repo** (never checks out / never switches the local branch).

**Config keys:** `scm.repos` (map `backend|frontend → {repo}` in the format `group/project`), `scm.mr_target`
(target branch to filter by, e.g. `beta`), `scm.branch_convention` (e.g. `CU-{id}`), `scm.exclude_branch_suffix` (optional, e.g. `-hml`).
**Access:** authenticated `glab` (`glab auth status`). The plugin never reads a credential file: it only uses the CLI.

---

### S1. find_mrs(task)
1. **By link:** scan `task.description` + comments (the tracker's `fetch`/`comment` already bring the text) for:
   - URLs `https://gitlab.com/<group/project>/-/merge_requests/<iid>`
   - short refs `!<iid>` (resolve the project from the context/name mentioned).
2. **Fallback by branch** (if there is no link): derive the source branch via `scm.branch_convention` (e.g. `CU-{task.id}`)
   and list the open MRs in **each** repo of `scm.repos`:
   ```bash
   glab mr list --source-branch "<branch>" --repo <group/project>   # already filters open by default
   ```
3. **Filter:** keep only the MRs with `target_branch == config.scm.mr_target`. Confirm with `glab mr view`.
   Exclude the twin branch whose `source_branch` ends in `scm.exclude_branch_suffix` (e.g. with suffix `-hml`, ignore `feat-123-hml`, the twin that goes to the staging branch).
4. Return `[{repo, iid, url, source_branch, target_branch, state, title}]` (backend, frontend, or both).

### S2. mr_view(repo, iid)
```bash
glab mr view <iid> --repo <repo>                 # metadata + state
glab mr view <iid> --repo <repo> -F json | jq -r .state   # programmatic state
```
CR **only** runs if `state == opened`. `merged`/`closed` → skip (record as skipped).

### S3. mr_diff(repo, iid) — **read-only, no checkout**
Prefer the MR's own diff (changes nothing locally):
```bash
glab mr diff <iid> --repo <repo>
```
Alternative (diff against the merge-base, if you need more local context, still without switching branches):
`git fetch <remote> <source_branch>` → `git diff $(git merge-base <remote>/<target> FETCH_HEAD) FETCH_HEAD`.

### S4. mr_comment(repo, iid, md)
```bash
glab mr note <iid> --repo <repo> -m "<markdown>"   # GitLab accepts native markdown
```

## Access prerequisite
`glab` on the PATH and authenticated. Minimum allowlist: `glab mr list|view|diff|note`, `git fetch|diff|log|show|merge-base`.
