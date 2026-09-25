# PO Code Map — Análise do Codebase Existente (genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{iniciativa}` = valor que vem como `Iniciativa: ...`.

Cruza a iniciativa com o **CodeBase** (`config.docs_map.codebase`) para mapear o que já existe, gaps,
dependências e riscos. Alimenta o blueprint. **Foco em MAPEAMENTO, não implementação**; **não recomenda
arquitetura** (é do tech-lead). Lê **docs/mapas, não código fonte**.

## INICIATIVA: `{iniciativa}`
Se vazio, use o `research.md` mais recente como contexto.

---

## ETAPA 0 — Config
Leia `docs/factory.config.md`. Carregue `config.docs_map.codebase`, `config.stack`, `config.product.default_project` (se houver).

## 1. Ler a pesquisa
`docs/initiatives/{nome}/research.md` — o que vai ser construído, MVP, integrações.

## 2. Ler os mapas do CodeBase (ANTES de qualquer código)
Em `config.docs_map.codebase`: índice/README, glossário, overview + architecture do projeto-alvo,
e os mapas de `backend/` (entidades/services/rotas/jobs/integrações) e `frontend/`
(módulos/componentes/services/rotas) **conforme o escopo da iniciativa**.
- **Projeto-alvo:** `config.product.default_project` (se definido), salvo se a pesquisa indicar outro.
- Detalhe profundo que o mapa não cobre → abrir os docs autoritativos do repo (apontados pelo CodeBase).
- **NÃO explore código fonte** até esgotar os mapas; se precisar abrir 1 arquivo, registre **qual e por quê**.

## 3. Produzir o mapa
1. **O que já existe** relacionado: entidades/models, services, jobs, páginas/componentes, rotas/endpoints
   (com caminho/arquivo, conforme a convenção de `config.stack`).
2. **Gap analysis** (mercado × o que existe): ✅ já existe · 🟡 parcial (estender) · ❌ criar do zero · ⚠️ conflita (refatorar).
3. **Mapa de dependências** (depende de / estende / integra com / precisa criar / migrations / impacta).
4. **Áreas afetadas por funcionalidade** (tabela backend/frontend/dados + complexidade).
5. **Riscos e restrições técnicas** observados nos mapas (cache, filas, multi-DB, scopes/RLS, roteamento, volume).
6. **Recomendação de sequência** de implementação (por dependências).

## OUTPUT → `docs/initiatives/{nome}/codemap.md`
```markdown
# Code Map: {Iniciativa} — {data}
## 1. O que já existe (tabelas: Models | Services | Jobs | Pages | Rotas — com arquivo, relação, status)
## 2. Gap Analysis (✅/🟡/❌/⚠️ por funcionalidade)
## 3. Mapa de Dependências
## 4. Áreas Afetadas por Funcionalidade
## 5. Riscos e Restrições Técnicas
## 6. Recomendação de Sequência
## 7. Integrações externas envolvidas
```

## REGRAS
- **SEMPRE** ler `config.docs_map.codebase` ANTES de explorar código; mapear o que existe antes de propor o novo.
- **NUNCA** recomendar refactor não-essencial; **NUNCA** definir arquitetura detalhada (é do tech-lead).
- Doc de referência incompleto/desatualizado → marcar `[?]` em vez de inventar.
- Conexão de dados distinta / fronteira de contexto (ex.: DB isolada) → marcar explicitamente (joins não atravessam).
