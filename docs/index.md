# Botkit

## Installation

Get botkit from NPM

```
npm install --save botkit
```


## Basic Usage

```
var botkit = require('botkit');

var bot = botkit.slackbot(configuration);
bot.init();

```

events
---
ready

## Single Team Bot

Use botkit to build a bot that will connect to your team (one team at a time).

These can just be manually configured by putting info into the script or environment variables!


## Multi Team Bot

This requires using oauth and the add to slack features.

also requires storing provisioning info for teams.

```
bot.setupWebserver(function(err,webserver) {
  bot.createHomepageEndpoint(bot.webserver);
  bot.createOauthEndpoints(bot.webserver);
  bot.createWebhookEndpoints(bot.webserver);
});
```

events
---
create_incoming_webhook
update_team
create_team

## Working with Slack Integrations

* Incoming webhooks (send data to slack)

```
bot.useConnection(connection);
bot.api.webhooks.send({
  text: 'This is an incoming webhook',
  channel: message.channel,
},function(err,res) {
  bot.debug('INCOMING WEBHOOK:',err,res);
  if (err) {
    bot.reply(message,'Incoming webhook error'+err);
  } else {
    bot.reply(message,'Incoming webhook success');
  }
});
```


* Outgoing webhooks (data sent from slack based on keyword)
* Slash commands (data sent from slack using a special command)

```
bot.setupWebserver(function(err,express_webserver) {
  createWebhookEndpoints(express_webserver)
});
```

events
---
slash_command
outgoing_webhook

special responses
---
you can respond immediately to these if you want...

* RTM api / bot users (real user that receives all messages)


```
bot.startRTM(connection,function(err,connection) { });
```

## Bots

Bots are the coolest type of integration! They are treated link users in Slack,
can be invited to channels and groups, and can do all sorts of cool stuff.
Botkit handles all the hard parts, and exposes simple event driven system
based around the bot "hearing" phrases or patterns.

For example:

```
var patterns = [
  '^hello$',
  '^hi$',
  '^howdy$'
]
var events = [
  'direct_message',
  'direct_mention'
]
bot.hears(patterns,events,function(message) {

  // do something!
  // send a simple reply
  bot.reply(message,'Heard you!');

  // get into a conversation
  bot.startTask(message,function(task,convo) {
    convo.say('Hey!');
    convo.ask('What up?',function(response) {
        // do something with response to question!
        convo.say('Got it.');
        convo.next();
    })
  })

});
```

events
---
direct_mention
direct_message
mention
ambient
message_received
* all the normal slack events


### Tasks and Conversations


## Event Handlers

All event handlers receive a `message` object.

It has the fields found in the Slack message,
https://api.slack.com/events
plus a few others.

_connection

connection contains information about the API connection
from which the message originated.  Also contains team id.

_connection.team.id



```
bot.on('message_received',function(message) {

})

bot.on('group_leave',function(message) {


})
```
