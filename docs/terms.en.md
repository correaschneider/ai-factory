# Terms of use

*Effective October 7, 2026. The change history of this page is in the
[repository](https://github.com/correaschneider/ai-factory/commits/main/docs/terms.en.md).*

## 1. What the plugin is

**factory** is free, open-source software distributed under the [MIT license](https://github.com/correaschneider/ai-factory/blob/main/LICENSE).
It is a set of instructions (commands, agents and drivers in Markdown) that Claude Code runs in the user's
own environment. **It is not a hosted service**: there is no account, subscription, server or charge, and
using the plugin creates no commercial relationship with the author.

## 2. No warranty

As the MIT license states, the plugin is provided **"as is"**, without warranty of any kind. The author is
not liable for damages arising from its use, including data loss, incorrect code, build failures, unwanted
actions in trackers or repositories, or AI model usage costs.

## 3. User responsibility

The plugin coordinates AI agents that read and write the repository, run commands (build, tests, `git`,
`docker`, code host CLIs) and change the tracker. The user is responsible for:

- **reviewing** what the agents produce before using it in production: code, tests, commits, merge/pull
  requests, comments and status changes;
- **configuring the permissions** of Claude Code and the credentials of connected services according to
  the project's risk;
- the **data** they put into tasks and into the repositories the factory accesses (see the
  [privacy policy](privacy.md));
- the **costs** of using Claude and the connected services.

The factories are designed with stopping points for human decisions (review approval, config
confirmation, questions instead of assumptions), but these points **do not replace** the user's own review.

## 4. Acceptable use

The user agrees not to use the plugin to violate laws, third-party rights or the terms of the services
connected to it, including the terms and usage policy of Anthropic, the tracker and the code host.

## 5. Third-party services and trademarks

The plugin works with third-party services (Claude Code, Jira, ClickUp, GitLab, GitHub, Cypress, Playwright
and others), each subject to its own terms. The names and trademarks mentioned belong to their owners. The
plugin is **not official nor affiliated** with Anthropic or any of these services.

## 6. Changes

These terms may change with new versions of the plugin. The version in force is always the one published
on this page, and the history is kept in the repository.

## 7. Contact

[GitHub issues](https://github.com/correaschneider/ai-factory/issues).
