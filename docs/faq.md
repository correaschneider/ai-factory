# Perguntas frequentes

## A fábrica funciona com a minha stack?

Provavelmente. Nada nos commands é específico de framework: o vocabulário (migration, controller, entidade,
componente) e os comandos (build, testes, E2E) vêm do `stack` do config. O `/factory:init` reconhece de
cara Laravel, NestJS, Next.js e Angular; outras stacks ele detecta por evidência e pergunta.

## E com o meu tracker?

Jira, ClickUp, GitLab Issues e GitHub Issues têm driver pronto, e o driver `markdown` funciona sem tracker nenhum. Outro
sistema precisa de um [driver novo](reference/drivers.md): um arquivo Markdown, sem mexer nos commands.

## Preciso usar as quatro fábricas?

Não. Cada uma roda sozinha, desde que a task esteja no status de entrada dela. Dá para usar só a CR para
revisar MRs, ou só a QA para testar o que o time desenvolveu à mão.

## A fábrica faz push ou merge sozinha?

- **Push:** só se o config mandar. Com `dev.commit.push: manual` a DEV não faz push; com `mr` ela abre o
  Merge Request.
- **Merge:** nunca. Aprovar é decisão humana; a fábrica CR recomenda, e você aprova ou reprova.
- **Garantias fixas:** nenhuma fábrica commita em branch protegida, e nenhuma faz `push --force`.

## O que acontece quando o agente não sabe algo?

Ele não chuta. Na fábrica DEV o agent devolve `BLOCKED` com a pergunta, e o orquestrador pergunta a você.
Nas outras, a regra é a mesma: o que não está claro vira pergunta. Config com `TBD` faz a fábrica parar
antes de começar.

## Quanto custa rodar?

Depende do tamanho da task e dos modelos. Cada etapa é um agente com contexto próprio, e os papéis de
julgamento usam o modelo mais forte. Para economizar, rebaixe papéis em `models:` no config ou numa
execução com `--model`. Veja [Modelos por papel](reference/models.md).

## Que dados o plugin lê e para onde eles vão?

O plugin é só texto: não tem servidor, hooks nem código próprio. Ele pede ao Claude Code que leia o
repositório, fale com o tracker e o code host que **você** configurou e rode os comandos do seu config
(build, testes, docker, git). Nada vai para outro destino. Detalhes na
[política de privacidade](https://github.com/correaschneider/ai-factory#privacidade).

## Os artefatos em `docs/initiatives/` devem ir para o git?

Sim, recomendado. Eles explicam por que o código é como é: pesquisa, decisões do blueprint, plano técnico,
reviews e resultado do QA. As evidências de vídeo podem ficar de fora, se pesarem.

## Onde reporto um problema?

Em [issues no GitHub](https://github.com/correaschneider/ai-factory/issues).
