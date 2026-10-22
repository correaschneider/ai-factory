# Política de privacidade

*Vigente desde 07/10/2026. O histórico de mudanças desta página fica no
[repositório](https://github.com/correaschneider/ai-factory/commits/main/docs/privacy.md).*

O plugin **factory** é software livre que roda inteiramente dentro do Claude Code de quem o instala. Ele
**não tem servidor, conta, telemetria nem coleta própria**, e não envia dado para o autor do plugin nem para
terceiros escolhidos por ele. Tudo acontece dentro das permissões que o próprio usuário configurou no
Claude Code.

## O que o plugin lê

- o `docs/factory.config.md` e o código do projeto em que roda;
- tasks, épicos e comentários do **tracker configurado pelo usuário** (Jira, ClickUp, GitLab, GitHub ou
  arquivos Markdown), que podem conter nomes e e-mails de responsáveis e autores;
- merge requests e pull requests do **code host configurado** (GitLab ou GitHub), na fábrica CR;
- páginas públicas da web, na etapa de pesquisa de mercado da fábrica PO.

## Onde ele grava

- no **repositório do próprio usuário**: artefatos em `docs/initiatives/<nome>/`, código, testes e
  evidências de QA;
- no **tracker e no code host configurados**: issues, comentários e mudanças de status.

Esses artefatos podem conter trechos das tasks lidas, inclusive nomes e e-mails.

## Para onde os dados vão

Somente para os serviços que o próprio usuário configurou (tracker, code host e a busca web do Claude
Code), usando as credenciais que ele já tem nesses serviços. O plugin **nunca lê arquivo de credencial nem
variável de ambiente com segredo**: o acesso passa pelas CLIs e servidores MCP já autenticados.

O processamento pelo modelo de IA acontece no Claude Code, sob os termos e a política de privacidade da
Anthropic que o usuário aceitou ao usar o Claude Code. O plugin não muda isso.

## Retenção e exclusão

O plugin não retém nada. O que fica gravado segue as regras do repositório, do tracker e do code host do
usuário: apagar o artefato, o comentário ou a task apaga o dado. Desinstalar o plugin
(`claude plugin uninstall factory@ai-factory`) remove o plugin; os artefatos já gravados no repositório
continuam lá até o usuário apagá-los.

## Responsabilidade sobre dados pessoais

Quem decide quais dados entram nas tasks e quais repositórios e trackers a fábrica acessa é o usuário. Se
as tasks tiverem dados pessoais, o usuário (ou a organização dele) é o controlador desses dados perante a
LGPD, o GDPR ou a lei aplicável.

## Contato

Dúvidas ou pedidos sobre privacidade:
[issues no GitHub](https://github.com/correaschneider/ai-factory/issues).
