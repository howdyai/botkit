# botbuilder-adapter-slack changelog

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
