# Termos de uso

*Vigentes desde 07/10/2026. O histórico de mudanças desta página fica no
[repositório](https://github.com/correaschneider/ai-factory/commits/main/docs/terms.md).*

## 1. O que é o plugin

O **factory** é software livre e gratuito, distribuído sob a [licença MIT](https://github.com/correaschneider/ai-factory/blob/main/LICENSE).
Ele é um conjunto de instruções (commands, agents e drivers em Markdown) que o Claude Code executa no
ambiente do próprio usuário. **Não é um serviço hospedado**: não há conta, assinatura, servidor nem
cobrança, e usar o plugin não cria relação comercial com o autor.

## 2. Sem garantias

Como diz a licença MIT, o plugin é fornecido **"no estado em que se encontra"**, sem garantia de qualquer
tipo. O autor não responde por danos decorrentes do uso, inclusive perda de dados, código incorreto, falha
de build, ações indevidas em trackers ou repositórios, ou custos de uso de modelos de IA.

## 3. Responsabilidade do usuário

O plugin coordena agentes de IA que leem e escrevem no repositório, rodam comandos (build, testes, `git`,
`docker`, CLIs do code host) e alteram o tracker. O usuário é responsável por:

- **revisar** o que os agentes produzem antes de usar em produção: código, testes, commits, merge/pull
  requests, comentários e mudanças de status;
- **configurar as permissões** do Claude Code e as credenciais dos serviços conectados de acordo com o
  risco do projeto;
- os **dados** que coloca nas tasks e nos repositórios que a fábrica acessa (veja a
  [política de privacidade](privacy.md));
- os **custos** de uso do Claude e dos serviços conectados.

As fábricas foram desenhadas com pontos de parada para decisão humana (aprovação de review, confirmação de
config, perguntas em vez de suposições), mas esses pontos **não substituem** a revisão do usuário.

## 4. Uso aceitável

O usuário se compromete a não usar o plugin para violar leis, direitos de terceiros ou os termos dos
serviços que conecta a ele, incluindo os termos e a política de uso da Anthropic, do tracker e do code
host.

## 5. Serviços e marcas de terceiros

O plugin funciona com serviços de terceiros (Claude Code, Jira, ClickUp, GitLab, GitHub, Cypress, Playwright
e outros), cada um sujeito aos próprios termos. Os nomes e marcas citados pertencem aos seus donos. O plugin
**não é oficial nem afiliado** à Anthropic ou a qualquer desses serviços.

## 6. Mudanças

Estes termos podem mudar junto com novas versões do plugin. A versão vigente é sempre a publicada nesta
página, e o histórico fica no repositório.

## 7. Contato

[Issues no GitHub](https://github.com/correaschneider/ai-factory/issues).
