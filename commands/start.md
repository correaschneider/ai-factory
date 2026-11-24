---
description: Factory start — what the factory can do in this project right now, and the next command to run
argument-hint: (no arguments)
---
# Factory Start — Welcome and next step (read-only)

Introduces the factory to the user **for the project they are in**: what each factory does, which ones are
ready here, and the one command to run next. **Read-only**: never writes a file, never calls a tracker op
that changes anything, never runs a build or a container.

**Output language:** `language` from `docs/factory.config.md` when it exists; otherwise the language the user
is writing in; otherwise the system locale (`$LANG`). These instructions are in English; the output is not.

---

## STEP 1 — Read the project's state (fast, no sub-agents)
1. **Plugin version:** `version` in `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`.
2. **Config:** does `docs/factory.config.md` exist in the current directory?
   - No → state **A** (not configured). Also check whether the directory looks like a code project (a git repo,
     `package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `pom.xml`…) or is empty/unrelated.
   - Yes → read it and, per factory, check its required keys exactly as in `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`
     (PO, DEV, QA, CR). A key missing or `TBD` = that factory is not ready; keep the key names to show them.
3. **Work in progress (state B only, best effort):** when the tracker is reachable without side effects
   (`markdown` → list `board_path`; `github` → `gh issue list`; `gitlab` → `glab issue list`; MCP drivers →
   skip unless the MCP is already connected), count the stories in `backlog` and in `qa_gate`, and pick at most
   3 ids of each. Any error or slow call → skip this item silently; it is a hint, not a requirement.
4. **Initiatives:** list `docs/initiatives/*/` with the newest artifact of each (at most 3, newest first).

## STEP 2 — Answer (short; fits one screen)

### State A — not configured
```
Hello! I'm the Factory (v{version}). I turn an idea into tasks, tasks into code, and code into tested,
reviewed work — using your own tracker and your own stack.

  /factory:po  <initiative>  triage, then a brief, a plan or a full study, and the Stories in the tracker
  /factory:dev <task>        from the task to the QA handoff: plan, code, review, build check
  /factory:qa  <task>        test plan, backend and E2E tests, evidence, bugs when it fails
  /factory:cr  <task>        review and security audit of the task's MRs/PRs

This folder has no factory config yet. Start with:
  /factory:demo    see it working on a sample project (about 2 minutes, nothing to set up)
  /factory:init    set up this project (detects the stack, the tracker and git)
```
- Folder is not a code project → recommend only `/factory:demo` and say `/factory:init` runs inside a project.

### State B — configured
```
Hello! The Factory (v{version}) is set up for {config.project} ({tracker.driver} · {stack summary}).

| Factory | Ready? | Missing |
| PO  | ✅ / ⚠️ | <keys> |
| DEV | … | … |
| QA  | … | … |
| CR  | … | … |

{work in progress, if found: "3 stories in backlog (#107, #108, #109) · 1 waiting for QA (#91)"}
{recent initiatives, if any}

Next: <one command, chosen below>
```
**Choosing "Next"** (first rule that applies):
1. A factory the user is likely to need is not ready → the config key to fill, or `/factory:init` to refresh it.
2. A story waiting for QA → `/factory:qa <id>`.
3. A story in backlog → `/factory:dev <id>`.
4. Otherwise → `/factory:po <initiative>`, with one line on depth: the triage suggests `lean`, `standard` or
   `deep`, and `--depth` forces one.

End with one line: `Docs: https://correaschneider.github.io/ai-factory/`.

## RULES
- **Read-only.** No writes, no transitions, no comments, no containers, no network beyond the tracker listing.
- Never print a credential or a config value marked secret; key **names** only.
- No sub-agents; this answer must come back in seconds.
- Do not repeat the whole documentation: the tables above are the maximum.
