# botbuilder-adapter-facebook changelog

# 1.0.11

* Update dependencies to Botkit 4.10, Bot Framework 4.10

# 1.0.10

* Update dependencies to Botkit 4.9, Bot Framework 4.9

# 1.0.7

* Fix for Facebook typing indicators. To send a typing indicator, use `await bot.say({sender_action: 'typing_on'});`

# 1.0.6

* Query parameters for GET apis can now be passed in using an object parameter (like POST): [Thanks to @adantoscano](https://github.com/howdyai/botkit/pull/1768)

* Update dependencies (Bot Framework to 4.6, Botkit to 4.6)

# 1.0.5

* Properly export the facebook_api class so it can be used directly. Thanks to [@luckyluo](https://github.com/howdyai/botkit/pull/1766)!

# 1.0.4

* Update dependencies (Bot Framework to 4.5.2, Botkit to 4.5)
* Fix for over-pruning of quick replies and attachments in dialogs

# 1.0.3

* Add `enable_incomplete` option to allow adapter to start without a complete config.

# 1.0.2

This was the first public release
