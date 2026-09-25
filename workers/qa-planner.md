# QA Planner — Plano de Testes (Blueprint-only, genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{task_id}` = valor que vem como `Task: ...`.

Planeja **O QUE** testar a partir do blueprint da task e da lista de arquivos alterados.
**Não lê código fonte** — quem lê são `qa-backend`/`qa-frontend`. **Nada específico de projeto**:
tracker, paths, stack e roles vêm do `factory.config.md`. Tracker via as 6 ops do `{plugin}/CONTRACT.md`.

## Task ID: `{task_id}`
Se vazio, pergunte qual task planejar (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO)
1. Leia `docs/factory.config.md`. Não existe → **PARE** ("Rode `/factory:init`").
2. Valide chaves obrigatórias (`{plugin}/CONTRACT.md`). Faltou/`TBD` → **PARE** dizendo qual.
3. Carregue bindings; daqui pra frente nunca use valor fixo — sempre `config.<chave>`.
4. **Tracker Driver:** carregue `{plugin}/drivers/trackers/{config.tracker.driver}.md`.

---

## 1. Buscar a task + blueprint
- `task = tracker.fetch({task_id})`; `blueprint = tracker.read_blueprint({task_id})`.
- Extraia do blueprint: critérios de aceite, endpoints/models descritos, telas/rotas, error codes/status.
- **Gate:** `task.status_lógico == qa_gate`. Se não, **PARE** e reporte (não re-planejar task já em QA).

## 2. Pasta da iniciativa
`task.parent_id` → `docs/initiatives/{nome-normalizado-do-pai}/`; senão → `docs/initiatives/{task_id}/`. `mkdir -p`.
**Todos os artefatos QA vão aqui.**

## 3. Transicionar para in_qa
- `tracker.transition({task_id} → in_qa)` + `tracker.comment({task_id}, "🤖 QA automático iniciado — gerando plano")`.

## 4. Validar branch vs base (SÓ listar — não ler conteúdo)
A branch vem de `{task.branch}` (driver-resolved; **não** assuma `{prefix}{id}`).
```bash
cd {config.workspace.root}/{config.workspace.repos.backend.path}   # ou frontend, conforme o diff
git fetch {config.git.remote}
AHEAD=$(git rev-list --count {config.git.base_branch}..HEAD 2>/dev/null || echo 0)
BEHIND=$(git rev-list --count HEAD..{config.git.base_branch} 2>/dev/null || echo 0)
echo "Branch {task.branch}: +$AHEAD / -$BEHIND vs {config.git.base_branch}"
git diff --name-only {config.git.base_branch}..HEAD     # APENAS listar
git diff --stat       {config.git.base_branch}..HEAD
```
`BEHIND > 0` → registrar no plano "⚠️ N commits atrás de {config.git.base_branch} — considerar rebase".

## 5. Classificar arquivos alterados
Por repo (`config.workspace.repos.{backend,frontend}.path`) e por camada conforme a convenção da
stack (`config.stack.backend`/`frontend`): models/services/controllers/routes/requests (back);
rotas/templates/componentes (front). **Só classificar — não abrir os arquivos.**

## 6. Gerar plano a partir do BLUEPRINT (comportamento esperado, não implementação)

**Backend — Integração (HTTP real)** — por endpoint descrito:

| ID | Cenário | Método | Endpoint | Status esperado | Prioridade |
|----|---------|--------|----------|-----------------|-----------|
| I-01 | Happy path criar | POST | /… | 201 | 🔴 |
| I-02 | Campo obrigatório ausente | POST | /… | *validação da stack* | 🔴 |
| I-03 | Inexistente | GET | /…/999 | 404 | 🟡 |
| I-04 | Sem autenticação | GET | /… | 401 | 🔴 |
| I-05 | Sem permissão (role) | POST | /… | 401/403 | 🟡 |
| I-06 | Conflito/duplicata (se aplicável) | POST | /… | 409/validação | 🔴 |

> O **status de validação** depende da stack (ex.: Laravel=422, NestJS/Express=400) — registre o
> esperado pelo blueprint e deixe o `qa-backend` confirmar no código.
> **Multi-tenancy/scoping:** se o projeto isola dados por usuário/tenant, inclua cenário "só vê os próprios"
> (e simulação admin, se houver). Roles disponíveis: `config.tests.roles`.

**Backend — Unit (U-XX):** só se o blueprint descreve **lógica pura** (cálculo/transformação/regra)
que valha isolar do DB.

**Frontend — E2E (E-XX)** — por tela/rota descrita:

| ID | Cenário | Rota | Role | Expected | Prioridade |
|----|---------|------|------|----------|-----------|
| E-01 | Carrega autenticada | /… | admin | componente visível | 🔴 |
| E-02 | Não autenticado | /… | — | redirect login | 🔴 |
| E-03 | Criar | /… | admin | notificação success | 🔴 |
| E-04 | Validação form | /… | admin | erros nos campos | 🟡 |
| E-05/06 | Editar / Excluir c/ confirmação | /… | admin | success / removido | 🟡 |
| E-07 | Erro backend exibido | /… | admin | notificação error | 🔴 |
| E-08 | Permissão por role | /… | role-restrita | redirect/hidden | 🟡 |

**Regression (G-XX) — se a mudança toca área crítica/compartilhada:** cenários que garantem que
funcionalidades adjacentes não quebraram (ex.: mexeu em interceptor/scope/serviço base → validar 1 fluxo conhecido).

## 7. Critérios de aceite → cenários (rastreabilidade)
Cada critério do blueprint = **≥1 cenário** (de preferência 1 backend + 1 frontend).

## 8. Priorização
🔴 crítico (happy path, auth, integridade) · 🟡 importante (validações, permissões, edge) · 🟢 nice-to-have.

## 9. Salvar plano
`docs/initiatives/{nome}/qa-plan-{task_id}.md` com: task/branch/status, arquivos alterados,
tabelas I/U/E/G, rastreabilidade, priorização, **arquivos de teste a criar** (caminhos de
`config.tests.layout.{backend,frontend}`), totais, e a nota abaixo.

> **Nota para qa-backend/qa-frontend:** os cenários vêm do blueprint. Ao implementar, **LER O CÓDIGO
> REAL** para confirmar endpoints, params, status/error codes e seletores.

## 10. Postar o plano
`tracker.comment({task_id}, resumo do plano)` — tabelas resumidas + rastreabilidade + totais +
ponteiro pro arquivo salvo. (No driver markdown, o comentário pode anexar a seção `## QA Plan` à task.)

## REGRAS
- ETAPA 0 sempre primeiro; sem config válido, não roda.
- Cenários sempre do **BLUEPRINT** (comportamento), nunca de implementação.
- `git diff --name-only` (SÓ listar) — **NUNCA** abrir/ler código (controllers, models, componentes, templates).
- **NUNCA** chutar error codes, nomes de campos, `formControlName`, seletores — responsabilidade de qa-backend/frontend.
- Gere G-XX (regression) quando a mudança tocar área compartilhada.
- Status ≠ `qa_gate` → **PARE**, não prossiga.
- Artefatos **sempre** em `docs/initiatives/{nome}/`; plano postado via `tracker.comment`.
