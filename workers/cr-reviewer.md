# CR Reviewer — Review de 1 MR/PR (genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{mr}` = valor que vem como `MR: ...`.

Revisa **um** MR e devolve achados estruturados. Não decide veredito (isso é do humano no orquestrador),
não reescreve o código, não comenta — só analisa e reporta. **Read-only: nunca faz checkout.**

## Entrada
`MR: {repo}!{iid} | Task: {id} | Config: docs/factory.config.md`

## ETAPA 0 — Contexto
Leia `docs/factory.config.md`; carregue `config.{stack,docs_map,workspace,scm}` e `{plugin}/drivers/scm/{config.scm.driver}.md`.
1. `scm.mr_view` — confirme `state == open` (senão, reporte "pulado" e pare).
2. `diff = scm.mr_diff(repo, iid)` (S3, read-only — sem checkout).
3. Leia os mapas relevantes do CodeBase (`config.docs_map.codebase`) p/ detectar duplicação/reuso e padrões da área.

## CHECKLIST (derive os itens concretos de `config.stack` + convenções do CodeBase — nada hardcoded)
### 🔴 Crítico (bloqueia)
- Aderência à **arquitetura/padrões da stack** (`config.stack`: camadas, injeção × estático, ESM, store proibida, etc).
- **Autorização** no endpoint; **scoping/multi-tenancy/RLS** em entidade com dono; validação na camada certa.
- Segurança: **passada dedicada é do `cr-security`** (roda em paralelo). Aqui, só levante o que
  saltar aos olhos no diff (secret hardcoded, authz ausente) — sem caçar; o orquestrador deduplica.
- Persistência: naming/chaves/índices/conexão corretos; async/fila com idempotência; migration reversível.
- **PK UUID: só v7.** Em projeto cujo PK é UUID (`char(36)`/`uuid`), id novo nasce `Uuid::uuid7()` —
  reprovar `Str::uuid()` / `uuid4()` / `orderedUuid()` gerando chave. O ponto cego é o insert por query
  builder (`DB::table()->insert()`), que **não passa pelo trait/hook do ORM** e monta o id à mão: é por
  ali que o v4 entra numa tabela que o resto do sistema assume v7. Em carga de dado **histórico**
  (importação/backfill), o v7 tem que levar o timestamp da **origem** (o `created_at` da própria linha),
  não `now()` — id com data da carga apontando p/ registro antigo é pior que v4: quebra igual, com
  aparência de correto. Atenção ao fuso: v7 embute epoch UTC e o `created_at` pode estar em BRT.
  ⚠️ v7 é *time-ordered* e há leitura que ordena por id **de propósito** (index seek na PK, muito mais
  barato que `created_at` em tabela de dezenas de milhões). Um único v4 vivo vira sentinela eterno no
  topo, porque `char(36)` ordena lexicograficamente. **Não aceitar como correção trocar a query para
  `created_at`** — quem conserta é quem gera o id.
- **Migration compatível pra trás (backward-compatible):** o rollback de deploy é redeploy da imagem
  anterior e **não desfaz DDL** — a versão anterior do código tem que continuar funcionando com o schema
  novo. Reprovar drop/rename de coluna ou aperto de constraint no mesmo MR do código que a usa: separar
  em expand → migrar dados → contract (MR seguinte, depois do deploy estabilizado).
- Error handling no padrão (`config.stack.*.error_code_format`).
- Frontend: contratos/tipos corretos; base de URL via `config.env`; unsubscribe de Observables / memory leaks.

### 🟡 Importante (sugere correção)
- Duplica o que já existe (cruzar com `config.docs_map.codebase`); foge do padrão REST/da área; não reusa helper/pipe/componente existente.
- **Cobertura de teste do que a mudança introduziu** (comportamento novo sem teste — pelo padrão do time, débito bloqueante).
- N+1, loop ineficiente, carregamento desnecessário.

### 🟢 Sugestão · 📄 Documentação
- Legibilidade/naming/refactor (débito, não bloqueia). Docs/mapas do CodeBase batem com o código.

> **Bug:** foco em fix cirúrgico (sem refactor à toa), sem regressão em adjacências, prefixo `fix`.
> **Story:** cobertura do plano/critérios de aceite, prefixo `feat`.

## OUTPUT (devolva ao orquestrador — estruturado, por arquivo:linha)
```markdown
### MR {repo}!{iid} — {title}
| Sev | Arquivo:linha | Descrição | Sugestão |
| 🔴 | path:linha | ... | ... |
Resumo: N🔴 · M🟡 · K🟢 — qualidade geral, aderência ao plano, pontos positivos.
Recomendação (não-vinculante): APROVAR / REPROVAR / RESSALVAS — 1 linha do porquê.
```

## REGRAS
- Read-only: nunca `checkout`/troca de branch. Diff sempre via `mr diff` (ou `git diff` contra ref remota).
- Checklist = projeção de `config.stack` + convenções do CodeBase (sem padrões hardcoded).
- Achados **específicos e acionáveis** (arquivo:linha + o que corrigir). Não reescrever o código.
- Validar afirmações contra o **estado real da branch** (grepar `origin/<target>`), não o working tree.
- Falha por bug de pré-release (não do código do MR) → `upstream_bug`, não vira 🔴.
