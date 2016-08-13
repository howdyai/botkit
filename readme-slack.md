# Botkit and Slack

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.

Botkit features a comprehensive set of tools
to deal with [Slack's integration platform](http://api.slack.com), and allows
developers to build both custom integrations for their
team, as well as public "Slack Button" applications that can be
run from a central location, and be used by many teams at the same time.

This document covers the Slack-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Connecting Your Bot To Slack](#connecting-your-bot-to-slack)
* [Slack-specific Events](#slack-specific-events)
* [Working with Slack Custom Integrations](#working-with-slack-integrations)
* [Using the Slack Button](#use-the-slack-button)
* [Message Buttons](#message-buttons)

---
## Getting Started

1) Install Botkit [more info here](readme.md#installation)

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
token=REPLACE_THIS_WITH_YOUR_TOKEN node slack_bot.js
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


## Connecting Your Bot to Slack

Bot users connect to Slack using a real time API based on web sockets.
The bot connects to Slack using the same protocol that the native Slack clients use!

To connect a bot to Slack, [get a Bot API token from the Slack integrations page](https://my.slack.com/services/new/bot).

Note: Since API tokens can be used to connect to your team's Slack, it is best practices to handle API tokens with caution. For example, pass tokens in to your application via evironment variable or command line parameter rather than include it in the code itself.
This is particularly true if you store and use API tokens on behalf of users other than yourself!

[Read Slack's Bot User documentation](https://api.slack.com/bot-users)


#### controller.spawn()
| Argument | Description
|--- |---
| config | Incoming message object

Spawn an instance of your bot and connect it to Slack.
This function takes a configuration object which should contain
at least one method of talking to the Slack API.

To use the real time / bot user API, pass in a token.

Controllers can also spawn bots that use [incoming webhooks](#incoming-webhooks).

Spawn `config` object accepts these properties:

| Name | Value | Description
|--- |--- |---
| token | String | Slack bot token
| retry | Positive integer or `Infinity` | Maximum number of reconnect attempts after failed connection to Slack's real time messaging API. Retry is disabled by default



#### bot.startRTM()
| Argument | Description
|--- |---
| callback | _Optional_ Callback in the form function(err,bot,payload) { ... }

Opens a connection to Slack's real time API. This connection will remain
open until it fails or is closed using `closeRTM()`.

The optional callback function receives:

* Any error that occurred while connecting to Slack
* An updated bot object
* The resulting JSON payload of the Slack API command [rtm.start](https://api.slack.com/methods/rtm.start)

The payload that this callback function receives contains a wealth of information
about the bot and its environment, including a complete list of the users
and channels visible to the bot. This information should be cached and used
when possible instead of calling Slack's API.

A successful connection the API will also cause a `rtm_open` event to be
fired on the `controller` object.


#### bot.closeRTM()

Close the connection to the RTM. Once closed, an `rtm_close` event is fired
on the `controller` object.


```javascript
var Botkit = require('botkit');

var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: my_slack_bot_token
})

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }

  // close the RTM for the sake of it in 5 seconds
  setTimeout(function() {
      bot.closeRTM();
  }, 5000);
});
```

#### bot.destroy()

Completely shutdown and cleanup the spawned worker. Use `bot.closeRTM()` only to disconnect
but not completely tear down the worker.


```javascript
var Botkit = require('botkit');
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token: my_slack_bot_token
})

bot.startRTM(function(err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

// some time later (e.g. 10s) when finished with the RTM connection and worker
setTimeout(bot.destroy.bind(bot), 10000)
```

### Slack-Specific Events

Once connected to Slack, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events.

Botkit's message parsing and event system does a great deal of filtering on this
real time stream so developers do not need to parse every message.  See [Receiving Messages](readme.md#receiving-messages)
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
a [few additional events](#use-the-slack-button).


#### User Activity Events:

| Event | Description
|--- |---
| message_received | a message was received by the bot
| bot_channel_join | the bot has joined a channel
| user_channel_join | a user has joined a channel
| bot_group_join | the bot has joined a group
| user_group_join | a user has joined a group

#### Message Received Events
| Event | Description
|--- |---
| direct_message | the bot received a direct message from a user
| direct_mention | the bot was addressed directly in a channel
| mention | the bot was mentioned by someone in a message
| ambient | the message received had no mention of the bot

#### Websocket Events:

| Event | Description
|--- |---
| rtm_open | a connection has been made to the RTM api
| rtm_close | a connection to the RTM api has closed
| rtm_reconnect_failed | if retry enabled, retry attempts have been exhausted


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

[Set up an outgoing webhook](https://my.slack.com/services/new/outgoing-webhook)

[Set up a Slash command](https://my.slack.com/services/new/slash-commands)

```javascript
controller.setupWebserver(port,function(err,express_webserver) {
  controller.createWebhookEndpoints(express_webserver)
});
```

#### Securing Outgoing Webhooks and Slash commands

You can optionally protect your application with authentication of the requests
from Slack.  Slack will generate a unique request token for each Slash command and
outgoing webhook (see [Slack documentation](https://api.slack.com/slash-commands#validating_the_command)).
You can configure the web server to validate that incoming requests contain a valid api token
by adding an express middleware authentication module.

```javascript
controller.setupWebserver(port,function(err,express_webserver) {
  controller.createWebhookEndpoints(express_webserver, ['AUTH_TOKEN', 'ANOTHER_AUTH_TOKEN']);
  // you can pass the tokens as an array, or variable argument list
  //controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN_1', 'AUTH_TOKEN_2');
  // or
  //controller.createWebhookEndpoints(express_webserver, 'AUTH_TOKEN');
});
```

#### Handling `slash_command` and `outgoing_webhook` events

```
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
use with `createWebhookEndpoints()`

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

#### bot.replyAndUpdate()

| Argument | Description
|---  |---
| src | source message as received from slash or webhook
| reply | reply message that might get updated (string or object)
| callback | optional asynchronous callback that performs a task and updates the reply message

Sending a message, performing a task and then updating the sent message based on the result of that task is made simple with this method:

> **Note**: For the best user experience, try not to use this method to indicate bot activity. Instead, use `bot.startTyping`.

```javascript
// fixing a typo
controller.hears('hello', ['ambient'], function(bot, msg) {
  // send a message back: "hellp"
  bot.replyAndUpdate(msg, 'hellp', function(err, src, updateResponse) {
    if (error) console.error(err);
    // oh no, "hellp" is a typo - let's update the message to "hello"
    updateResponse('hello', function(err) {
      console.error(err)
    });
  });
});
```



### Using the Slack Web API

All (or nearly all - they change constantly!) of Slack's current web api methods are supported
using a syntax designed to match the endpoints themselves.

If your bot has the appropriate scope, it may call [any of these methods](https://api.slack.com/methods) using this syntax:

```javascript
bot.api.channels.list({},function(err,response) {
  //Do something...
})
```



## Use the Slack Button

The [Slack Button](https://api.slack.com/docs/slack-button) is a way to offer a Slack
integration as a service available to multiple teams. Botkit includes a framework
on top of which Slack Button applications can be built.

Slack button applications can use one or more of the [real time API](http://api.slack.com/rtm),
[incoming webhook](http://api.slack.com/incoming-webhooks) and [slash command](http://api.slack.com/slash-commands) integrations, which can be
added *automatically* to a team using a special oauth scope.

If special oauth scopes sounds scary, this is probably not for you!
The Slack Button is useful for developers who want to offer a service
to multiple teams.

How many teams can a Slack button app built using Botkit handle?
This will largely be dependent on the environment it is hosted in and the
type of integrations used.  A reasonably well equipped host server should
be able to easily handle _at least one hundred_ real time connections at once.

To handle more than one hundred bots at once, [consider speaking to the
creators of Botkit at Howdy.ai](http://howdy.ai)

For Slack button applications, Botkit provides:

* A simple webserver
* OAuth Endpoints for login via Slack
* Storage of API tokens and team data via built-in Storage
* Events for when a team joins, a new integration is added, and others...

See the [included examples](readme.md#included-examples) for several ready to use example apps.

#### controller.configureSlackApp()

| Argument | Description
|---  |---
| config | configuration object containing clientId, clientSecret, redirectUri and scopes

Configure Botkit to work with a Slack application.

Get a clientId and clientSecret from [Slack's API site](https://api.slack.com/applications).
Configure Slash command, incoming webhook, or bot user integrations on this site as well.

Configuration must include:

* clientId - Application clientId from Slack
* clientSecret - Application clientSecret from Slack
* redirectUri - the base url of your application
* scopes - an array of oauth permission scopes

Slack has [_many, many_ oauth scopes](https://api.slack.com/docs/oauth-scopes)
that can be combined in different ways. There are also [_special oauth scopes_
used when requesting Slack Button integrations](https://api.slack.com/docs/slack-button).
It is important to understand which scopes your application will need to function,
as without the proper permission, your API calls will fail.

#### controller.createOauthEndpoints()
| Argument | Description
|---  |---
| webserver | an Express webserver Object
| error_callback | function to handle errors that may occur during oauth

Call this function to create two web urls that handle login via Slack.
Once called, the resulting webserver will have two new routes: `http://_your_server_/login` and `http://_your_server_/oauth`. The second url will be used when configuring
the "Redirect URI" field of your application on Slack's API site.


```javascript
var Botkit = require('botkit');
var controller = Botkit.slackbot();

controller.configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirectUri: 'http://localhost:3002',
  scopes: ['incoming-webhook','team:read','users:read','channels:read','im:read','im:write','groups:read','emoji:read','chat:write:bot']
});

controller.setupWebserver(process.env.port,function(err,webserver) {

  // set up web endpoints for oauth, receiving webhooks, etc.
  controller
    .createHomepageEndpoint(controller.webserver)
    .createOauthEndpoints(controller.webserver,function(err,req,res) { ... })
    .createWebhookEndpoints(controller.webserver);

});

```

### How to identify what team your message came from
```javascript
var team = bot.identifyTeam() // returns team id
```


### How to identify the bot itself (for RTM only)
```javascript
var identity = bot.identifyBot() // returns object with {name, id, team_id}
```


### Slack Button specific events:

| Event | Description
|--- |---
| create_incoming_webhook |
| create_bot |
| update_team |
| create_team |
| create_user |
| update_user |
| oauth_error |


## Message Buttons

Slack applications can use "message buttons" or "interactive messages" to include buttons inside attachments. [Read the official Slack documentation here](https://api.slack.com/docs/message-buttons)

Interactive messages can be sent via any of Botkit's built in functions by passing in
the appropriate attachment as part of the message. When users click the buttons in Slack,
Botkit triggers an `interactive_message_callback` event.

When an `interactive_message_callback` is received, your bot can either reply with a new message, or use the special `bot.replyInteractive` function which will result in the original message in Slack being _replaced_ by the reply. Using `replyInteractive`, bots can present dynamic interfaces inside a single message.

In order to use interactive messages, your bot will have to be [registered as a Slack application](https://api.slack.com/apps), and will have to use the Slack button authentication system.
To receive callbacks, register a callback url as part of applications configuration. Botkit's built in support for the Slack Button system supports interactive message callbacks at the url `https://_your_server_/slack/receive` Note that Slack requires this url to be secured with https.

During development, a tool such as [localtunnel.me](http://localtunnel.me) is useful for temporarily exposing a compatible webhook url to Slack while running Botkit privately.

```
// set up a botkit app to expose oauth and webhook endpoints
controller.setupWebserver(process.env.port,function(err,webserver) {

  // set up web endpoints for oauth, receiving webhooks, etc.
  controller
    .createHomepageEndpoint(controller.webserver)
    .createOauthEndpoints(controller.webserver,function(err,req,res) { ... })
    .createWebhookEndpoints(controller.webserver);

});
```

### Send an interactive message
```
controller.hears('interactive', 'direct_message', function(bot, message) {

    bot.reply(message, {
        attachments:[
            {
                title: 'Do you want to interact with my buttons?',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                        "name":"no",
                        "text": "No",
                        "value": "no",
                        "type": "button",
                    }
                ]
            }
        ]
    });
});
```

### Receive an interactive message callback

```
// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {

    // check message.actions and message.callback_id to see what action to take...

    bot.replyInteractive(message, {
        text: '...',
        attachments: [
            {
                title: 'My buttons',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes!",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                       "text": "No!",
                        "name": "no",
                        "value": "delete",
                        "style": "danger",
                        "type": "button",
                        "confirm": {
                          "title": "Are you sure?",
                          "text": "This will do something!",
                          "ok_text": "Yes",
                          "dismiss_text": "No"
                        }
                    }
                ]
            }
        ]
    });

});
```

### Using Interactive Messages in Conversations

It is possible to use interactive messages in conversations, with the `convo.ask` function.
In order to do this, you must instantiate your Botkit controller with the `interactive_replies` option set to `true`:

```
var controller = Botkit.slackbot({interactive_replies: true});
```

This will cause Botkit to pass all interactive_message_callback messages into the normal conversation
system. When used in conjunction with `convo.ask`, expect the response text to match the button `value` field.

```
bot.startConversation(message, function(err, convo) {

    convo.ask({
        attachments:[
            {
                title: 'Do you want to proceed?',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                        "name":"no",
                        "text": "No",
                        "value": "no",
                        "type": "button",
                    }
                ]
            }
        ]
    },[
        {
            pattern: "yes",
            callback: function(reply, convo) {
                convo.say('FABULOUS!');
                convo.next();
                // do something awesome here.
            }
        },
        {
            pattern: "no",
            callback: function(reply, convo) {
                convo.say('Too bad');
                convo.next();
            }
        },
        {
            default: true,
            callback: function(reply, convo) {
                // do nothing
            }
        }
    ]);
});
```
