# Changelog

Semver: **major** = quebra de config/contrato (chave obrigatória nova no `CONTRACT.md`, op de driver com
assinatura nova); **minor** = fábrica, driver ou op nova; **patch** = ajuste de prompt/correção.

## 1.2.0 — 2026-09-25
- QA agnóstica de ferramenta de E2E: novo eixo de drivers `drivers/e2e/` (`cypress`, `playwright`) com as seções E1–E7; `stack.frontend.e2e` escolhe o driver (ausente → `cypress`, sem quebrar configs existentes). `qa-frontend` e `qa-runner` deixam de assumir Cypress. (#4)

## 1.1.0 — 2026-09-25
- Driver de tracker **GitHub Issues** (`drivers/trackers/github.md`, via `gh`): status por estado + label de estágio, sub-issues e dependências "blocked by" nativas, com fallback por referência cruzada. `/factory:init` propõe o driver para remotes no github.com. (#5)

## 1.0.3 — 2026-09-25
- Documentação em https://correaschneider.github.io/ai-factory/ (MkDocs Material, português e inglês), publicada pelo GitHub Actions a cada merge na `main`.

## 1.0.2 — 2026-09-25
- `/factory:dev`: remove frontmatter duplicado (aparecia como texto no corpo) e usa `factory:dev-doc-sync`.
- `/factory:cr` e `CONTRACT.md`: caminhos e nomes antigos (`scm/`, `*-pipeline`) trocados pelos do plugin.

## 1.0.1 — 2026-09-25
- Repositório também é marketplace (`.claude-plugin/marketplace.json`): `claude plugin marketplace add correaschneider/ai-factory`.
- README: seção de privacidade e do que o plugin executa/envia; ícone; drivers de SCM sem referência a arquivo de credencial.

## 1.0.0 — 2026-09-25
- Extraída do vault para plugin próprio (`/factory:po|dev|qa|cr|init`).
- Workers de PO/QA/CR em `workers/` (lidos por caminho, fora do menu); workers da DEV como agents `factory:dev-*`.
- Drivers em `drivers/{trackers,scm}/`; `CONTRACT.md` na raiz, resolvidos via `${CLAUDE_PLUGIN_ROOT}`.
- Modelos por papel (nível 1 `fable`, 2 `opus`, 3 `sonnet`) com override por projeto (`models:`) e por execução (`--model`).
- `/factory:init` sugere stack fora da lista por evidência e confirma antes de gravar.
