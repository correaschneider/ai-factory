# QA Backend — Criação de Testes (lê código real, genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{task_id}` = valor que vem como `Task: ...`.

Cria os testes de backend que rodam na **stack do projeto** (`config.stack.backend.test`), usando o
**código IMPLEMENTADO como fonte de verdade**. **Nada específico de projeto**: framework, paths,
helpers e idioms vêm do `factory.config.md`.

## Task ID: `{task_id}`
Se vazio, pergunte qual task (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO)
1. Leia `docs/factory.config.md`. Não existe → **PARE**.
2. Valide chaves obrigatórias (`{plugin}/CONTRACT.md`) + as do backend: `tests.layout.backend`,
   `stack.backend.test`, `workspace.repos.backend.path`. Faltou/`TBD` → **PARE**.
3. Carregue bindings (nunca valor fixo). Tracker driver só se precisar comentar.

---

## 1. Ler o plano
Pegue o `qa-plan-{task_id}.md` mais recente em `docs/initiatives/*/`. Entenda os cenários I-XX / U-XX.

## 2. Ler o CÓDIGO REAL (fonte de verdade)
Liste os arquivos alterados e **abra** os do backend para entender COMO testar:
```bash
cd {config.workspace.root}/{config.workspace.repos.backend.path}
git diff --name-only {config.git.base_branch}..HEAD
```
Por camada (convenção de `config.stack.backend`), extraia o **real** (pode divergir do blueprint):
- **Controllers/handlers:** endpoint+método exatos, params obrigatórios, status retornados, error codes/mensagens.
- **Validação** (FormRequest/DTO/schema): regras (`required`/`unique`/`exists`…), mensagens custom.
- **Models/entidades:** campos (`fillable`/colunas), casts/tipos, relações, scopes globais, connection.
- **Services:** assinatura dos métodos públicos, comportamento, side-effects (fila? evento? log?).
- **Rotas/middlewares + migrations:** URI/middleware aplicado; tabela/colunas/índices/FK.

Consulte `config.docs_map.codebase` para convenções/quirks da stack (naming, multi-DB, soft-delete, etc.).

## 3. Ler os helpers de teste do projeto
`config.tests.backend_helpers` (auth, client, cleanup, factories) + a base de testes existente
(`config.tests.layout.backend`) para reusar o padrão de setup do projeto.

## 4. Comparar plano × código real
| Cenário do plano | Endpoint real | Params reais | Status/erro real | Ajuste? |
|---|---|---|---|---|
Divergiu → **testar como FOI implementado** (código é a verdade) + documentar a divergência no teste.

## ONDE CRIAR
Em `config.tests.layout.backend` (integração `{feature}` + unit, conforme o layout do projeto).
Framework e runner: `config.stack.backend.test`.

## TEMPLATE (esqueleto agnóstico — adapte aos idioms da stack)
```
// Cabeçalho: Feature, Task {task_id}, plano de origem, Divergências plano↔código
// Setup: autenticar 1 cliente por role relevante (config.tests.roles) via config.tests.backend_helpers
// Isolamento: usar o mecanismo da stack
//   - RefreshDatabase / transação (Laravel)   - SQLite efêmero + pool forks (Vitest/NestJS)
//   - factory + trackForCleanup/cleanup no teardown (HTTP remoto)
// 1 cenário do plano = 1 teste; nome referencia o ID (ex.: test_I01_..., 'I-01: ...')
// Categorias: CRUD happy path · validação · not-found 404 · auth 401 · permissão 401/403
//             · multi-tenancy (se houver) · regras de negócio dos critérios · G-XX regression
// Asserções com status/params/mensagens REAIS do código (não do plano)
// Side-effects: fake da fila/evento da stack (ex.: Queue::fake / sync) quando a action dispara job
```
> O esqueleto é ilustrativo: siga os idioms reais da stack (`config.stack.backend`) e os helpers do
> projeto. **Não** copie literais de outro projeto.

## REGRAS
- **SEMPRE** ler o código real ANTES de escrever; usar status/params/error codes/campos **do código**.
- **SEMPRE** referenciar o cenário do plano no nome do teste (I-01, U-01, G-01).
- **SEMPRE** isolar via o mecanismo da stack; cleanup completo no teardown.
- **SEMPRE** documentar divergência plano↔código como comentário (`// Divergência: …`).
- **NUNCA** chutar error codes/nomes de campos; **NUNCA** testar endpoint inexistente; **NUNCA** mocar o ORM.
- Achou bug ao ler o código → marcar `// BUG POTENCIAL: …` mas escrever o teste normalmente.
- Feature dispara job/evento → testar com o fake/sync da stack.
