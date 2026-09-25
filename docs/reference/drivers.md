# Drivers

Um driver é um arquivo Markdown que ensina a fábrica a falar com um sistema. Há três eixos:

- **tracker** (`drivers/trackers/`): onde vivem as tasks; escolhido por `tracker.driver`;
- **SCM** (`drivers/scm/`): onde vivem os MRs/PRs, usado pela fábrica CR; escolhido por `scm.driver`;
- **E2E** (`drivers/e2e/`): a ferramenta de teste de frontend, usada pela fábrica QA; escolhida por
  `stack.frontend.e2e`.

## Drivers incluídos

| Driver | Eixo | Acesso | Forma do status no config |
|---|---|---|---|
| `jira` | tracker | servidor MCP da Atlassian | nome do status: `qa_gate: "PR"` |
| `clickup` | tracker | servidor MCP do ClickUp | nome do status: `in_qa: "em qa"` |
| `gitlab` | tracker | servidor MCP do GitLab | estado + label: `{state: opened, label: ready-for-qa}` |
| `github` | tracker | CLI `gh` autenticada (ou servidor MCP do GitHub) | estado + label: `{state: open, label: ready-for-qa}` |
| `markdown` | tracker | só arquivos, sem MCP | pasta + label: `{folder: em-qa, label: qa-iniciada}` |
| `gitlab` | SCM | CLI `glab` autenticada | — |
| `github` | SCM | CLI `gh` autenticada | — |

O driver `markdown` transforma uma pasta do repositório num kanban: cada task é um arquivo, cada coluna é
uma pasta. Serve para projetos sem tracker ou para testar a fábrica.

## Operações do tracker

| Operação | Entrada | Efeito |
|---|---|---|
| `fetch(id)` | id | devolve `{id, title, type, status_lógico, parent_id, branch, linked_mr, description, assignee}` |
| `read_blueprint(id)` | id | a especificação da task; por padrão, a própria descrição |
| `transition(id, alvo)` | id, status lógico | leva a task ao seletor de `tracker.status[alvo]`, trocando estado, pasta ou labels |
| `comment(id, md)` | id, Markdown | comenta; o driver converte o Markdown para o formato do sistema |
| `create_child_bug(task, título, md)` | task, título, corpo | cria um bug **ligado à task** e devolve o id |
| `label(id, alvo)` | id, label lógica | aplica `tracker.labels[alvo]` |
| `create_epic` · `create_story` · `link_dependency` · `update_epic` | — | autoria de épicos e stories (fábrica PO) |

Dois detalhes que todo driver trata:

- **Branch.** `fetch` precisa devolver a branch de desenvolvimento da task. Cada driver declara como: por
  convenção a partir do id, pelo MR ligado ou por um campo da task. A fábrica nunca assume o formato.
- **Status mais específico vence.** Se dois seletores casam (mesmo estado, um com label), o `fetch` devolve
  o que tem label.

## Operações do SCM

| Operação | Efeito |
|---|---|
| `find_mrs(task)` | MRs abertos com destino `scm.mr_target`: primeiro pelos links da task, depois pela convenção de branch; exclui a branch gêmea |
| `mr_view(repo, iid)` | metadados e estado (aberto, mergeado, fechado) |
| `mr_diff(repo, iid)` | diff unificado contra o destino, **sem checkout** |
| `mr_comment(repo, iid, md)` | comenta no MR (diferente do `comment` do tracker, que é na task) |

## Drivers de E2E

| Driver | Quando | Arquivo de teste | Resultado lido pelo runner |
|---|---|---|---|
| `cypress` | `stack.frontend.e2e` começa com `cypress`, ou está ausente | `{feature}.cy.ts`, `describe`/`it` | JSON do `cypress run` (`totalTests`, `totalPassed`, `totalFailed`) |
| `playwright` | `stack.frontend.e2e` começa com `playwright` | `{feature}.spec.ts`, `test.describe`/`test` | reporter JSON (`stats.expected`, `stats.unexpected`, `stats.flaky`, `stats.skipped`) |

O nome do driver é a primeira palavra de `stack.frontend.e2e` em minúsculas: `"Playwright 1.5x"` usa
`playwright`. Cada driver declara sete seções que os workers de QA seguem:

| Seção | O que define |
|---|---|
| E1 `files` | extensão, layout e sintaxe de suite e de teste, com o ID do cenário no nome |
| E2 `auth` | login programático por papel e limpeza via API |
| E3 `wait` | espera por asserção com timeout, nunca sleep fixo |
| E4 `selectors` | ordem de preferência de seletores e fallback |
| E5 `evidence` | como ligar vídeo, screenshot, *slow motion* e resolução a partir de `evidence.*` |
| E6 `run` | como rodar só os testes da feature e conferir no log |
| E7 `result` | formato do resultado e como extrair totais e falhas |

## Escrevendo um driver novo

Tracker, code host ou ferramenta de E2E nova é **um arquivo novo**, nenhum command muda:

1. Crie `drivers/trackers/<nome>.md` (ou `drivers/scm/<nome>.md`, ou `drivers/e2e/<nome>.md` com as seções E1–E7).
2. Declare três coisas:
    - **chaves de config** que o driver lê (por exemplo, `tracker.workspace_id`);
    - **capacidades** e o **fallback** de cada operação sem equivalente nativo (sem sub-issue, por
      exemplo: bug irmão com link);
    - **pré-requisito de acesso**: qual MCP, CLI ou API precisa estar configurado.
3. Mostre, para cada operação, a chamada real (ferramenta MCP, comando da CLI) e como o resultado vira o
   formato do contrato.
4. Use `tracker.driver: <nome>` no config do projeto.

**Mínimo viável:** o sistema precisa cumprir as seis operações do QA (com fallback aceitável), ter acesso
programático (MCP, CLI ou API) e conseguir representar `qa_gate` e `in_qa` de forma distinta, nem que seja
por uma label.

Os drivers existentes em
[`drivers/`](https://github.com/correaschneider/ai-factory/tree/main/drivers) servem de modelo.
