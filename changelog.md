# Change Log

## 0.4.1

This release contains many small fixes and updates to keep up with the ever changing platforms!

BIG CHANGES:

Slack bots will now send messages via the Web API instead of the RTM. This behavior can be changed by passing `send_via_rtm: true` to `controller.spawn()`

Adds [ConsoleBot](lib/ConsoleBot.js) for creating bots that work on the command line

Adds a new [Middleware Readme](readme-middlewares.md) for documenting the existing middleware modules

Adds an example for using quick replies in the [Facebook Example Bot](facebook_bot.js)

Adds additional fields to Facebook messages to specify if they are `facebook_postback`s or normal messages.

Adds optional `hostname` field to constructor functions to bind Express to a specific IP.

Fixes for Slack's files.upload API

Merge in numerous pull requests from the community:
[PR #461](https://github.com/howdyai/botkit/pull/461)
[PR #465](https://github.com/howdyai/botkit/pull/465)
[PR #466](https://github.com/howdyai/botkit/pull/466)
[PR #469](https://github.com/howdyai/botkit/pull/469)
[PR #472](https://github.com/howdyai/botkit/pull/472)
[PR #474](https://github.com/howdyai/botkit/pull/474)
[PR #434](https://github.com/howdyai/botkit/pull/434)
[PR #435](https://github.com/howdyai/botkit/pull/435)
[PR #440](https://github.com/howdyai/botkit/pull/440)
[PR #441](https://github.com/howdyai/botkit/pull/441)
[PR #443](https://github.com/howdyai/botkit/pull/443)
[PR #446](https://github.com/howdyai/botkit/pull/446)
[PR #448](https://github.com/howdyai/botkit/pull/448)


## 0.4

Add support for Botkit Studio APIs. [More Info](readme-studio.md)

Substantially expanded the documentation regarding Botkit's [conversation thread system](readme.md#conversation-threads).

Add support for Microsoft Bot Framework.  The [Microsoft Bot Framework](https://botframework.com) makes it easy to create a single bot that can run across a variety of messaging channels including [Skype](https://skype.com), [Group.me](https://groupme.com), [Facebook Messenger](https://messenger.com), [Slack](https://slack.com),
[Telegram](https://telegram.org/), [Kik](https://www.kik.com/), [SMS](https://www.twilio.com/), and [email](https://microsoft.office.com). [More Info](readme-botframework.md)

Updates to Facebook Messenger connector to support features like message echoes, read receipts, and quick replies.

Merged numerous pull requests from the community:
[PR #358](https://github.com/howdyai/botkit/pull/358)
[PR #361](https://github.com/howdyai/botkit/pull/361)
[PR #353](https://github.com/howdyai/botkit/pull/353)
[PR #363](https://github.com/howdyai/botkit/pull/363)
[PR #320](https://github.com/howdyai/botkit/pull/320)
[PR #319](https://github.com/howdyai/botkit/pull/319)
[PR #317](https://github.com/howdyai/botkit/pull/317)
[PR #299](https://github.com/howdyai/botkit/pull/299)
[PR #298](https://github.com/howdyai/botkit/pull/298)
[PR #293](https://github.com/howdyai/botkit/pull/293)
[PR #256](https://github.com/howdyai/botkit/pull/256)
[PR #403](https://github.com/howdyai/botkit/pull/403)
[PR #392](https://github.com/howdyai/botkit/pull/392)



In order to learn about and better serve our user community, Botkit now sends anonymous usage stats to stats.botkit.ai. To learn about opting out of stats collection, [read here](readme.md#opt-out-of-stats).

## 0.2.2

Add support for Slack Interactive Messages.

Add example of Slack button application that provides a bot that uses interactive messages.

New functionality in Slack bot: Botkit will track spawned Slack bots and route incoming webhooks to pre-existing RTM bots. This enables RTM bots to reply to interactive messages and slash commands.

## 0.2.1

Improves Slack RTM reconnects thanks to @selfcontained [PR #274](https://github.com/howdyai/botkit/pull/274)

## 0.2

Adds support for Twilio IP Messenging bots

Add example bot: twilio_ipm_bot.js

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
