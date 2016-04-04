# [Botkit](http://howdy.ai/botkit) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)

Botkit designed to ease the process of designing and running useful, creative or just plain weird bots (and other types of applications) that live inside [Slack](http://slack.com)!

It provides a semantic interface to sending and receiving messages
so that developers can focus on creating novel applications and experiences
instead of dealing with API endpoints.

Botkit features a comprehensive set of tools
to deal with [Slack's integration platform](http://api.slack.com), and allows
developers to build both custom integrations for their
team, as well as public "Slack Button" applications that can be
run from a central location, and be used by many teams at the same time.

---

2) First make a bot integration inside of your Slack channel. Go here:

https://my.slack.com/services/new/bot

Enter a name for your bot.
Make it something fun and friendly, but avoid a single task specific name.
Bots can do lots! Let's not pigeonhole them.

3) When you click "Add Bot Integration", you are taken to a page where you can add additional details about your bot, like an avatar, as well as customize its name & description.

Copy the API token that Slack gives you. You'll need it.

4) Run the example bot app, using the token you just copied:
​
```
token=REPLACE_THIS_WITH_YOUR_TOKEN node bot.js
```
​
5) Your bot should be online! Within Slack, send it a quick direct message to say hello. It should say hello back!

Try:
  * who are you?
  * call me Bob
  * shutdown
​

### Things to note
​
Much like a vampire, a bot has to be invited into a channel. DO NOT WORRY bots are not vampires.

Type: `/invite @<my bot>` to invite your bot into another channel.

## Basic Usage

Here's an example of using Botkit with Slack's [real time API](https://api.slack.com/rtm), which is the coolest one because your bot will look and act like a real user inside Slack.

This sample bot listens for the word "hello" to be said to it -- either as a direct mention ("@bot hello") or an indirect mention ("hello @bot") or a direct message (a private message inside Slack between the user and the bot).

The Botkit constructor returns a `controller` object. By attaching event handlers
to the controller object, developers can specify what their bot should look for and respond to,
including keywords, patterns and various [messaging and status events](#responding-to-events).
These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human say THIS the bot does THAT."

The `controller` object is then used to `spawn()` bot instances that represent
a specific bot identity and connection to Slack. Once spawned and connected to
the API, the bot user will appear online in Slack, and can then be used to
send messages and conduct conversations with users. They are called into action by the `controller` when firing event handlers.


```javascript
var Botkit = require('botkit');

var controller = Botkit.slackbot({
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: <my_slack_bot_token>,
}).startRTM()

// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

  bot.reply(message,'Hello yourself.');

});

```

## Connecting Your Bot to Slack

Bot users connect to Slack using a real time API based on web sockets.
The bot connects to Slack using the same protocol that the native Slack clients use!

To connect a bot to Slack, [get a Bot API token from the Slack integrations page](https://my.slack.com/services/new/bot).

Note: Since API tokens can be used to connect to your team's Slack, it is best practices to handle API tokens with caution. For example, pass tokens in to your application via evironment variable or command line parameter rather than include it in the code itself.
This is particularly true if you store and use API tokens on behalf of users other than yourself!

[Read Slack's Bot User documentation](https://api.slack.com/bot-users)

### Responding to events

Once connected to Slack, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events.

Botkit's message parsing and event system does a great deal of filtering on this
real time stream so developers do not need to parse every message.  See [Receiving Messages](#receiving-messages)
for more information about listening for and responding to messages.

It is also possible to bind event handlers directly to any of the enormous number of native Slack events, as well as a handful of custom events emitted by Botkit.

You can receive and handle any of the [native events thrown by slack](https://api.slack.com/events).

```javascript
controller.on('channel_joined',function(bot,message) {

  // message contains data sent by slack
  // in this case:
  // https://api.slack.com/events/channel_joined

});
```

You can also receive and handle a long list of additional events caused
by messages that contain a subtype field, [as listed here](https://api.slack.com/events/message)

```javascript
controller.on('channel_leave',function(bot,message) {

  // message format matches this:
  // https://api.slack.com/events/message/channel_leave

})
```

Finally, Botkit throws a handful of its own events!
Events related to the general operation of bots are below.
When used in conjunction with the Slack Button, Botkit also fires
a [few additional events](#using-the-slack-button).


## Receiving Messages

Botkit bots receive messages through a system of event handlers. Handlers can be set up to respond to specific types of messages,or to messages that match a given keyword or pattern.

For Slack, Botkit supports five type of message event:

| Event | Description
|--- |---
| message_received  | This event is fired for any message of any kind that is received and can be used as a catch all
| ambient | Ambient messages are messages that the bot can hear in a channel, but that do not mention the bot in any way
| direct_mention| Direct mentions are messages that begin with the bot's name, as in "@bot hello"
| mention | Mentions are messages that contain the bot's name, but not at the beginning, as in "hello @bot"
| direct_message | Direct messages are sent via private 1:1 direct message channels

These message events can be handled using by attaching an event handler to the main controller object.
These event handlers take two parameters: the name of the event, and a callback function which is invoked whenever the event occurs.
The callback function receives a bot object, which can be used to respond to the message, and a message object.

```javascript
// reply to @bot hello
controller.on('direct_mention',function(bot,message) {

  // reply to _message_ by using the _bot_ object
  bot.reply(message,'I heard you mention me!');

});

// reply to a direct message
controller.on('direct_message',function(bot,message) {

  // reply to _message_ by using the _bot_ object
  bot.reply(message,'You are talking directly to me');

});

```

## Single message Replies

controller.on('ambient',function(bot,message) {

    // do something...

    // then respond with a message object
    bot.reply(message,{
      text: "A more complex response",
      username: "ReplyBot",
      icon_emoji: ":dash:",
    });

})

//Using attachments

``
controller.hears('another_keyword','direct_message,direct_mention',function(bot,message) {
  var reply_with_attachments = {
    'username': 'My bot' ,
    'text': 'This is a pre-text',
    'attachments': [
      {
        'fallback': 'To be useful, I need your to invite me in a channel.',
        'title': 'How can I help you?',
        'text': 'To be useful, I need your to invite me in a channel ',
        'color': '#7CD197'
      }
    ],
    'icon_url': 'http://lorempixel.com/48/48'
    }

  bot.reply(message, reply_with_attachments);
});
``

### Multi-message Replies to Incoming Messages

#### bot.startPrivateConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startPrivateConversation()` works just like `startConversation()`, but the resulting
conversation that is created will occur in a private direct message channel between
the user and the bot.

It is possible to initiate a private conversation by passing a message object, containing the user's Slack ID.

```javascript
//assume var user_id has been defined
bot.startPrivateConversation({user: user_id}, function(response, convo){
  convo.say('Hello, I am your bot.')
})
```

### Control Conversation Flow

//Using attachments
var message_with_attachments = {
  'username': 'My bot' ,
  'text': 'this is a pre-text',
  'attachments': [
    {
      'fallback': 'To be useful, I need your to invite me in a channel.',
      'title': 'How can I help you?',
      'text': ' To be useful, I need your to invite me in a channel ',
      'color': '#7CD197'
    }
  ],
  'icon_url': 'http://lorempixel.com/48/48'
}

## Working with Slack Integrations

There are a dizzying number of ways to integrate your application into Slack.
Up to this point, this document has mainly dealt with the real time / bot user
integration.  In addition to this type of integration, Botkit also supports:

* Incoming Webhooks - a way to send (but not receive) messages to Slack
* Outgoing Webhooks - a way to receive messages from Slack based on a keyword or phrase
* Slash Command - a way to add /slash commands to Slack
* Slack Web API - a full set of RESTful API tools to deal with Slack
* The Slack Button - a way to build Slack applications that can be used by multiple teams


```javascript
var Botkit = require('botkit');
var controller = Botkit.slackbot({})

var bot = controller.spawn({
  token: my_slack_bot_token
});

// use RTM
bot.startRTM(function(err,bot,payload) {
  // handle errors...
});

// send webhooks
bot.configureIncomingWebhook({url: webhook_url});
bot.sendWebhook({
  text: 'Hey!',
  channel: '#testing',
},function(err,res) {
  // handle error
});

// receive outgoing or slash commands
// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(process.env.port,function(err,webserver) {

  controller.createWebhookEndpoints(controller.webserver);

});

controller.on('slash_command',function(bot,message) {

  // reply to slash command
  bot.replyPublic(message,'Everyone can see the results of this slash command');

});
```



### Incoming webhooks

Incoming webhooks allow you to send data from your application into Slack.
To configure Botkit to send an incoming webhook, first set one up
via [Slack's integration page](https://my.slack.com/services/new/incoming-webhook/).

Once configured, use the `sendWebhook` function to send messages to Slack.

[Read official docs](https://api.slack.com/incoming-webhooks)

#### bot.configureIncomingWebhook()
| Argument | Description
|--- |---
| config | Configure a bot to send webhooks

Add a webhook configuration to an already spawned bot.
It is preferable to spawn the bot pre-configured, but hey, sometimes
you need to do it later.

#### bot.sendWebhook()
| Argument | Description
|--- |---
| message | A message object
| callback | _Optional_ Callback in the form function(err,response) { ... }

Pass `sendWebhook` an object that contains at least a `text` field.
 This object may also contain other fields defined [by Slack](https://api.slack.com/incoming-webhooks) which can alter the
 appearance of your message.

```javascript
var bot = controller.spawn({
  incoming_webhook: {
    url: <my_webhook_url>
  }
})

bot.sendWebhook({
  text: 'This is an incoming webhook',
  channel: '#general',
},function(err,res) {
  if (err) {
    // ...
  }
});
```

### Outgoing Webhooks and Slash commands

Outgoing webhooks and Slash commands allow you to send data out of Slack.

Outgoing webhooks are used to match keywords or phrases in Slack. [Read Slack's official documentation here.](https://api.slack.com/outgoing-webhooks)

Slash commands are special commands triggered by typing a "/" then a command.
[Read Slack's official documentation here.](https://api.slack.com/slash-commands)

Though these integrations are subtly different, Botkit normalizes the details
so developers may focus on providing useful functionality rather than peculiarities
of the Slack API parameter names.

Note that since these integrations use send webhooks from Slack to your application,
your application will have to be hosted at a public IP address or domain name,
and properly configured within Slack.

[Set up an outgoing webhook](https://xoxco.slack.com/services/new/outgoing-webhook)

[Set up a Slash command](https://xoxco.slack.com/services/new/slash-commands)

```javascript
controller.setupWebserver(port,function(err,express_webserver) {
  controller.createWebhookEndpoints(express_webserver)
});

controller.on('slash_command',function(bot,message) {

    // reply to slash command
    bot.replyPublic(message,'Everyone can see this part of the slash command');
    bot.replyPrivate(message,'Only the person who used the slash command can see this.');

})

controller.on('outgoing_webhook',function(bot,message) {

    // reply to outgoing webhook command
    bot.replyPublic(message,'Everyone can see the results of this webhook command');

})
```

#### controller.setupWebserver()
| Argument | Description
|---  |---
| port | port for webserver
| callback | callback function

Setup an [Express webserver](http://expressjs.com/en/index.html) for
use with `createwWebhookEndpoints()`

If you need more than a simple webserver to receive webhooks,
you should by all means create your own Express webserver!

The callback function receives the Express object as a parameter,
which may be used to add further web server routes.

#### controller.createWebhookEndpoints()

This function configures the route `http://_your_server_/slack/receive`
to receive webhooks from Slack.

This url should be used when configuring Slack.

When a slash command is received from Slack, Botkit fires the `slash_command` event.

When an outgoing webhook is recieved from Slack, Botkit fires the `outgoing_webhook` event.


#### bot.replyPublic()
| Argument | Description
|---  |---
| src | source message as received from slash or webhook
| reply | reply message (string or object)
| callback | optional callback

When used with outgoing webhooks, this function sends an immediate response that is visible to everyone in the channel.

When used with slash commands, this function has the same functionality. However,
slash commands also support private, and delayed messages. See below.
[View Slack's docs here](https://api.slack.com/slash-commands)

#### bot.replyPrivate()

| Argument | Description
|---  |---
| src | source message as received from slash
| reply | reply message (string or object)
| callback | optional callback


#### bot.replyPublicDelayed()

| Argument | Description
|---  |---
| src | source message as received from slash
| reply | reply message (string or object)
| callback | optional callback

#### bot.replyPrivateDelayed()

| Argument | Description
|---  |---
| src | source message as received from slash
| reply | reply message (string or object)
| callback | optional callback



### Using the Slack Web API

All (or nearly all - they change constantly!) of Slack's current web api methods are supported
using a syntax designed to match the endpoints themselves.

If your bot has the appropriate scope, it may call [any of these method](https://api.slack.com/methods) using this syntax:

```javascript
bot.api.channels.list({},function(err,response) {
  //Do something...
})
```
