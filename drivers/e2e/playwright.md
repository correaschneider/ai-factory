# E2E Driver — Playwright

**Selected when:** `config.stack.frontend.e2e` starts with `playwright`.
**Prerequisite:** `@playwright/test` installed in the test project (or in the image of
`config.docker.run[_frontend]`), with the browsers from the official Playwright image or installed at build time.

---

### E1. files
- File: `{config.tests.layout.frontend}/{feature}.spec.ts` (respect `testDir`/`testMatch` in
  `playwright.config.*`).
- Suite: `test.describe('{Feature} — Task {task_id}', () => { … })`.
- One scenario = one `test('E-01: {description}', async ({ page }) => { … })`. The plan's ID always at the start of the name.

### E2. auth
- Programmatic login per role, without a form, reusing what the project already has in
  `config.tests.frontend_cmds` (fixture, *setup project* or helper):
    - **setup project + `storageState`**: an `auth.setup.ts` logs in via the API and saves the state per role;
      the tests use `test.use({ storageState: '<role file>' })`;
    - **fixture**: `test.extend({ adminPage: … })` that authenticates via `request.post('{config.env.api_url}/…')`
      and injects token/cookie into the context.
- Cleanup in `test.afterAll`/`afterEach` with the authenticated `request` fixture, filtering by the data prefix.

### E3. wait
- Assertions that wait on their own: `await expect(locator).toBeVisible({ timeout: 10000 })`,
  `toHaveText`, `toHaveURL`, `toBeHidden`.
- Relevant request: `const r = page.waitForResponse('**/route'); await action; await r;`.
- `page.waitForTimeout(<ms>)` only for async state **after** a mutation, never to wait for the UI.

### E4. selectors
1. `page.getByTestId('…')` (attribute configurable in `use.testIdAttribute`);
2. role and accessible name: `page.getByRole('button', { name: 'Save' })`, `getByLabel('Email')`;
3. stable template attribute: `page.locator('[formcontrolname="email"]')`;
4. visible text: `page.getByText('…')`;
5. class/structure only as a last resort, with `// TODO: add data-testid="…"`.

### E5. evidence
- In `playwright.config.*`, the `use` block:
    - `video: 'on'` (or `'retain-on-failure'`) and `screenshot: 'only-on-failure'`;
    - `viewport` from `config.evidence.resolution`;
    - `launchOptions: { slowMo: Number(process.env.{config.evidence.slowmo_var} ?? 0) }` for *slow motion*.
- With `{config.evidence.mode_var}=true`, the runner exports the variables; videos and screenshots go to
  `test-results/` (or `outputDir`).

### E6. run
- Only the feature: `playwright test {config.tests.layout.frontend}/{feature}` (or `--grep 'E-0'` by ID).
- Confirm in the log the list of executed tests and the summary `N passed / M failed`.
- Result for the runner: `--reporter=list,json` with the JSON output pointed at
  `config.evidence.artifacts.frontend_result` (`PLAYWRIGHT_JSON_OUTPUT_NAME` or `reporter: [['json', { outputFile }]]`).

### E7. result
- Playwright reporter JSON in `config.evidence.artifacts.frontend_result`:
  `stats.expected` (passed), `stats.unexpected` (failed), `stats.flaky`, `stats.skipped`;
  total = sum of the four.
- Per failure: walk `suites[].specs[].tests[].results[]` with `status` other than `passed`/`skipped`,
  taking the spec title, `error.message`, first lines of `error.stack` and the `attachments` (video,
  screenshot, trace).
