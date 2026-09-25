# PO Tasks — Epic + Stories no tracker (genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{iniciativa}` = valor que vem como `Iniciativa: ...`.

Quebra o blueprint em **Epic + Stories** no tracker do projeto. **Não sabe se é kanban-MD, GitLab ou
Jira** — usa as **ops de autoria** do `{plugin}/CONTRACT.md` (`create_epic`, `create_story`, `link_dependency`,
`update_epic`); o driver de `config.tracker.driver` traduz.

## INICIATIVA: `{iniciativa}`
Se vazio, use o `blueprint.md` mais recente em `docs/initiatives/`.

---

## ETAPA 0 — Config
Leia `docs/factory.config.md`. Valide as chaves de autoria (`{plugin}/CONTRACT.md`): markdown→
`tracker.{board_path,epic_folder,story_folder}` + `issue.id_format`; gitlab→`tracker.project_path`.
Faltou/`TBD` → **PARE**. Carregue `{plugin}/drivers/trackers/{config.tracker.driver}.md`.

## PRIMEIRO PASSO
Leia `docs/initiatives/{nome}/blueprint.md` — funcionalidades, critérios de aceite, dependências, complexidade.
Não existe → **PARE** ("rode po-blueprint primeiro").

## 1. Criar o Epic
`epic_ref = tracker.create_epic(slug={nome}, title="[Iniciativa] {Nome}", body, meta={labels:[generated]})`
— body com resumo, escopo MVP (bullets) e ponteiros para research/codemap/blueprint.

## 2. Criar uma Story por funcionalidade do MVP
Para CADA funcionalidade:
`story_ref = tracker.create_story(title="{Funcionalidade}", body, meta={epic_ref, depends_on:[…], labels:[generated], complexity, priority})`
- **CRÍTICO:** `body` = o **bloco completo da funcionalidade do blueprint** (contexto + backend + frontend
  + error handling + critérios de aceite + compliance). É o que o tech-lead/DEV vai consumir. **Não resumir.**
- O driver resolve id e local (markdown: próximo `issue.id_format` em `story_folder`; gitlab/jira: servidor).

## 3. Resolver dependências (recíprocas)
Para cada Story com `depends_on:[Y]`: `tracker.link_dependency(story_ref, Y)` (o driver registra o inverso —
`blocks[]` no markdown, issue link no gitlab/jira). Validar ausência de ciclos.

## 4. Atualizar o Epic
`tracker.update_epic(epic_ref, stories[])` — índice/tabela das Stories (ID, título, complexidade, status, deps).

## 5. Relatório → `docs/initiatives/{nome}/tasks-report.md`
```markdown
# Tasks Report: {Iniciativa} — {data}
## Epic criado: {epic_ref}
## Stories criadas | ID | Título | Complexidade | Dependências | Ref |
## Próximos passos (PO revisa; DEV inicia pela 1ª Story respeitando depends_on)
## Referência: research.md · codemap.md · blueprint.md
```

## REGRAS
- **SEMPRE** criar o Epic antes das Stories; 1 funcionalidade do MVP = 1 Story.
- **SEMPRE** incluir o bloco **COMPLETO** do blueprint no corpo da Story (não resumir).
- **SEMPRE** label `factory-generated`; **SEMPRE** dependências recíprocas via `link_dependency`.
- **SEMPRE** atualizar o Epic com a tabela de Stories após criar todas.
- **NUNCA** criar Story para escopo fora do MVP (Fase 2+ fica só no Epic como referência).
- **NUNCA** sobrescrever issue/arquivo existente (id colidiu → o driver incrementa/usa o servidor).
- **NUNCA** promover Story além do backlog nem priorizar Sprint — é da fábrica DEV / decisão humana.
- Dependência só quando real — Stories independentes rodam em paralelo (sem `depends_on` artificial).
