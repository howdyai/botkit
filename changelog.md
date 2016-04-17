# Change Log

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
