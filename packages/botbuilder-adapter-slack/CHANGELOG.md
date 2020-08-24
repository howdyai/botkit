# botbuilder-adapter-slack changelog


# 1.0.13

* Update dependencies to Botkit 4.10, Bot Framework 4.10
* Update @slack/web-api to 5.11.0


# 1.0.12

* Adjust startPrivateConversation to use converations.open instead of im.open


# 1.0.11

* Update dependencies to Botkit 4.9, Bot Framework 4.9
* Fox: Remove enforcement of as_user field when using v2 oauth - Thanks to [@garytowers](https://github.com/GaryTowers) for [this pull request](https://github.com/howdyai/botkit/pull/1944).

# 1.0.10

* FIX: Fixing a bug introduced in 4.8 pertaining to spawning proactive bots for Slack. [#1937](https://github.com/howdyai/botkit/issues/1937)

# 1.0.9

* Update @slack/web-api to 5.8.0 
* Add `oauthVersion` parameter to constructor. If set to `v2`, oauth features will use Slack's latest auth functions and urls. [More info](readme.md#using-slacks-v2-oauth)
* Make `authed_users` field available. [Fix for #1911](https://github.com/howdyai/botkit/issues/1911)

# 1.0.8

* Update @slack/web-api to 5.7.0 which includes access to new Oauth features (see [#1890](https://github.com/howdyai/botkit/pull/1890))
* Make `redirectUri` optional in type definition - thanks @yakirn [#1895](https://github.com/howdyai/botkit/pull/1895/files)

# 1.0.7

* Update @slack/web-api to 5.5.0

# 1.0.6

* Update dependencies (Bot Framework to 4.6, Botkit to 4.6)

# 1.0.5

* Add support for using the new [Block Kit modals](https://api.slack.com/block-kit/surfaces/modals).  Check out [this sample code for examples of using them](https://github.com/howdyai/botkit/blob/master/packages/testbot/features/slack_modals.js).
* Update to the latest version of the [@slack/web-api](https://www.npmjs.com/package/@slack/web-api), granting access to recently added methods like views.open, views.update
* Fix: previous versions incorrectly labeled incoming `block_actions` and `interactive_message` events as `message` events. This version corrects this - `controller.on('block_actions',...)` and `controller.hears(pattern,'block_actions',...)` should now work.
* Expand ability to "hear" block actions and use them in conversations. Selections from dropdowns and datepickers can now be heard by the bot and will be included as `message.text` in incoming messages.  Thanks to [@sfny](https://github.com/sfny) for the [pull request](https://github.com/howdyai/botkit/pull/1809)


# 1.0.4

* Update dependencies (Bot Framework to 4.5.2, Botkit to 4.5)
* Block actions and interactive button clicks are now classified as "message" type events, and thus included in conversations
* Update some type definitions in the Slack Dialog class.


# 1.0.3

* Fix typo in replyInteractive - Thanks to [@VictorGrycuk](https://github.com/VictorGrycuk) for [the fix](https://github.com/howdyai/botkit/pull/1650)
* Fix for handling some events that do not have a channel id - Thanks to [@roger-king](https://github.com/roger-king) and [@jebarjonet](https://github.com/jebarjonet) for help [trackign this down](https://github.com/howdyai/botkit/issues/1641)
* Update Typedef of Slack dialog options - Thanks to [@roger-king](https://github.com/roger-king)  for [the fix](https://github.com/howdyai/botkit/pull/1653)
* Add `enable_incomplete` option to allow adapter to start without a complete config.

# 1.0.2

* Fix for [getInstallLink()](https://github.com/howdyai/botkit/pull/1642) - now includes redirectUri if set.  Thanks to [@jebarjonet](https://github.com/jebarjonet) for the fix.
* Fix to TypeScript definition, - Thanks to [@roger-king](https://github.com/roger-king) for [this contribution](https://github.com/howdyai/botkit/pull/1634).

# 1.0.1

This was the first public release!
