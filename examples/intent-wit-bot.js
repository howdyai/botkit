/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates usage of the `hearsIntent()` function.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node intent-wit-bot.js

# USE THE BOT:

  Say: "@intent-wit-bot: hi"

  You greeted me! Here is the outcome from wit.ai: {"_text":"hi","confidence":0.54,"intent":"greeting","entities":{}}

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var Botkit = require('../lib/Botkit.js');


if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
 debug: false
});

controller.spawn({
  token: process.env.token,
  token_wit: process.env.token_wit
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});


controller.hearsIntent(['yes', 'no'], 0.5, ['direct_message','direct_mention','mention'], function(bot, message, outcome) {
    bot.reply(message,"You said yes or no! Here is the outcome from wit.ai: " + JSON.stringify(outcome));
});

controller.hearsIntent('greeting', 0.5, ['direct_message','direct_mention','mention'], function(bot, message, outcome) {
    bot.reply(message,"You greeted me! Here is the outcome from wit.ai: " + JSON.stringify(outcome));
});

controller.hears('help', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    bot.reply(message, "I can also use normal `hears()` in addition to the fancy `hearsIntent()`.");
});
