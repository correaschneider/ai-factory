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

## The greeting after installing or updating

Claude Code has no "just installed" event, so the plugin uses a `SessionStart` hook that runs when a session
starts and stays quiet almost always:

- **first session after installing:** one line, *"Factory vX installed. Type /factory:start…"*;
- **first session after a new minor or major version:** one line with what is new in it;
- **every other session, and patch updates:** nothing.

The line reaches you through two channels, because not every client shows hook messages: the CLI shows the
hook's own message at the top of the session, and the hook also asks Claude to add that one line at the end of
its **first reply** of the session (the desktop app shows only this one). Later replies never repeat it.

The hook (`hooks/greet.sh`, plain bash) keeps only the last greeted version, in the plugin's own data folder
(`$CLAUDE_PLUGIN_DATA`, removed on uninstall). No network, no telemetry. The message follows `language` from
the project's config, or the system locale.
