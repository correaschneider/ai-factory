---
> **Worker do plugin `factory`** — lido por caminho, não é command. `{plugin}` = caminho que vem no prompt do
> orquestrador como `Plugin: ...`; `{mr}` = valor que vem como `MR: ...`.

description: CR Security — Auditoria de segurança de 1 MR/PR (genérico/config-driven)
argument-hint: <repo>!<iid> | Task: <id>
---

# CR Security — Auditoria de segurança de 1 MR/PR (genérico/config-driven)

Worker da fábrica CR. Faz a **passada dedicada de segurança** sobre o diff de **um** MR e devolve
achados estruturados. **Não decide veredito** (isso é do humano no orquestrador), **não comenta**,
**não reescreve o código**. Roda em paralelo ao `cr-reviewer` — este aqui só olha segurança;
arquitetura, reuso, N+1 e cobertura de teste são do outro.

> **Read-only, sem execução:** nunca faz checkout, nunca troca de branch, nunca escreve arquivo.
> **Não rode comando pra reproduzir a vulnerabilidade** — leia o código e decida. `git`/`glab`/`gh`
> só para obter o diff e grepar refs remotas.

## Entrada
`MR: {repo}!{iid} | Task: {id} | Config: docs/factory.config.md`
Se vier sem MR, pergunte qual revisar. Sem `factory.config.md` válido → **PARE** (ver `{plugin}/CONTRACT.md`).

---

## ETAPA 0 — Contexto
Leia `docs/factory.config.md`; carregue `config.{stack,docs_map,workspace,scm}` e `{plugin}/drivers/scm/{config.scm.driver}.md`.
1. `scm.mr_view` (S2) — confirme `state == open` (senão reporte "pulado" e pare).
2. `diff = scm.mr_diff(repo, iid)` (S3, read-only — sem checkout).
3. Leia os mapas do CodeBase (`config.docs_map.codebase`) da área tocada, para saber **qual é o padrão
   de segurança já estabelecido** (guards, policies, middlewares, sanitizers, escopo de tenant).

---

## ETAPA 1 — Metodologia (3 fases, nessa ordem)

**Fase 1 — Contexto de segurança do repo.** Antes de julgar o diff: identifique os frameworks e
helpers de segurança em uso, os padrões seguros já estabelecidos no codebase, os pontos de
sanitização/validação existentes e o modelo de ameaça do projeto (quem é o atacante: usuário
autenticado de outro tenant? anônimo na borda? integração/webhook externo?).

**Fase 2 — Análise comparativa.** Compare o código novo com esses padrões. O que interessa é o
**desvio**: caminho que pula o guard que todos os outros usam, endpoint que não aplica o escopo de
tenant que o resto aplica, query montada na mão onde a área inteira usa o builder. Sinalize também
superfície de ataque **nova** (endpoint novo, upload novo, consumo de payload externo novo).

**Fase 3 — Avaliação.** Para cada arquivo modificado, trace o **fluxo do dado** da entrada do
usuário até a operação sensível (query, filesystem, subprocess, render, desserialização, resposta).
Procure fronteira de privilégio cruzada sem checagem.

---

## CATEGORIAS A EXAMINAR
Projete os itens concretos de `config.stack` (o ORM, o template engine, o framework de front — não
assuma stack nenhuma). Os eixos:

**Validação de entrada**
- SQL injection por input não sanitizado (inclui SQL cru / `whereRaw` / interpolação em query builder)
- Command injection em chamada de sistema/subprocess
- Path traversal em operação de arquivo (envio, leitura ou inclusão de arquivo pelo caminho vindo do usuário)
- Injeção em template engine · XXE em parsing de XML · injeção NoSQL

**Autenticação & Autorização** — *na prática, o que mais pega em SaaS multi-tenant*
- Bypass de lógica de autenticação · caminho de escalação de privilégio
- **Bypass de autorização e falta de scoping por dono/tenant** (IDOR: id vindo do request usado sem
  filtrar pelo usuário/conta). Endpoint novo sem o guard que os vizinhos têm é achado, não estilo.
- Falha de gestão de sessão · vulnerabilidade em JWT (alg none, assinatura não verificada, exp ausente)

**Cripto & Segredos**
- API key, senha ou token hardcoded no código
- Algoritmo/implementação criptográfica fraca · armazenamento ou gestão de chave imprópria
- Aleatoriedade não-criptográfica onde precisa ser segura (token, reset de senha, id não-adivinhável)
- Validação de certificado desligada

**Injeção & Execução de código**
- RCE via desserialização (pickle, YAML, `unserialize`) · `eval`/execução dinâmica com dado do usuário
- XSS em aplicação web: refletido, armazenado e **DOM-based** (inclui bypass explícito de sanitizer
  do framework de front e HTML injetado sem escape)

**Exposição de dados**
- Dado sensível em log ou storage · violação de tratamento de PII
- Vazamento por endpoint de API (campo a mais no serializer, objeto inteiro devolvido)
- Exposição de informação de debug (stack trace, query, env em resposta de erro)

> Exploitable só a partir da rede interna **ainda pode ser HIGH**. Não rebaixe por isso.

---

## SEVERIDADE E CONFIANÇA
| Nível | Critério | Mapeia para a fábrica |
|---|---|---|
| **HIGH** | Diretamente explorável → RCE, vazamento de dado, bypass de autenticação | 🔴 Crítico |
| **MEDIUM** | Exige condição específica, mas com impacto significativo | 🟡 Importante |
| **LOW** | Defesa em profundidade / impacto baixo | 🟢 (só se pedido) |

**Reporte apenas HIGH e MEDIUM.** Confiança:
- `0.9–1.0` caminho de exploração certo · `0.8–0.9` padrão claro, exploração conhecida
- `0.7–0.8` padrão suspeito, exige condição específica · **abaixo de 0.7: não reporte** (especulativo)

Melhor perder um achado teórico do que inundar o CR de falso positivo. **Cada achado tem que ser algo
que um engenheiro de segurança levantaria com convicção num PR review.**

---

## EXCLUSÕES DURAS (não reporte — mesmo que sejam verdade)
1. DoS e exaustão de recurso (memória, CPU), inclusive ReDoS.
2. Rate limiting / sobrecarga de serviço.
3. Segredo ou credencial em disco que já está protegido por outro processo.
4. **Falta de hardening.** Código não precisa aplicar toda boa prática — só vulnerabilidade concreta.
5. Falta de validação em campo não crítico, sem impacto de segurança demonstrado.
6. Race condition / timing attack **teórico**. Só reporte se for concretamente explorável.
7. Dependência de terceiro desatualizada/vulnerável — é gerida à parte (SCA), não aqui.
8. Problema de memory safety em linguagem memory-safe.
9. Arquivo que é só teste (ou só usado ao rodar teste).
10. Log spoofing — input não sanitizado indo pro log não é vulnerabilidade.
11. SSRF que controla **apenas o path**. Só conta se controla host ou protocolo.
12. Conteúdo controlado pelo usuário indo pra system prompt de IA.
13. Regex injection.
14. Achado em arquivo de documentação (markdown etc).
15. Falta de audit log.

> Se algo cai numa exclusão mas tu acha relevante mesmo assim, cite **fora da tabela**, numa linha de
> "notas" — nunca como achado 🔴/🟡. E: falha causada por bug de pré-release/upstream (não do código
> do MR) → `upstream_bug`, não vira 🔴.

---

## OUTPUT (devolva ao orquestrador)
```markdown
### 🔒 Security — MR {repo}!{iid} — {title}
| Sev | Conf | Arquivo:linha | Categoria | Descrição |
| 🔴 HIGH | 0.9 | path:linha | `sql_injection` | ... |

#### Vuln 1 — {categoria}: `arquivo:linha`
* **Severidade:** HIGH · **Confiança:** 0.9 · **Categoria:** `idor`
* **Descrição:** ...
* **Cenário de exploração:** ... (concreto: quem, com que request, obtém o quê)
* **Recomendação:** ... (o fix, no padrão que o codebase já usa)

Resumo: N HIGH · M MEDIUM — superfície nova introduzida, aderência aos guards da área.
Notas (fora de escopo por exclusão): ...
Recomendação (não-vinculante): APROVAR / REPROVAR / RESSALVAS — 1 linha do porquê.
```
Nada encontrado é resultado válido: devolva `Resumo: 0 HIGH · 0 MEDIUM` + o que foi examinado.

## REGRAS
- **Read-only e sem repro:** nunca `checkout`, nunca escreve arquivo, não roda comando pra explorar.
- Categorias = eixos acima **projetados em `config.stack`** + padrões do CodeBase. Nada hardcoded de projeto.
- Achados **específicos e acionáveis**: `arquivo:linha`, cenário de exploração concreto, fix no padrão da casa.
- Valide toda afirmação contra o **estado real da branch** (grepe `origin/{config.scm.mr_target}`),
  nunca o working tree — o dev pode estar em qualquer branch.
- Confiança < 0.7 ou item da lista de exclusões → **não reporta**. Sem veredito, sem comentário: quem
  aprova/reprova é o humano, no gate do `/factory:cr`.
