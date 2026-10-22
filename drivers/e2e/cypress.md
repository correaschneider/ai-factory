# E2E Driver — Cypress

**Selected when:** `config.stack.frontend.e2e` starts with `cypress`, or the key is absent (default).
**Prerequisite:** Cypress installed in the test project (or in the image of `config.docker.run[_frontend]`).

---

### E1. files
- File: `{config.tests.layout.frontend}/{feature}.cy.ts` (or `.cy.js`, following the existing codebase).
- Suite: `describe('{Feature} — Task {task_id}', () => { … })`.
- One scenario = one `it('E-01: {description}', () => { … })`. The plan's ID always at the start of the name.

### E2. auth
- Login via the project's **custom command** (`config.tests.frontend_cmds`, usually in
  `cypress/support/commands.*`), called in `beforeEach` with the role: e.g. `cy.loginAs('admin')`.
- No custom command: `cy.request('POST', '{config.env.api_url}/…login…', {…})` and store the token/cookie the way
  the frontend expects (`cy.window().then(w => w.localStorage.setItem(…))` or `cy.setCookie`).
- Cleanup in `after`/`afterEach` via authenticated `cy.request`, filtering by the test's data prefix.

### E3. wait
- Wait by **assertion**: `cy.get(sel, { timeout: 10000 }).should('be.visible')`,
  `.should('contain', text)`, `.should('not.exist')`.
- Relevant request: `cy.intercept('POST', '**/route').as('x')` + `cy.wait('@x')` (waits for the call, not for a
  time). `cy.wait(<ms>)` only for async state **after** a mutation, never to wait for the UI.

### E4. selectors
1. `[data-testid="…"]` (or `data-cy`, if that is the project's standard);
2. stable template attribute (`[formcontrolname="email"]`, `[name="email"]`);
3. visible text with `cy.contains('button', 'Save')`;
4. class/structure only as a last resort, with `// TODO: add data-testid="…"`.

### E5. evidence
- Video: `video: true` in `cypress.config.*` (or `--config video=true` on the command line).
- Screenshot on failure: `cypress run` default (`screenshotOnRunFailure: true`).
- Resolution: `viewportWidth`/`viewportHeight` from `config.evidence.resolution`.
- *Slow motion*: Cypress has no native one; the project reads `{config.evidence.slowmo_var}` (ms) in a support
  hook. With `{config.evidence.mode_var}=true`, the runner exports both variables as `CYPRESS_*` or
  `--env`.

### E6. run
- Only the feature: `cypress run --spec '{config.tests.layout.frontend}/{feature}/**'`.
- Confirm in the log the `Spec Ran:` line (or the final table) with the feature's file.
- In a headless container, Xvfb conflict: use another display (e.g. `:98`).

### E7. result
- `cypress run` result (Module API or the project's JSON reporter) in
  `config.evidence.artifacts.frontend_result`: `totalTests`, `totalPassed`, `totalFailed`, `totalPending`.
- Per failure: full title of the `it`, error message, first lines of the stack, and the paths of the spec's
  video and of the failure screenshot.
