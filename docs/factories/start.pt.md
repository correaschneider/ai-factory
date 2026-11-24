# /factory:start

Pede para a fábrica **se apresentar para o projeto em que você está**: o que cada fábrica faz, quais estão
prontas aqui e o único comando a rodar em seguida.

```text
/factory:start
```

Só lê: nenhum arquivo é escrito, nada muda no tracker, nenhum build ou container roda.

## O que ela responde

| Estado do projeto | Resposta |
|---|---|
| Sem `docs/factory.config.md` | o que as fábricas PO, DEV, QA e CR fazem e por onde começar: `/factory:demo` (projeto de exemplo, uns 2 minutos) ou `/factory:init` (configurar este projeto) |
| Com config | quais fábricas estão prontas e, nas que não estão, as chaves de config que faltam; stories esperando no backlog ou no QA, quando o tracker pode ser listado; iniciativas recentes; **um** próximo comando |

O próximo comando segue uma ordem fixa: preencher o que trava uma fábrica → QA para a story que espera por ele →
DEV para a story no backlog → PO para uma iniciativa nova.

## A saudação depois de instalar ou atualizar

O Claude Code não tem evento de "acabou de instalar", então o plugin usa um hook `SessionStart`, que roda quando
a sessão abre e fica quieto quase sempre:

- **primeira sessão depois de instalar:** uma linha, *"Factory vX instalada. Digite /factory:start…"*;
- **primeira sessão depois de uma versão minor ou major nova:** uma linha com o que ela trouxe;
- **todas as outras sessões, e updates de patch:** nada.

A linha chega por dois canais, porque nem todo cliente mostra mensagem de hook: o CLI mostra a mensagem do
próprio hook no topo da sessão, e o hook também pede ao Claude para acrescentar essa linha no fim da **primeira
resposta** da sessão (o app desktop mostra só esta). As respostas seguintes nunca repetem.

O hook (`hooks/greet.sh`, bash puro) guarda só a última versão saudada, na pasta de dados do próprio plugin
(`$CLAUDE_PLUGIN_DATA`, apagada ao desinstalar). Sem rede, sem telemetria. A mensagem segue o `language` do
config do projeto, ou o locale do sistema.
