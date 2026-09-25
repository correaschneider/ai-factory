# QA Frontend — Criação de Testes E2E (lê código real, genérico/config-driven)
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{task_id}` = valor que vem como `Task: ...`.

Cria os testes E2E (`config.stack.frontend.e2e`) extraindo **seletores, rotas e fluxos do CÓDIGO
IMPLEMENTADO**. Rodam via Docker apontando para `config.env`. **Nada específico de projeto**: framework,
paths, custom commands e idioms vêm do `factory.config.md`.

## Task ID: `{task_id}`
Se vazio, pergunte qual task (formato em `config.issue.id_regex`).

---

## ETAPA 0 — Carregar e validar config (OBRIGATÓRIO)
1. Leia `docs/factory.config.md`. Não existe → **PARE**.
2. Valide chaves obrigatórias (`{plugin}/CONTRACT.md`) + as do frontend: `tests.layout.frontend`,
   `stack.frontend.e2e`, `workspace.repos.frontend.path`, `env.{app_url,api_url}`. Faltou/`TBD` → **PARE**.
3. Carregue bindings (nunca valor fixo).

---

## 1. Ler o plano
`qa-plan-{task_id}.md` mais recente em `docs/initiatives/*/`. Entenda os cenários E-XX (e G-XX).

## 2. Ler o CÓDIGO REAL (seletores/rotas/guards reais)
```bash
cd {config.workspace.root}/{config.workspace.repos.frontend.path}
git diff --name-only {config.git.base_branch}..HEAD
```
- **Rotas/roteamento:** path real + guards + componente. Respeite o **modo de roteamento da stack**
  (ex.: hash routing → `/#/path`) — ver `config.stack.frontend`.
- **Templates:** nomes de campos de form (`formControlName`/`name`), classes de botões, estrutura de
  modal/dialog, `data-testid`, textos visíveis (para seletor por texto).
- **Componentes:** form group, métodos dos botões (submit/delete), libs de modal/notificação usadas,
  checks de role/perfil.

Consulte `config.docs_map.codebase` para quirks da UI da stack (componentes shared, overlays, etc.).

## 3. Ler os custom commands do projeto
`config.tests.frontend_cmds` (login programático, request autenticada, navegação) + a base de testes
existente (`config.tests.layout.frontend`) para reusar o padrão. Login: **sempre** via API/programático
(não form login — lento). Roles: `config.tests.roles`.

## 4. Mapear seletores reais (tabela ANTES de escrever)
| Elemento | Seletor real (do template) | Fallback |
|---|---|---|
Seletor instável → `// TODO: adicionar data-testid="…"`. **Não** chutar seletor sem ler o template.

## ONDE CRIAR
Em `config.tests.layout.frontend` (`{feature}/{feature}.cy.ts` ou layout do projeto). Vídeo ativo,
screenshot em falha (variáveis em `config.evidence`).

## TEMPLATE (esqueleto agnóstico — adapte aos idioms da stack)
```
// Cabeçalho: Feature, Task {task_id}, plano de origem, arquivos de onde vieram os seletores, divergências
// beforeEach: login programático via config.tests.frontend_cmds (por role)
// after: cleanup dos dados criados via API (config.tests.frontend_cmds), usando prefixo de dado p/ filtrar
// 1 cenário do plano = 1 it(); nome referencia o ID (E-01, …)
// Cobertura: carrega autenticada · não-autenticado redireciona · criar · validação form
//            · editar · excluir c/ confirmação · erro backend exibido (notificação) · permissão por role
//            · G-XX regression (se no plano)
// Esperas com asserção (.should(... timeout)), NÃO sleep fixo para UI; seletores REAIS do template
```
> Idioms de framework (overlays headless, checkbox custom, esperar componente habilitar, normalizar
> resposta de lista, roteamento hash) variam por stack — siga `config.stack.frontend` e
> `config.docs_map.codebase`. **Não** copie literais de outro projeto.

## REGRAS
- **SEMPRE** ler templates + roteamento ANTES; usar `formControlName`/seletores/rotas **reais**.
- **SEMPRE** login via custom command programático (`config.tests.frontend_cmds`), por role.
- **SEMPRE** referenciar o cenário do plano no `it()` (E-01, …); documentar divergências como comentário.
- **SEMPRE** cleanup via request de API no `after` (com prefixo de dado p/ evitar colisão).
- **SEMPRE** marcar seletor instável com `// TODO: data-testid`.
- **NUNCA** chutar seletor/rota inexistente; **NUNCA** hardcode de ID; **NUNCA** mocar HTTP (vai contra backend real).
- **NUNCA** usar sleep fixo para esperar UI — usar asserção com timeout (sleep só para estado async pós-mutação).
- Cada critério de aceite = ≥1 `it()` (o E-XX correspondente).
