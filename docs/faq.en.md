# FAQ

## Does the factory work with my stack?

Probably. Nothing in the commands is framework-specific: the vocabulary (migration, controller, entity,
component) and the commands (build, tests, E2E) come from the config's `stack`. `/factory:init` recognizes
Laravel, NestJS, Next.js and Angular out of the box; other stacks it detects from evidence and asks.

## And with my tracker?

Jira, ClickUp, GitLab Issues and GitHub Issues have a ready-made driver, and the `markdown` driver works with no tracker at all. Any other
system needs a [new driver](reference/drivers.md): a Markdown file, without touching the commands.

## Do I need to use all four factories?

No. Each one runs on its own, as long as the task is in its entry status. You can use only CR to
review MRs, or only QA to test what the team developed by hand.

## Does the factory push or merge on its own?

- **Push:** only if the config says so. With `dev.commit.push: manual` DEV doesn't push; with `mr` it opens the
  Merge Request.
- **Merge:** never. Approving is a human decision; the CR factory recommends, and you approve or reject.
- **Fixed guarantees:** no factory commits to a protected branch, and none does `push --force`.

## What happens when the agent doesn't know something?

It doesn't guess. In the DEV factory the agent returns `BLOCKED` with the question, and the orchestrator asks you.
In the others, the rule is the same: whatever is unclear becomes a question. A config with `TBD` makes the factory stop
before it starts.

## How much does it cost to run?

It depends on the size of the task and on the models. Each step is an agent with its own context, and the judgment
roles use the strongest model. To save, downgrade roles in `models:` in the config or for a single
run with `--model`. See [Models per role](reference/models.md).

## What data does the plugin read and where does it go?

The plugin is just text: it has no server, hooks or code of its own. It asks Claude Code to read the
repository, talk to the tracker and code host that **you** configured and run the commands from your config
(build, tests, docker, git). Nothing goes anywhere else. Details in the
[privacy policy](https://github.com/correaschneider/ai-factory#privacidade).

## Should the artifacts in `docs/initiatives/` go into git?

Yes, recommended. They explain why the code is the way it is: research, blueprint decisions, technical plan,
reviews and the QA result. The video evidence can be left out if it gets heavy.

## Where do I report a problem?

In [issues on GitHub](https://github.com/correaschneider/ai-factory/issues).
