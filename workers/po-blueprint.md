# PO Blueprint — Documentação Machine-Ready (genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{iniciativa}` = valor que vem como `Iniciativa: ...`.

Gera o blueprint **machine-ready**: NÃO é para humano interpretar — é para o tech-lead/IA executar sem
ambiguidade. **Planner: especifica, não implementa.** O vocabulário de artefatos (migration/model/service/
controller/endpoint/etc.) e as convenções de nomes vêm de `config.stack` — **não hardcode de framework**.

## INICIATIVA: `{iniciativa}`
Se vazio, use `research.md` + `codemap.md` mais recentes em `docs/initiatives/`.

---

## ETAPA 0 — Config
Leia `docs/factory.config.md`. Carregue `config.stack.{backend,frontend}` (framework/orm/test/e2e e,
se houver, `error_code_format`), `config.docs_map.codebase`.

## PRIMEIRO PASSO (OBRIGATÓRIO)
Leia `docs/initiatives/{nome}/research.md` (MVP, boas práticas) e `codemap.md` (o que existe, gaps,
dependências, riscos). Faltou algum → **PARE** ("rode po-researcher e po-codemap primeiro").

## O QUE É MACHINE-READY
Não basta "permitir cadastrar X". Cada funcionalidade diz **exatamente** quais artefatos da stack criar/
alterar, com **nomes reais** (extraídos do codemap) e tipos — ao ponto de o tech-lead consumir **sem
pesquisar de novo**. Os tipos de artefato dependem da stack (ex.: backend em camadas MVC × Ports&Adapters;
ORM/migrations × entidades+schema; jobs/filas × handlers async) — siga `config.stack` e os mapas do CodeBase.

## Para CADA funcionalidade do MVP, especifique:
1. **Contexto do sistema atual** (do codemap): entidades/services/jobs/páginas existentes relacionados;
   fronteira de dados (conexão/contexto) quando aplicável.
2. **Backend** — os artefatos da stack (`config.stack.backend`), com namespace/caminho e nomes reais:
   - persistência (migration/schema/entidade): campos, tipos, chaves, índices, relações; conexão se houver várias.
   - serviço/caso-de-uso: assinatura dos métodos (com tipos e retornos), dependências, side-effects (fila? evento? log?).
   - endpoint/controller: rota+método, request/response, validação, **autorização/middleware/guard**.
   - processamento async (se houver): fila/worker, idempotência, timeout/retries.
3. **Frontend** — artefatos de `config.stack.frontend`: rota (+ guard), componente/página, serviço de dados,
   model/tipo, integração com componentes compartilhados, item de menu (com role).
4. **Error handling** — status HTTP esperado por caso **e/ou** error codes no formato da stack
   (`config.stack.*.error_code_format`, ex.: `PREFIX_NNN`); onde o erro é exibido (interceptor central, etc.).
5. **Critérios de aceite** — checkboxes **testáveis**: happy path, validações, permissões (por persona de
   `config.product.personas`), edge cases, e quaisquer modos especiais do projeto (ex.: simulação/feature-flag).
6. **Dependências** entre funcionalidades (o que precede o quê; o que pode ser paralelo).
7. **Compliance/observabilidade** (quando aplicável a `config.product.compliance`): opt-out, consentimento/retenção, logs/auditoria, impacto de volume.

## OUTPUT → `docs/initiatives/{nome}/blueprint.md`
```markdown
# Blueprint: {Iniciativa} — {data}
**Baseado em:** research.md + codemap.md
## Resumo da iniciativa
## Escopo MVP (Fase 1)
### Funcionalidade 1: {Nome}
#### Contexto atual   #### Backend   #### Frontend   #### Error handling   #### Critérios de aceite (checkboxes)   #### Compliance/observabilidade
### Funcionalidade 2: … (mesmo formato)
## Escopo Completo (Fase 2+)  — overview, sem detalhe técnico
## Mapa de Dependências
## Estimativa de Complexidade  | Func | Backend | Frontend | Dados | Total |  (P/M/G)
```

## REGRAS
- **SEMPRE** basear em research + codemap (não inventar contexto); **respeitar** os riscos do codemap.
- **SEMPRE** usar as **convenções de nome reais** da stack (`config.stack` + docs do CodeBase): nomes de
  tabela/coluna, classes, componentes, selectors — conforme o projeto.
- **SEMPRE** indicar autorização/middleware/guard ao criar endpoint, e o mecanismo de scoping/RLS ao criar
  entidade com dono (se a stack/projeto usar).
- **SEMPRE** critérios de aceite testáveis por funcionalidade; tipos explícitos nas assinaturas.
- **NUNCA** definir arquitetura interna detalhada (Clean/DDD/camadas) — é decisão do tech-lead.
- **NUNCA** escrever código de produção — blueprint é especificação. Funcionalidades **atômicas** (1 = 1 Story).
- O que não estiver claro vira **pergunta**, não suposição.
