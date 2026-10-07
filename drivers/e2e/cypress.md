# E2E Driver — Cypress

**Selecionado quando:** `config.stack.frontend.e2e` começa com `cypress`, ou a chave está ausente (padrão).
**Pré-requisito:** Cypress instalado no projeto de testes (ou na imagem de `config.docker.run[_frontend]`).

---

### E1. files
- Arquivo: `{config.tests.layout.frontend}/{feature}.cy.ts` (ou `.cy.js`, conforme a base existente).
- Suite: `describe('{Feature} — Task {task_id}', () => { … })`.
- Um cenário = um `it('E-01: {descrição}', () => { … })`. O ID do plano sempre no início do nome.

### E2. auth
- Login por **custom command** do projeto (`config.tests.frontend_cmds`, em geral em
  `cypress/support/commands.*`), chamado no `beforeEach` com o papel: ex. `cy.loginAs('admin')`.
- Sem custom command: `cy.request('POST', '{config.env.api_url}/…login…', {…})` e gravar o token/cookie como
  o frontend espera (`cy.window().then(w => w.localStorage.setItem(…))` ou `cy.setCookie`).
- Cleanup no `after`/`afterEach` via `cy.request` autenticado, filtrando pelo prefixo de dado do teste.

### E3. wait
- Esperar por **asserção**: `cy.get(sel, { timeout: 10000 }).should('be.visible')`,
  `.should('contain', texto)`, `.should('not.exist')`.
- Request relevante: `cy.intercept('POST', '**/rota').as('x')` + `cy.wait('@x')` (espera a chamada, não um
  tempo). `cy.wait(<ms>)` só para estado assíncrono **depois** de uma mutação, nunca para esperar UI.

### E4. selectors
1. `[data-testid="…"]` (ou `data-cy`, se for o padrão do projeto);
2. atributo estável do template (`[formcontrolname="email"]`, `[name="email"]`);
3. texto visível com `cy.contains('button', 'Salvar')`;
4. classe/estrutura só em último caso, com `// TODO: adicionar data-testid="…"`.

### E5. evidence
- Vídeo: `video: true` no `cypress.config.*` (ou `--config video=true` na linha de comando).
- Screenshot em falha: padrão do `cypress run` (`screenshotOnRunFailure: true`).
- Resolução: `viewportWidth`/`viewportHeight` a partir de `config.evidence.resolution`.
- *Slow motion*: o Cypress não tem nativo; o projeto lê `{config.evidence.slowmo_var}` (ms) num hook de
  suporte. Com `{config.evidence.mode_var}=true`, o runner exporta as duas variáveis como `CYPRESS_*` ou
  `--env`.

### E6. run
- Só a feature: `cypress run --spec '{config.tests.layout.frontend}/{feature}/**'`.
- Confirmar no log a linha `Spec Ran:` (ou a tabela final) com o arquivo da feature.
- Em container sem tela, conflito de Xvfb: usar outro display (ex.: `:98`).

### E7. result
- Resultado do `cypress run` (Module API ou reporter JSON do projeto) em
  `config.evidence.artifacts.frontend_result`: `totalTests`, `totalPassed`, `totalFailed`, `totalPending`.
- Por falha: título completo do `it`, mensagem do erro, primeiras linhas do stack, e os caminhos do vídeo
  do spec e do screenshot da falha.
