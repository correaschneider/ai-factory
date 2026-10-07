# Privacy policy

*Effective October 7, 2026. The change history of this page is in the
[repository](https://github.com/correaschneider/ai-factory/commits/main/docs/privacy.en.md).*

The **factory** plugin is open-source software that runs entirely inside the Claude Code of whoever
installs it. It has **no server, account, telemetry or data collection of its own**, and it sends no data
to the plugin author or to third parties chosen by the author. Everything happens within the permissions
the user has configured in Claude Code.

## What the plugin reads

- the `docs/factory.config.md` and the code of the project it runs in;
- tasks, epics and comments from the **tracker the user configured** (Jira, ClickUp, GitLab, GitHub or
  Markdown files), which may contain names and e-mails of assignees and authors;
- merge requests and pull requests from the **code host the user configured** (GitLab or GitHub), in the
  CR factory;
- public web pages, in the market research step of the PO factory.

## Where it writes

- in the **user's own repository**: artifacts in `docs/initiatives/<name>/`, code, tests and QA evidence;
- in the **configured tracker and code host**: issues, comments and status changes.

These artifacts may contain excerpts of the tasks that were read, including names and e-mails.

## Where data goes

Only to the services the user configured (tracker, code host and Claude Code's web search), using the
credentials the user already has for those services. The plugin **never reads credential files or
environment variables holding secrets**: access goes through CLIs and MCP servers that are already
authenticated.

Processing by the AI model happens in Claude Code, under the Anthropic terms and privacy policy the user
accepted to use Claude Code. The plugin does not change that.

## Retention and deletion

The plugin retains nothing. What is written follows the rules of the user's repository, tracker and code
host: deleting the artifact, comment or task deletes the data. Uninstalling the plugin
(`claude plugin uninstall factory@ai-factory`) removes the plugin; artifacts already written to the
repository stay there until the user deletes them.

## Responsibility for personal data

The user decides which data goes into tasks and which repositories and trackers the factory can access.
If tasks contain personal data, the user (or their organization) is the controller of that data under
GDPR, LGPD or the applicable law.

## Contact

Questions or requests about privacy:
[GitHub issues](https://github.com/correaschneider/ai-factory/issues).
