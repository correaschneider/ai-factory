# E2E Driver — Playwright

**Selecionado quando:** `config.stack.frontend.e2e` começa com `playwright`.
**Pré-requisito:** `@playwright/test` instalado no projeto de testes (ou na imagem de
`config.docker.run[_frontend]`), com os browsers da imagem oficial do Playwright ou instalados no build.

---

### E1. files
- Arquivo: `{config.tests.layout.frontend}/{feature}.spec.ts` (respeite `testDir`/`testMatch` do
  `playwright.config.*`).
- Suite: `test.describe('{Feature} — Task {task_id}', () => { … })`.
- Um cenário = um `test('E-01: {descrição}', async ({ page }) => { … })`. O ID do plano sempre no início do nome.

### E2. auth
- Login programático por papel, sem formulário, reusando o que o projeto já tem em
  `config.tests.frontend_cmds` (fixture, *setup project* ou helper):
    - **setup project + `storageState`**: um `auth.setup.ts` faz o login pela API e salva o estado por papel;
      os testes usam `test.use({ storageState: '<arquivo do papel>' })`;
    - **fixture**: `test.extend({ adminPage: … })` que autentica via `request.post('{config.env.api_url}/…')`
      e injeta token/cookie no contexto.
- Cleanup no `test.afterAll`/`afterEach` com o fixture `request` autenticado, filtrando pelo prefixo de dado.

### E3. wait
- Asserções que esperam sozinhas: `await expect(locator).toBeVisible({ timeout: 10000 })`,
  `toHaveText`, `toHaveURL`, `toBeHidden`.
- Request relevante: `const r = page.waitForResponse('**/rota'); await acao; await r;`.
- `page.waitForTimeout(<ms>)` só para estado assíncrono **depois** de uma mutação, nunca para esperar UI.

### E4. selectors
1. `page.getByTestId('…')` (atributo configurável em `use.testIdAttribute`);
2. papel e nome acessível: `page.getByRole('button', { name: 'Salvar' })`, `getByLabel('E-mail')`;
3. atributo estável do template: `page.locator('[formcontrolname="email"]')`;
4. texto visível: `page.getByText('…')`;
5. classe/estrutura só em último caso, com `// TODO: adicionar data-testid="…"`.

### E5. evidence
- No `playwright.config.*`, bloco `use`:
    - `video: 'on'` (ou `'retain-on-failure'`) e `screenshot: 'only-on-failure'`;
    - `viewport` a partir de `config.evidence.resolution`;
    - `launchOptions: { slowMo: Number(process.env.{config.evidence.slowmo_var} ?? 0) }` para *slow motion*.
- Com `{config.evidence.mode_var}=true`, o runner exporta as variáveis; vídeos e screenshots saem em
  `test-results/` (ou `outputDir`).

### E6. run
- Só a feature: `playwright test {config.tests.layout.frontend}/{feature}` (ou `--grep 'E-0'` pelo ID).
- Confirmar no log a lista de testes executados e o resumo `N passed / M failed`.
- Resultado para o runner: `--reporter=list,json` com a saída JSON apontada para
  `config.evidence.artifacts.frontend_result` (`PLAYWRIGHT_JSON_OUTPUT_NAME` ou `reporter: [['json', { outputFile }]]`).

### E7. result
- JSON do reporter do Playwright em `config.evidence.artifacts.frontend_result`:
  `stats.expected` (passou), `stats.unexpected` (falhou), `stats.flaky`, `stats.skipped`;
  total = soma dos quatro.
- Por falha: percorrer `suites[].specs[].tests[].results[]` com `status` diferente de `passed`/`skipped`,
  pegando título do spec, `error.message`, primeiras linhas de `error.stack` e os `attachments` (vídeo,
  screenshot, trace).
