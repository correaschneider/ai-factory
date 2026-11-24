# Changelog

Semver: **major** = quebra de config/contrato (chave obrigatória nova no `CONTRACT.md`, op de driver com
assinatura nova); **minor** = fábrica, driver ou op nova; **patch** = ajuste de prompt/correção.

## 1.6.3 — 2026-11-24
- Ajustes pedidos pela revisão automática do diretório (que recusou a 1.6.2 pelos avisos): a instalação no README e
  no "Primeiros passos" aponta para o guia do Claude Code em vez de mostrar os comandos; o README descreve a
  checagem de status HTTP sem citar a ferramenta; o checklist do CR de segurança descreve execução dinâmica de
  código sem nomear a função; o CHANGELOG não cita mais o nome do arquivo do logo.

## 1.6.2 — 2026-11-24
- Logo da documentação em PNG: o diretório só aceita SVG no ícone do próprio plugin, e recusou a 1.5.0 e a 1.6.1
  por causa do SVG do logo.

## 1.6.1 — 2026-11-24
- **Sem hook.** O diretório de plugins só aceita hooks e scripts de organizações verificadas e recusou a 1.6.0;
  `hooks/` saiu, e o plugin volta a ser só texto. O `/factory:start` fica e é a porta de entrada depois de instalar.
- README, FAQ e política de privacidade voltam a dizer que não há hooks nem arquivo local.

## 1.6.0 — 2026-11-24
- **`/factory:start`**: a fábrica se apresenta para o projeto em que você está. Sem config, mostra o que cada
  fábrica faz e manda para `/factory:demo` ou `/factory:init`; com config, mostra o que está pronto (PO, DEV, QA,
  CR), o trabalho em andamento no tracker e um próximo comando. Só leitura.
- **Saudação única** por hook `SessionStart` (`hooks/greet.sh`, bash): uma linha depois da 1ª instalação e uma a
  cada versão minor/major nova ("o que mudou"); silêncio no resto, inclusive em patch. Guarda só a última versão
  saudada em `$CLAUDE_PLUGIN_DATA`; sem rede, sem telemetria. Idioma pelo `language` do config ou pelo locale.
  Como o app desktop não exibe mensagem de hook de `SessionStart`, o hook também pede ao Claude uma linha no fim
  da 1ª resposta da sessão (só uma vez).
- README, FAQ e política de privacidade atualizados: o plugin agora tem um script (o hook).

## 1.5.0 — 2026-11-24
- **Profundidade (`lean` · `standard` · `deep`)** no `/factory:po` e no `/factory:dev`. O PO abre com uma
  **triagem**: procura trabalho já existente no tracker (op nova `search`), confere se bloqueios declarados ainda
  valem e sugere a profundidade, que você confirma ou força com `--depth`.
  - `lean`: worker novo `po-brief` (dor, onde mexer com `arquivo:linha`, critérios, riscos; ~80 linhas) → Stories,
    sem Epic quando é uma só. Na DEV, sem tech-lead, e code review só com diff sensível.
  - `standard`: codemap + blueprint enxutos (~300 linhas), sem pesquisa de mercado; tech-lead em modo curto.
  - `deep`: o pipeline de sempre.
- A profundidade viaja como label `depth:*` e a DEV herda (task sem label = `deep`, comportamento anterior).
  Agentes podem devolver `ESCALATE` para subir a profundidade, sempre com pergunta ao humano.
- **1 Story = 1 PR revisável**: blueprint não fatia por camada; decisões comuns ficam só no Epic, sem cópia em
  cada Story.
- Chaves opcionais: `po.default_depth`, `dev.default_depth`, `dev.lean_review_lines`, `dev.sensitive_paths`;
  papel de modelo `po.brief` (nível 1). A demo roda com `--depth deep`.

## 1.4.1 — 2026-10-22
- README em inglês com **"First 5 minutes"** no topo (instalar → `/factory:demo` → `/factory:init`).
- Site com **inglês como idioma padrão** e português em `/pt/`; "Getting started" e a home abrem pela demo. (#11)

## 1.4.0 — 2026-10-22
- **`/factory:demo`**: primeiro uso sem preparo. Cria um projeto de exemplo (Notely, com mapa de CodeBase), um
  kanban em Markdown e o config, e roda a fábrica PO numa iniciativa de exemplo, sem tracker nem MCP. (#10)
- Workers aceitam `Project root: <path>` no prompt para resolver caminhos relativos fora do diretório atual.

## 1.3.0 — 2026-10-22
- **Instruções em inglês** (commands, agents, workers, drivers, `CONTRACT.md`). Tudo o que a fábrica escreve
  (artefatos, comentários no tracker e no MR, mensagens) segue `language` do `factory.config.md`; sem a chave,
  o idioma em que o usuário escreve. Textos fixos dos drivers são templates no idioma de saída. (#9)
- Marcadores padronizados: `# suggestion:` / `# weak candidate:` / `# no evidence` no config, `// POTENTIAL BUG`
  nos testes, escopo `both`, pasta de evidências `evidence/`, campo `logical_status` no `fetch`.
- Descrição da listagem em inglês.

## 1.2.1 — 2026-10-07
- Páginas de **política de privacidade** e **termos de uso** no site (PT/EN).
- `plugin.json`: `documentationUrl`, `supportUrl`, `privacyPolicyUrl` e `termsOfServiceUrl` apontando pro site, e `keywords` para a busca do diretório.

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
- Repositório também é marketplace (`.claude-plugin/marketplace.json`), adicionável pelo nome `correaschneider/ai-factory`.
- README: seção de privacidade e do que o plugin executa/envia; ícone; drivers de SCM sem referência a arquivo de credencial.

## 1.0.0 — 2026-09-25
- Extraída do vault para plugin próprio (`/factory:po|dev|qa|cr|init`).
- Workers de PO/QA/CR em `workers/` (lidos por caminho, fora do menu); workers da DEV como agents `factory:dev-*`.
- Drivers em `drivers/{trackers,scm}/`; `CONTRACT.md` na raiz, resolvidos via `${CLAUDE_PLUGIN_ROOT}`.
- Modelos por papel (nível 1 `fable`, 2 `opus`, 3 `sonnet`) com override por projeto (`models:`) e por execução (`--model`).
- `/factory:init` sugere stack fora da lista por evidência e confirma antes de gravar.
