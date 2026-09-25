# Models per role

Each worker runs on the model best suited to its kind of work. The **orchestrator** resolves the model and passes it
when spinning up each worker.

## Defaults

| Level | Kind of work | Roles | Model |
|---|---|---|---|
| 1 | **judgment**: decisions that are costly to get wrong | `dev.tech_lead`, `dev.code_reviewer`, `cr.security`, `po.blueprint`, `qa.planner` | `fable` |
| 2 | **volume**: lots of code or lots of reading | `dev.developer`, `qa.backend`, `qa.frontend`, `po.researcher`, `po.codemap`, `cr.reviewer` | `opus` |
| 3 | **mechanical**: run, report, make targeted edits | `dev.self_test`, `dev.doc_sync`, `qa.runner`, `po.tasks` | `sonnet` |

## Resolution order

The first one that exists wins:

1. `--model <role>=<value>` in the run's arguments;
2. `models.<role>` in `factory.config.md`;
3. `models.default`, if it is different from `inherit`;
4. the plugin default (table above).

```yaml
models:
  default: inherit        # no effect: each role's default applies
  dev.developer: fable    # in this project, the developer goes up one level
  qa.runner: haiku        # and the runner goes down
```

```text
/factory:dev APP-012 --model dev.developer=fable --model dev.tech_lead=opus
```

## Rules

- Valid values: `fable`, `opus`, `sonnet`, `haiku` and `inherit`. Any other value makes the factory stop at
  STEP 0.
- They are **aliases**: they always track the newest version of each model, with no need to edit the config.
- The **orchestrator's** model is not configurable: it is the one from your session. It is already running when it reads the
  config.
