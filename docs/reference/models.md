# Modelos por papel

Cada worker roda no modelo mais adequado ao tipo de trabalho. O **orquestrador** resolve o modelo e o passa
ao subir cada worker.

## Padrões

| Nível | Tipo de trabalho | Papéis | Modelo |
|---|---|---|---|
| 1 | **julgamento**: decisões caras de errar | `dev.tech_lead`, `dev.code_reviewer`, `cr.security`, `po.blueprint`, `qa.planner` | `fable` |
| 2 | **volume**: muito código ou muita leitura | `dev.developer`, `qa.backend`, `qa.frontend`, `po.researcher`, `po.codemap`, `cr.reviewer` | `opus` |
| 3 | **mecânico**: rodar, reportar, editar pontualmente | `dev.self_test`, `dev.doc_sync`, `qa.runner`, `po.tasks` | `sonnet` |

## Ordem de resolução

O primeiro que existir vence:

1. `--model <papel>=<valor>` nos argumentos da execução;
2. `models.<papel>` no `factory.config.md`;
3. `models.default`, se for diferente de `inherit`;
4. o padrão do plugin (tabela acima).

```yaml
models:
  default: inherit        # sem efeito: vale o padrão de cada papel
  dev.developer: fable    # neste projeto, o developer sobe um nível
  qa.runner: haiku        # e o runner desce
```

```text
/factory:dev APP-012 --model dev.developer=fable --model dev.tech_lead=opus
```

## Regras

- Valores válidos: `fable`, `opus`, `sonnet`, `haiku` e `inherit`. Qualquer outro faz a fábrica parar na
  ETAPA 0.
- São **apelidos**: acompanham sempre a versão mais nova de cada modelo, sem precisar editar o config.
- O modelo do **orquestrador** não é configurável: é o da sua sessão. Ele já está rodando quando lê o
  config.
