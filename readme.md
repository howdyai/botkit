# Botkit - A Node module to build magical Slack integrations

Botkit handles talking to all the various pieces of talking to Slack.

## Install it

this is not true yet.

```
npm install --save botkit
```

## Usage

NOTE: This is in a pre-release state, these docs will have to be
updated with the final public naming conventions, etc

```
var botkit = require('./Slackbot.js');

var bot = botkit({
  debug: true,
  path: './teams/',
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  port: process.env.port,
});

bot.on('ready',function() {

  bot.setupWebserver(function(err,webserver) {
    bot.createHomepageEndpoint(bot.webserver);
    bot.createOauthEndpoints(bot.webserver);
    bot.createWebhookEndpoints(bot.webserver);
  });

  setInterval(function() {
    bot.tick();
  },1000);

});

bot.init();
```

## Events

Bots can respond to all sorts of events. This is the main way they'll do their thing.

Bots trigger a bunch of custom events:

* slash_command
* outgoing_webhook
* direct_message
* direct_mention
* ambient
* mention
* message_received

They also trigger a bunch of built-in events from Slack:

* all of the other events too! https://api.slack.com/events




## "Hearing" things

```
bot.hears(['array','of','keywords','or','regexp patterns'],'events,to,listen',function(connection,message) {


})
```

Callback receives

## Using Botkit to build your own custom integration

## Using Botkit to build a Slack App integration

## Set Up OAuth
