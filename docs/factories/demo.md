# /factory:demo

The fastest way to see the factory working: **no tracker, no MCP server, nothing to configure**.

```text
/factory:demo [folder]
```

Without an argument it creates `./factory-demo`. It never writes into a folder that exists and is not empty.

## What it sets up

- **A sample project:** Notely, a personal notes app (NestJS + Next.js), described by a CodeBase map in
  `docs/codebase/` (entities, routes, services, pages, components). No code is created: the map is enough
  for the PO factory.
- **A Markdown kanban** in `tasks/` (`epics`, `backlog`, `doing`, `qa`, `done`), using the
  [`markdown`](../reference/drivers.md) driver: each task is a file.
- **`docs/factory.config.md`**, already filled in, with `language` set to the language you write in.

## What it runs

After showing what it created, the demo asks whether to run the [PO factory](po.md) on the sample initiative
**"Share a note with other users"**. If you accept, within a few minutes you get:

```text
factory-demo/
├── docs/initiatives/share-a-note-with-other-users/
│   ├── research.md        # competitors, best practices, MVP
│   ├── codemap.md         # what Notely already has and what is missing
│   ├── blueprint.md       # specification of each feature
│   └── tasks-report.md    # Epic and Stories created
└── tasks/
    ├── epics/EPIC-....md
    └── backlog/NOTE-001-....md, NOTE-002-....md, ...
```

Market research uses web search; everything else happens only in the demo folder's files.

## After the demo

- Open `blueprint.md` and one story in `tasks/backlog/`: the story body carries the whole blueprint block,
  which is what the DEV factory consumes.
- For a real project: [`/factory:init`](init.md) in the repository, then `/factory:po <initiative>`.
  DEV, QA and CR need real code and, for QA, a way to run the tests.
