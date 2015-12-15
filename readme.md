# [Botkit](http://howdy.ai/botkit) - Building Blocks for Building Bots

Botkit designed to ease the process of designing and running useful, creative or
just plain weird bots (and other types of applications) that live inside [Slack](http://slack.com)!

It provides a semantic interface to sending and receiving messages
so that developers can focus on creating novel applications and experiences
instead of dealing with API endpoints.

Botkit features a comprehensive set of tools
to deal with [Slack's integration platform](http://api.slack.com), and allows
developers to build both custom integrations for their
team, as well as public "Slack Button" applications that can be
run from a central location, and be used by many teams at the same time.

## Installation

Botkit is available via NPM.

```
npm install --save botkit
```

You can also check out Botkit directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```
git clone git@github.com:howdyai/botkit.git
```

## Getting Started
​
1) Install Botkit

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


## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used
to create clever, conversational applications. These capabilities
map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages). Bots can [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-replies-to-incoming-messages). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, Botkit can handle [3 different types of incoming messages from Slack](#connecting-your-bot-to-slack).


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


```
var Botkit = require('botkit');

var controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
controller.spawn({
  token: <my_slack_bot_token>,
}).startRTM()

// give the bot something to listen for.
controller.hears('hello','direct_message,direct_mention,mention',function(bot,message) {

  bot.reply(message,'Hello yourself.');

});

```

## Included Examples

These examples are included in the Botkit [Github repo](https://github.com/howdyai/botkit).

[bot.js](https://github.com/howdai/botkit/blob/master/bot.js) An example bot that can be connected to your team. Useful as a basis for creating your first bot!

[examples/demo_bot.js](https://github.com/howdai/botkit/blob/master/examples/demo_bot.js) another example bot that uses different ways to send and receive messages.

[examples/slackbutton_bot.js](https://github.com/howdai/botkit/blob/master/examples/slackbutton_bot.js) an example of using the Slack Button to offer a bot integration.

[examples/slackbutton_incomingwebhooks.js](https://github.com/howdai/botkit/blob/master/examples/slackbutton_incomingwebhooks.js) an example of using the Slack Button to offer an incoming webhook integration. This example also includes a simple form which allows you to broadcast a message to any team who adds the integration.

# Developing with Botkit

Table of Contents

* [Connecting Your Bot To Slack](#connecting-your-bot-to-slack)
* [Receiving Messages](#receiving-messages)
* [Sending Messages](#sending-messages)
* [Working with Slack Integrations](#working-with-slack-integrations)
* [Advanced Topics](#advanced-topics)

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

To use the real time / bot user API, pass in a token, preferably via
an environment variable.

Controllers can also spawn bots that use [incoming webhooks](#incoming-webhooks).

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


```
var Botkit = require('Botkit');

var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: my_slack_bot_token
})

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});
```

### Responding to events

Once connected to Slack, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events.

Botkit's message parsing and event system does a great deal of filtering on this
real time stream so developers do not need to parse every message.  See [Receiving Messages](#receiving-messages)
for more information about listening for and responding to messages.

It is also possible to bind event handlers directly to any of the enormous number of native Slack events, as well as a handful of custom events emitted by Botkit.

You can receive and handle any of the [native events thrown by slack](https://api.slack.com/events).  

```
controller.on('channel_joined',function(bot,message) {

  // message contains data sent by slack
  // in this case:
  // https://api.slack.com/events/channel_joined

});
```

You can also receive and handle a long list of additional events caused
by messages that contain a subtype field, [as listed here](https://api.slack.com/events/message)

```
controller.on('channel_leave',function(bot,message) {

  // message format matches this:
  // https://api.slack.com/events/message/channel_leave

})
```

Finally, Botkit throws a handful of its own events!
Events related to the general operation of bots are below.
When used in conjunction with the Slack Button, Botkit also fires
a [few additional events](#using-the-slack-button).

#### Message/User Activity Events:

| Event | Description
|--- |---
| message_received | a message was received by the bot
| bot_channel_join | the bot has joined a channel
| user_channel_join | a user has joined a channel
| bot_group_join | the bot has joined a group
| user_group_join | a user has joined a group
| direct_message | the bot received a direct message from a user
| direct_mention | the bot was addressed directly in a channel
| mention | the bot was mentioned by someone in a message
| ambient | the message received had no mention of the bot


#### Websocket Events:

| Event | Description
|--- |---
| rtm_open | a connection has been made to the RTM api
| rtm_close | a connection to the RTM api has closed


## Receiving Messages

Botkit bots receive messages through a system of event handlers. Handlers can be set up to respond to specific types of messages,
or to messages that match a given keyword or pattern.

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

```
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

### Matching Patterns and Keywords with `hears()`

In addition to these traditional event handlers, Botkit also provides the `hears()` function,
which configures event handlers based on matching specific keywords or phrases in the message text.
The hears function works just like the other event handlers, but takes a third parameter which
specifies the keywords to match.

| Argument | Description
|--- |---
| patterns | An _array_ or a _comma separated string_ containing a list of regular expressions to match
| types  | An _array_ or a _comma separated string_ of the message events in which to look for the patterns
| callback | callback function that receives a message object

```
controller.hears(['keyword','^pattern$'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

  // do something to respond to message
  // all of the fields available in a normal Slack message object are available
  // https://api.slack.com/events/message
  bot.reply(message,'You used a keyword!');

});
```

## Sending Messages

Bots have to send messages to deliver information and present an interface for their
functionality.  Botkit bots can send messages in several different ways, depending
on the type and number of messages that will be sent.

Single message replies to incoming commands can be sent using the `bot.reply()` function.

Multi-message replies, particulary those that present questions for the end user to respond to,
can be sent using the `bot.startConversation()` function and the related conversation sub-functions.

Bots can originate messages - that is, send a message based on some internal logic or external stimulus -
using `bot.say()` method.  Note that bots that do not need to respond to messages or hold conversations
may be better served by using Slack's [Incoming Webhooks](#incoming-webhooks) feature.

### Single Message Replies to Incoming Messages

Once a bot has received a message using a `on()` or `hears()` event handler, a response
can be sent using `bot.reply()`.

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive in the Slack client very quickly
and may be difficult for the user to process. We recommend using `bot.startConversation()`
if more than one message needs to be sent.

You may pass either a string, or a message object to the function. Message objects may contain
any of the fields supported by [Slack's chat.postMessage](https://api.slack.com/methods/chat.postMessage) API.

#### bot.reply()

| Argument | Description
|--- |---
| message | Incoming message object
| reply | _String_ or _Object_ Outgoing response
| callback | _Optional_ Callback in the form function(err,response) { ... }

```
controller.hears(['keyword','^pattern$'],['direct_message','direct_mention','mention'],function(bot,message) {

  // do something to respond to message
  // ...

  bot.reply(message,"Tell me more!");

});

controller.on('ambient',function(bot,message) {

    // do something...

    // then respond with a message object
    bot.reply(message,{
      text: "A more complex response",
      username: "ReplyBot",
      icon_emoji: ":dash:",
    });

})

```

### Multi-message Replies to Incoming Messages

For more complex commands, multiple messages may be necessary to send a response,
particularly if the bot needs to collect additional information from the user.

Botkit provides a `Conversation` object type that is used to string together several
messages, including questions for the user, into a cohesive unit. Botkit conversations
provide useful methods that enable developers to craft complex conversational
user interfaces that may span a several minutes of dialog with a user, without having to manage
the complexity of connecting multiple incoming and outgoing messages across
multiple API calls into a single function.

Messages sent as part of a conversation are sent no faster than one message per second,
which roughly simulates the time it would take for the bot to "type" the message.
(It is possible to adjust this delay - see [special behaviors](#special-behaviors))

### Start a Conversation

#### bot.startConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startConversation()` is a function that creates conversation in response to an incoming message.
The conversation will occur _in the same channel_ in which the incoming message was received.
Only the user who sent the original incoming message will be able to respond to messages in the conversation.

#### bot.startPrivateConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startPrivateConversation()` works juts like `startConversation()`, but the resulting
conversation that is created will occur in a private direct message channel between
the user and the bot.

### Control Conversation Flow

#### conversation.say()
| Argument | Description
|---  |---
| message   | String or message object

Call convo.say() several times in a row to queue messages inside the conversation. Only one message will be sent at a time, in the order they are queued.

```
controller.hears(['hello world'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.say('Hello!');
    convo.say('Have a nice day!');

  })

});
```

#### conversation.ask()
| Argument | Description
|---  |---
| message   | String or message object containing the question
| callback _or_ array of callbacks   | callback function in the form function(response_message,conversation), or array of objects in the form ``{ pattern: regular_expression, callback: function(response_message,conversation) { ... } }``
| capture_options | _Optional_ Object defining options for capturing the response

When passed a callback function, conversation.ask will execute the callback function for any response.
This allows the bot to respond to open ended questions, collect the responses, and handle them in whatever
manner it needs to.

When passed an array, the bot will look first for a matching pattern, and execute only the callback whose
pattern is matched. This allows the bot to present multiple choice options, or to proceed
only when a valid response has been received. At least one of the patterns in the array must be marked as the default option,
which will be called should no other option match. Botkit comes pre-built with several useful patterns which can be used with this function. See [included utterances](#included-utterances)

Callback functions passed to `ask()` receive two parameters - the first is a standard message object containing
the user's response to the question. The second is a reference to the conversation itself.

Note that in order to continue the conversation, `convo.next()` must be called by the callback function. This
function tells Botkit to continue processing the conversation. If it is not called, the conversation will hang
and never complete causing memory leaks and instability of your bot application!

The optional third parameter `capture_options` can be used to define different behaviors for collecting the user's response.
This object can contain the following fields:

| Field | Description
|--- |---
| key | _String_ If set, the response will be stored and can be referenced using this key
| multiple | _Boolean_ if true, support multi-line responses from the user (allow the user to respond several times and aggregate the response into a single multi-line value)

##### Using conversation.ask with a callback:

```
controller.hears(['question me'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.ask('How are you?',function(response,convo) {

      convo.say('Cool, you said: ' + response.text);
      convo.next();

    });

  })

});
```

##### Using conversation.ask with an array of callbacks:

```
controller.hears(['question me'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.ask('Shall we proceed Say YES, NO or DONE to quit.',[
      {
        pattern: 'done',
        callback: function(response,convo) {
          convo.say('OK you are done!');
          convo.next();          
        }
      },
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say('Great! I will continue...');
          // do something else...
          convo.next();

        }
      },
      {
        pattern: bot.utterances.no,
        callback: function(response,convo) {
          convo.say('Perhaps later.');
          // do something else...
          convo.next();
        }
      },
      {
        default: true,
        callback: function(response,convo) {
          // just repeat the question
          convo.repeat();
          convo.next();
        }
      }
    ]);

  })

});
```

##### Included Utterances

| Pattern Name | Description
|--- |---
| bot.utterances.yes | Matches phrasess like yes, yeah, yup, ok and sure.
| bot.utterances.no | Matches phrases like no, nah, nope

##### Conversation Control Functions

In order to direct the flow of the conversation, several helper functions
are provided.  These functions should only be called from within a convo.ask
handler function!

`convo.sayFirst(message)` Works just like convo.say, but injects a message into the first spot in the queue
so that it is sent immediately, before any other queued messages.

`convo.stop()` end the conversation immediately, and set convo.status to `stopped`

`convo.repeat()` repeat the last question sent and continue to wait for a response.

`convo.silentRepeat()` simply wait for another response without saying anything.

`convo.next()` proceed to the next message in the conversation.  *This must be called* at the end of each handler.

### Handling End of Conversation

Conversations trigger events during the course of their life.  Currently,
only two events are fired, and only one is very useful: end.

Conversations end naturally when the last message has been sent and no messages remain in the queue.
In this case, the value of `convo.status` will be `completed`. Other values for this field include `active`, `stopped`, and
`timeout`.

```
convo.on('end',function(convo) {

  if (convo.status=='completed') {
    // do something useful with the users responses
    var res = convo.extractResponses();

    // reference a specific response by key
    var value  = convo.extractResponse('key');

    // ... do more stuff...

  } else {
    // something happened that caused the conversation to stop prematurely
  }

});
```

#### convo.extractResponses()

Returns an object containing all of the responses a user sent during the course of a conversation.

```
var values = convo.extractResponses();
var value = values.key;
```

#### convo.extractResponse()

Return one specific user response, identified by its key.

```
var value  = convo.extractResponse('key');
```

### Originating Messages

#### bot.say()
| Argument | Description
|--- |---
| message | A message object
| callback | _Optional_ Callback in the form function(err,response) { ... }

Note: If your primary need is to spontaneously send messages rather than
respond to incoming messages, you may want to use [Slack's incoming webhooks feature](#incoming-webhooks) rather than the real time API.

```
bot.say(
  {
    text: 'my message text',
    channel: '#channel'
  }
);
```

## Working with Slack Integrations

There are a dizzying number of ways to integrate your application into Slack.
Up to this point, this document has mainly dealt with the real time / bot user
integration.  In addition to this type of integration, Botkit also supports:

* Incoming Webhooks - a way to send (but not receive) messages to Slack
* Outgoing Webhooks - a way to receive messages from Slack based on a keyword or phrase
* Slash Command - a way to add /slash commands to Slack
* Slack Web API - a full set of RESTful API tools to deal with Slack
* The Slack Button - a way to build Slack applications that can be used by multiple teams


```
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

```
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

```
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

```
bot.api.channels.list({},function(err,response) {


})
```


# Advanced Topics


## Storing Information

Botkit has a built in storage system used to keep data
on behalf of users and teams between sessions. Botkit uses this system automatically when storing information for Slack Button applications (see below).

By default, Botkit will use [json-file-store](https://github.com/flosse/json-file-store) to keep data in JSON files in the filesystem of the computer where the bot is executed. (Note this will not work on Heroku or other hosting systems that do not let node applications write to the file system.)

Support for freeform storage for teams, users and channels.
Basically this is a key value store. You can pass in
whatever data you like to any of these, as long as it has an
ID field, which should be a Slack unique id.


```
var controller = Botkit.slackbot({
  json_file_store: 'path_to_json_database'
})

controller.storage.teams.get(id,function(err,team) {

})

controller.storage.teams.save(team_data,function(err) { ... })

controller.storage.users.get(id,function(err,user) {

})

controller.storage.users.save(user_data,function(err) { ... })

controller.storage.channels.get(id,function(err,channel) {

})

controller.storage.channels.save(channel_data,function(err) { ... })

```

### Write your own storage provider

If you want to use a database or do something else with your data,
you can write your own storage module and pass it in.

Make sure your module returns an object with all the methods. See [simple_storage.js](https://github.com/howdai/botkit/blob/master/lib/simple_storage.js) for an example of how it is done!

Then, use it when you create your bot:
```
var controller = Botkit.slackbot({
  storage: my_storage_provider
})
```


## Use the Slack Button

The [Slack Button](https://api.slack.com/docs/slack-button) is a way to offer a Slack
integration as a service available to multiple teams. Botkit includes a framework
on top of which Slack Button applications can be built.

Slack button applications can use one or more of the [real time API](),
[incoming webhook]() and [slash command]() integrations, which can be
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

See the [included examples](#included-examples) for several ready to use example apps.

#### controller.configureSlackApp()

| Argument | Description
|---  |---
| config | configuration object containing clientId, clientSecret, redirect_uri and scopes

Configure Botkit to work with a Slack application.

Get a clientId and clientSecret from [Slack's API site](https://api.slack.com/applications).
Configure Slash command, incoming webhook, or bot user integrations on this site as well.

Configuration must include:

* clientId - Application clientId from Slack
* clientSecret - Application clientSecret from Slack
* redirect_uri - the base url of your application
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


```
var Botkit = require('botkit');
var controller = Botkit.slackbot();

controller.configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirect_uri: 'http://localhost:3002',
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
```
bot.identifyTeam(function(err,team_id) {

})
```


### How to identify the bot itself (for RTM only)
```
bot.identifyBot(function(err,identity) {
  // identity contains...
  // {name, id, team_id}
})
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
