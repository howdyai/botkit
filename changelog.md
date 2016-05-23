# Change Log

## 0.1.2

*Slack changes:*

Adds authentication of incoming Slack webhooks if token specified. [More info](readme_slack.md#securing-outgoing-webhooks-and-slash-commands) [Thanks to [@sgud](https://github.com/howdyai/botkit/pull/167)]

Improves support for direct_mentions of bots in Slack (Merged [PR #189](https://github.com/howdyai/botkit/pull/189))

Make the oauth identity available to the user of the OAuth endpoint via `req.identity` (Merged [PR #174](https://github.com/howdyai/botkit/pull/174))

Fix issue where single team apps had a hard time receiving slash command events without funky workaround. (closes [Issue #108](https://github.com/howdyai/botkit/issues/108))

Add [team_slashcommand.js](/examples/team_slashcommand.js) and [team_outgoingwebhook.js](/examples/team_outgoingwebhook.js) to the examples folder.



*Facebook changes:*

The `attachment` field may now be used by Facebook bots within a conversation for both convo.say and convo.ask.  In addition, postback messages can now be received as the answer to a convo.ask in addition to triggering their own facebook_postback event. [Thanks to [@crummy](https://github.com/howdyai/botkit/pull/220) and [@tkornblit](https://github.com/howdyai/botkit/pull/208)]

Include attachments field in incoming Facebook messages (Merged [PR #231](https://github.com/howdyai/botkit/pull/231))

Adds built-in support for opening a localtunnel.me tunnel to expose Facebook webhook endpoint while developing locally. (Merged [PR #234](https://github.com/howdyai/botkit/pull/234))

## 0.1.1

Fix issue with over-zealous try/catch in Slack_web_api.js

## 0.1.0

Adds support for Facebook Messenger bots.

Rename example bot: bot.js became slack_bot.js

Add example bot: facebook_bot.js

## 0.0.15

Changes conversation.ask to use the same pattern matching function as
is used in `hears()`

Adds `controller.changeEars()` Developers can now globally change the
way Botkit matches patterns.


## 0.0.14

Add new middleware hooks. Developers can now change affect a message
as it is received or sent, and can also change the way Botkit matches
patterns in the `hears()` handler.

## 0.0.~

Next time I promise to start a change log at v0.0.0
