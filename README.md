# factory — agent factories for Claude Code

Config-driven **agent factories** that take an idea from the roadmap to reviewed, tested code, with your task
tracker in the loop. Each factory is an assembly line with fixed steps, specialized agents in isolated
contexts and **stopping points where a human decides**.

📖 **Documentation (English / Português):** https://correaschneider.github.io/ai-factory/

## First 5 minutes

```bash
claude plugin marketplace add correaschneider/ai-factory
claude plugin install factory@ai-factory
```

Open a new Claude Code session and run:

```text
/factory:demo
```

It creates `./factory-demo` with a sample project, a Markdown kanban as the tracker and a ready config, then
runs the PO factory on a sample initiative: research, code map, blueprint, and an Epic with Stories in the
kanban. No tracker, MCP server or Docker needed.

When you want it on a real project, open the repository and run `/factory:init`.

## The factories

| Command | What it does |
|---|---|
| `/factory:demo [folder]` | Sample project + Markdown kanban, then the PO factory on a sample initiative |
| `/factory:init [path]` | Generates the project's `docs/factory.config.md` (detects stack, tracker and git) |
| `/factory:po <initiative>` | Research → code map → blueprint → Epic + Stories in the tracker |
| `/factory:dev <task>` | Tech lead → developer → code review → self-test → doc sync → QA handoff |
| `/factory:qa <task>` | Test plan → backend and E2E tests → run with evidence → done, or bugs |
| `/factory:cr <task>` | Review and security audit of the task's MRs/PRs, human verdict, comments and status |

Nothing is project-specific: everything comes from each repository's `docs/factory.config.md`, whose schema is
in [`CONTRACT.md`](CONTRACT.md). Drivers cover Jira, ClickUp, GitLab, GitHub and a Markdown kanban as trackers,
GitLab and GitHub as code hosts, and Cypress or Playwright for E2E.

**Language:** the plugin's instructions are in English; everything it writes (artifacts, tracker and MR
comments, messages) follows `language` in the config, for example `en` or `pt-BR`.

## Layout

```
commands/   orchestrators (what shows up in the menu)
agents/     DEV workers (factory:dev-*)
workers/    PO/QA/CR workers (read by path, not in the menu)
drivers/    trackers/{jira,clickup,gitlab,github,markdown} · scm/{gitlab,github} · e2e/{cypress,playwright}
CONTRACT.md config schema, abstract operations, required keys and models per role
```

To try a local clone without installing: `claude --plugin-dir /path/to/ai-factory`.

## What the plugin runs, sends and fetches

The plugin is text only (commands, agents and instructions in Markdown): no hooks, no MCP server, no scripts
of its own and no dependencies to install. Everything it does goes through Claude Code's own tools, under the
permissions the user configured, and always inside the project it runs in:

- **Reads and writes the project's repository:** reads `docs/factory.config.md` and the code; writes artifacts
  to `docs/initiatives/<name>/` (research, blueprint, plans and QA reports). The DEV factory edits code and may
  commit and push as the config says; the QA factory creates test files.
- **Runs local commands:** `git`, the code host CLIs `glab` (GitLab) and `gh` (GitHub), the build and tests
  defined in the config (`docker compose`, `pnpm`, `composer`, `phpunit`, `cypress`, `playwright`, etc.) and
  `curl` on the config's own `env.app_url`/`env.api_url`, for smoke tests.
- **Talks to the task tracker** the user configured (Jira, ClickUp, GitLab Issues or GitHub Issues), through the
  MCP server or CLI the user already installed: reads tasks, creates epics, stories and bugs, comments and changes
  status. With the `markdown` driver everything stays in files in the repository.
- **Comments on merge/pull requests** through `glab`/`gh`, in the CR factory, only after the human verdict.
- **Searches the web** (PO factory, market research step) with Claude Code's search tools.

No data goes anywhere other than the tracker and code host the user configured. Actions that change the
tracker or post MR comments go through the gates described in each command.

## Privacy

The plugin has no server, account or data collection of its own, and sends no data to the plugin author or to
third parties chosen by the author. Full text: [privacy policy](https://correaschneider.github.io/ai-factory/privacy/)
· [terms of use](https://correaschneider.github.io/ai-factory/terms/).

<a id="privacidade"></a>Questions or requests about privacy:
[github.com/correaschneider/ai-factory/issues](https://github.com/correaschneider/ai-factory/issues).

## License

MIT — see [LICENSE](LICENSE).
