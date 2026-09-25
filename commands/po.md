---
description: Factory PO — iniciativa → pesquisa, codemap, blueprint e Epic+Stories no tracker
argument-hint: <iniciativa> [--model papel=valor]
---
# Factory PO — Orquestrador da fábrica PO (genérico/config-driven)

Transforma uma **iniciativa** do roadmap em Epic + Stories prontas no tracker, via 4 sub-agents
isolados em sequência. **Nada específico de projeto**: produto, codebase, stack e tracker vêm do
`factory.config.md`. Tracker via as ops de autoria do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`.

## INICIATIVA: $ARGUMENTS
Se vazio, pergunte qual iniciativa processar (ex.: "Integração com Yampi") ou use o artefato mais
recente em `docs/initiatives/<x>/`.

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO)
1. Leia `docs/factory.config.md`. Não existe → **PARE** ("Rode `/factory:init`").
2. Valide as **chaves da fábrica PO** (`${CLAUDE_PLUGIN_ROOT}/CONTRACT.md`): `product.{domain,personas}`, `docs_map.codebase`,
   `stack.{backend,frontend}`, e as de autoria do tracker (markdown→`tracker.{board_path,epic_folder,story_folder}`+`issue.id_format`; gitlab→`tracker.project_path`). Faltou/`TBD` → **PARE** dizendo qual.
3. Carregue bindings (nunca valor fixo). Carregue `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md` (usado no passo 4).
4. Pasta da iniciativa: `nome = kebab-case($ARGUMENTS)` → `docs/initiatives/{nome}/`. `mkdir -p`.


**Modelos:** resolva o modelo de cada worker pela ordem do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Modelos por
papel" (arg `--model papel=valor` → `config.models.<papel>` → `config.models.default` → padrão do plugin) e
passe-o no parâmetro `model` de **toda** subida de worker. Tire os `--model ...` do `$ARGUMENTS`
antes de usá-lo como ID/iniciativa. Valor fora de `fable|opus|sonnet|haiku|inherit` → **PARE**.

---

## PIPELINE (ordem fixa; cada etapa = sub-agent via Task, contexto isolado)
Aplique o **gate** após cada etapa: valide o artefato esperado; falhou → **PARE** e reporte.

### ETAPA 1 — Researcher → `docs/initiatives/{nome}/research.md`
```
Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/po-researcher.md`. Iniciativa: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Pasta: docs/initiatives/{nome}/
```
**Gate:** arquivo existe com tabela comparativa + recomendação MVP (+ check de compliance se `config.product.compliance` não-vazio).

### ETAPA 2 — Code Map → `docs/initiatives/{nome}/codemap.md`
```
Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/po-codemap.md`. Iniciativa: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Pasta: docs/initiatives/{nome}/
```
**Gate:** mapeou o que já existe (via `config.docs_map.codebase`) + gaps + dependências + riscos.

### ETAPA 3 — Blueprint → `docs/initiatives/{nome}/blueprint.md`
```
Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/po-blueprint.md`. Iniciativa: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Pasta: docs/initiatives/{nome}/
```
**Gate:** cada funcionalidade tem backend + frontend + error handling + critérios de aceite testáveis + complexidade.

### ETAPA 4 — Tasks → Epic + Stories no tracker
```
Leia e siga `${CLAUDE_PLUGIN_ROOT}/workers/po-tasks.md`. Iniciativa: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT} | Pasta: docs/initiatives/{nome}/
```
**Gate:** Epic + Stories criados (via `tracker.create_epic`/`create_story`), ligados, e `tasks-report.md` lista os IDs.

> Researcher e Code Map *poderiam* rodar em paralelo, mas a sequência é mais segura (o code map se
> beneficia da pesquisa). Blueprint depende dos dois; Tasks depende do blueprint.

---

## ETAPA 5 — Relatório final e handoff
```markdown
## PO Pipeline — {Iniciativa} — {data} — {config.project}
| Etapa | Status | Output |
|-------|--------|--------|
| Researcher | ✅ | docs/initiatives/{nome}/research.md |
| Code Map | ✅ | docs/initiatives/{nome}/codemap.md |
| Blueprint | ✅ | docs/initiatives/{nome}/blueprint.md |
| Tasks | ✅ | EPIC + N Stories |

### Stories criadas (handoff p/ a fábrica DEV)
| ID | Funcionalidade | Complexidade |
### Próximos passos
1. PO: revisar blueprint + Stories.  2. DEV: iniciar pela primeira Story (pipeline DEV).
```

## REGRAS
- ETAPA 0 sempre primeiro; sem config válido (ou com `TBD`), não roda.
- Cada sub-agent em **próprio contexto** (Task). Ordem fixa: Researcher → Code Map → Blueprint → Tasks.
- Gate reprovado em qualquer etapa → **PARE** e reporte; não pule nem invente artefato ausente.
- Todos os intermediários em `docs/initiatives/{nome}/` (rastreabilidade).
- Stories **nascem no backlog** do tracker (markdown: `story_folder`; gitlab: issue aberta) — promover é da fábrica DEV.
- A fábrica **cria e organiza, não prioriza** Sprint (decisão humana).
