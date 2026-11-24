# /factory:start

Asks the factory to **introduce itself for the project you are in**: what each factory does, which ones are
ready here and the one command to run next.

```text
/factory:start
```

It only reads: no file is written, nothing changes in the tracker, no build or container runs.

## What it answers

| Project state | Answer |
|---|---|
| No `docs/factory.config.md` | what the PO, DEV, QA and CR factories do, and where to start: `/factory:demo` (a sample project, about 2 minutes) or `/factory:init` (set up this project) |
| With config | which factories are ready and, for those that are not, the missing config keys; stories waiting in the backlog or for QA, when the tracker can be listed; recent initiatives; **one** next command |

The next command follows a fixed order: fill what blocks a factory → QA for a story waiting for it → DEV for a
story in the backlog → PO for a new initiative.

## When to run it

Right after installing the plugin, and whenever you open a project and want to know where it stands. The
plugin does not greet you on its own: it has no hooks, so `/factory:start` is the way in.
