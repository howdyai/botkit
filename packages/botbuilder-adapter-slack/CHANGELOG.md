# botbuilder-adapter-slack changelog

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
