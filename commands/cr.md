---
description: Factory CR — code review dos MRs/PRs de uma task com gate humano
argument-hint: <task-id> [--model papel=valor]
---
# Factory CR — Orquestrador da fábrica de Code Review (genérico/config-driven)

Recebe o id de uma task, descobre os MRs/PRs ligados a ela, revisa cada um, **mostra os achados e
espera o veredito humano (aprovar/reprovar + porquê)**, comenta no MR **e** na task, e move o status:
aprovado → avança; reprovado → retorna. **Nada específico de projeto**: tracker, code host, stack,
branch e status vêm do `factory.config.md`. Task via ops do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` (tracker); MR via ops SCM (`${CLAUDE_PLUGIN_ROOT}/drivers/scm/<driver>.md`).

> **Invariante de segurança:** esta fábrica é **read-only sobre o git** — usa `glab/gh mr diff` e, no
> máximo, `git fetch`+`git diff` contra refs remotas. **NUNCA faz checkout nem altera branch local.**

## Task ID: $ARGUMENTS
Se vazio, pergunte qual task revisar (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Preparação
1. **Config:** leia `docs/factory.config.md`; valide as **chaves da fábrica CR** (ver `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Chaves
   obrigatórias da fábrica CR"). Faltou/`TBD` → **PARE**. Carregue `${CLAUDE_PLUGIN_ROOT}/drivers/trackers/{config.tracker.driver}.md` **e**
   `${CLAUDE_PLUGIN_ROOT}/drivers/scm/{config.scm.driver}.md`.
2. **Task + gate:** `task = tracker.fetch($ARGUMENTS)`. **Guarde `status_anterior = task.status_lógico`** (p/ rollback).
   Status deve ser `review_gate` (≠ → **ALERTE** e pergunte se prossegue mesmo assim; pode ser retrabalho).


**Modelos:** resolva o modelo de cada worker pela ordem do `${CLAUDE_PLUGIN_ROOT}/CONTRACT.md` → "Modelos por
papel" (arg `--model papel=valor` → `config.models.<papel>` → `config.models.default` → padrão do plugin) e
passe-o no parâmetro `model` de **toda** subida de worker. Tire os `--model ...` do `$ARGUMENTS`
antes de usá-lo como ID/iniciativa. Valor fora de `fable|opus|sonnet|haiku|inherit` → **PARE**.

---

## ETAPA 1 — Descobrir os MRs
1. `mrs = scm.find_mrs(task)` (S1): links no corpo/comentários **+ fallback** por `scm.branch_convention`;
   filtra `target == config.scm.mr_target`; exclui a gêmea `scm.exclude_branch_suffix`. Avise se veio por fallback.
2. Para cada MR, `scm.mr_view` (S2): **pule** os `merged`/`closed` (registre como pulado, sem CR).
3. **Sem nenhum MR aberto** (nada encontrado, ou todos merged/closed): **NÃO** mova status. Informe o usuário,
   ofereça informar MRs manualmente; se nada, encerre deixando a task no `status_anterior`.
4. Só havendo ≥1 MR aberto: `tracker.transition($ARGUMENTS → in_review)`.

---

## ETAPA 2 — Revisar cada MR (sub-agents isolados por MR)
Para cada MR aberto, dispare **os dois workers em paralelo** (mesma mensagem, contextos próprios):
1. `Leia e siga ${CLAUDE_PLUGIN_ROOT}/workers/cr-reviewer.md. MR: {repo}!{iid} | Task: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}`
   → lê o diff (S3, read-only), projeta o checklist de `config.stack` + convenções do `config.docs_map.codebase`,
   e devolve achados (🔴 Crítico / 🟡 Importante / 🟢 Sugestão / 📄 Doc) por arquivo:linha.
2. `Leia e siga ${CLAUDE_PLUGIN_ROOT}/workers/cr-security.md. MR: {repo}!{iid} | Task: $ARGUMENTS | Config: docs/factory.config.md | Plugin: ${CLAUDE_PLUGIN_ROOT}`
   → passada dedicada de segurança sobre o mesmo diff; devolve só **HIGH/MEDIUM** com confiança ≥0.7,
   cada um com cenário de exploração. Mapeamento: **HIGH → 🔴**, **MEDIUM → 🟡**.

Consolide os dois retornos por MR, deduplicando: se ambos apontarem o mesmo `arquivo:linha`, mantenha
**a severidade mais alta** e a descrição do security (que traz o cenário de exploração).
`0 HIGH · 0 MEDIUM` é resultado válido — registre a passada como feita, não a omita.

---

## ETAPA 3 — Apresentar os achados (consolidado)
Mostre ao usuário, por MR, a tabela de achados + resumo. **Não decida sozinho.** Formato:
```markdown
## Code Review — Task $ARGUMENTS — {config.project}
### MR {repo}!{iid} — {title}  ({source_branch} → {target_branch})
| Sev | Arquivo:linha | Descrição |
| 🔴/🟡/🟢/📄 | ... | ... |
### Resumo: N críticos · M importantes · … + pontos positivos
### 🔒 Segurança: N HIGH · M MEDIUM (ou "sem achados") — com cenário de exploração nos HIGH
```

## ETAPA 4 — Veredito humano (GATE obrigatório)
Use `AskUserQuestion`:
- **Recomendação padrão:** Reprovar se houver ≥1 🔴 (ou 🟡 que o usuário confirme como bloqueante); senão Aprovar.
  **Todo HIGH de segurança é 🔴** — destaque-o na recomendação, com o cenário de exploração.
- Opções: **"Aprovar"** / **"Reprovar"**. **Capture o "porquê"** (o motivo do usuário — vai nos comentários).
- Nunca avance/retorne sem resposta explícita.

## ETAPA 5 — Comentar (MR + task) e mover status
Com o veredito + motivo:
1. **Em cada MR** (`scm.mr_comment`, S4): postar o CR (veredito + achados incluídos + o motivo do humano).
2. **Na task** (`tracker.comment`): postar o resumo consolidado (MRs revisados/pulados + veredito + motivo + ações).
3. **Transição:**
   - **Aprovado** → `tracker.transition($ARGUMENTS → review_approved)` (+ `tracker.label(approved)` se configurado). **Avança.**
   - **Reprovado** → `tracker.transition($ARGUMENTS → review_returned)`. **Retorna.**
4. Informe ao usuário o status final e os links dos comentários postados.

### Relatório final
```markdown
## Factory CR — $ARGUMENTS — {data} — {config.project}
MRs: {revisados} revisados, {pulados} pulados | Veredito: {APROVADO|REPROVADO} — "{motivo}"
Status: {status_anterior} → in_review → {review_approved|review_returned}
Comentários: {links MR} + {link task}
```

## REGRAS
- **Read-only no git:** nunca `checkout`/troca de branch/commit. Diff sempre via `mr diff` ou `git diff` contra ref remota.
- **Gate humano é obrigatório** (ETAPA 4) — a fábrica revisa e recomenda; **quem aprova/reprova é o humano**, com motivo.
- Só mova pra `in_review` se houver MR aberto; sem MR → deixe no `status_anterior` (rollback) e trate com o usuário.
- Comente **nos dois lugares** (MR e task). Foque em problema real, não estilo (o linter cuida disso).
- Cada MR em sub-agents próprios (contexto isolado): `cr-reviewer` **+** `cr-security`,
  disparados em paralelo. Em qualquer dúvida, **pergunte ao humano**.
- Falha de suíte/erro por bug de pré-release (não do código do MR) → não conta como 🔴; sinalize como `upstream_bug`.
