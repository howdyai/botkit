# Botkit

Botkit is a Node module for use in creating bots (and other types
of applications) that live inside chat rooms like Slack!
It provides a semantic interface to sending and receiving messages
so that developers can focus on creating novel applications and experiences
instead of dealing with API endpoints.

Botkit features a comprehensive set of tools
to deal with Slack's integration platform, and allows
developers to build both custom integrations for their
team as well as public Slack applications that can be
run from a central location, but be used by many teams.


## Installation

Botkit is available via npm.

Though botkit has several internal dependencies, it contains everything you need to get a bot online.

```
npm install --save botkit
```

## Basic Concepts

Bots built with botkit have a few key capabilities, which can be used
to create clever, conversational applications. These capabilities
map to the way real human people talk to each other.

Bots can [hear things)(). Bots can [say things and reply]() to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, botkit bots have a subsystem available for [creating tasks]() which contain one or more [multi-message conversations](). Conversations add features like the ability to ask a question, queue
several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, botkit can handle [3 different types of incoming messages from Slack].


## Basic Usage

Here's an example of using Botkit with Slack's [real time API](https://api.slack.com/rtm), which is the coolest one because your bot will look and act like a real user inside Slack.

This sample bot listens for the word "hello" to be said to it -- either as a direct mention ("@bot hello") or an indirect mention ("hello @bot") or a direct message ("a private message inside Slack between the user and the bot").

```
var botkit = require('botkit');

var bot = botkit.slackbot({
  debug: false
});

// give the bot something to list for.
bot.hears('hello','direct_message,direct_mention,mention',function(message) {

  bot.reply(message,'Hello yourself.');

});

// connect the bot to a stream of messages
bot.startRTM({
  token: my_slack_bot_token,
},function(err,connection,payload) {

  if (!err) {
    console.log("This bot is online!");
  }

});

```

## Hearing Things

Bots hear words or patterns and respond to them. This is achieved using the `bot.hears()` function.

| Argument | Description
|--- |---
| patterns | An _array_ or a _comma separated string_ containing a list of regular expressions to match
| types  | An _array_ or a _comma separated string_ of the message types to listen to
| callback | callback function that receives a message object

For the types field, use one or more of: `ambient`, `mention`, `direct_mention` and `direct_message`

```
bot.hears(['keyword','^pattern$'],['direct_message','direct_mention','mention','ambient'],function(message) {

  // do something to respond to message
  // all of the fields available in a normal Slack message object are available
  // https://api.slack.com/events/message


});
```


## Saying Things

There are two ways for a bot to say something. `bot.say()` allows the bot to say something spontaneously,
while `bot.reply()` causes the bot to respond to a message it received.


### bot.reply()

| Argument | Description
|--- |---
| message | Incoming message object
| reply | _String_ or _Object_ Outgoing response
| callback | _Optional_ Callback in the form function(err,response) { ... }

```
bot.hears(['keyword','^pattern$'],['direct_message','direct_mention','mention','ambient'],function(message) {

  // do something to respond to message
  bot.reply(message,"Tell me more!");

  // do something to respond with an object
  bot.reply(message,{
    text: "A more complex response",
    username: "ReplyBot",
    icon_emoji: ":dash:",
  });


});
```


### bot.say()

| Argument | Description
|--- |---
| connection | Slack configuration in the form {token: some_valid_token}
| message | Incoming message object in the form { text: "" channel: ""}
| callback | _Optional_ Callback in the form function(err,response) { ... }

Note: If your primary need is to spontaneously send messages rather than
respond to incoming messages, you may want to use the [incoming webhooks]() feature rather than the real time API.

```
bot.say(
  {
    token: my_slack_bot_token
  },
  {
    text: 'my message text',
    channel: '#channel'
  }
);
```

## Starting a Conversation

Once your bot gets talking, it is going to want to ask some questions.
Botkit provides a conversation object that can string together several
messages into a cohesive experience.

### bot.startConversation()

| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

### bot.startPrivateConversation()

| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }



### conversation.say()

| Argument | Description
|---  |---
| message   | String or message object

Call convo.say() several times in a row to queue messages inside the conversation. Only one message will be sent at a time, in the order they are queued.

```
bot.hears(['hello world'],['direct_message','direct_mention','mention','ambient'],function(message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.say('Hello!');
    convo.say('Have a nice day!');

  })

});
```

### conversation.ask()

| Argument | Description
|---  |---
| message   | String containing the question
| callback   | callback function in the form function(response_message,conversation)
| _or_ |
| array of callbacks | array of objects in the form ``{ pattern: regular_expression, callback: function(response_message,conversation) { ... } }``
| capture_options | _Optional_ Object defining options for capturing the response

When passed a callback function, conversation.ask will execute the callback function for any response.
This allows the bot to respond to open ended questions, collect the responses, and handle them in whatever
manner it needs to.

When passed an array, the bot will look first for a matching pattern, and execute only the callback whose
pattern is matched. This allows the bot to present multiple choice options, or to respond proceed
only when a valid response has been received. It is recommended that at least one of the patterns
in the array be marked as the default option, should no other option match.

The optional third parameter `capture_options` can be used to define different behaviors for collecting the user's response.
This object can contain the following fields:

| Field | Description
|--- |---
| key | _String_ If set, the response will be stored and can be referenced using this key
| multiple | _Boolean_ if true, support multi-line responses from the user (allow the user to respond several times and aggregate the response into a single multi-line value)

Botkit comes pre-built with several useful patterns which can be used with this function. See [included utterances]()

#### Using conversation.ask with a callback:

```
bot.hears(['question me'],['direct_message','direct_mention','mention','ambient'],function(message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.ask('How are you?',function(response,convo) {

      convo.say('Cool, you said: ' + response.text);
      convo.next();

    });

  })

});
```



#### Using conversation.ask with an array of callbacks:

```
bot.hears(['question me'],['direct_message','direct_mention','mention','ambient'],function(message) {

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

##### Conversation Helper Functions

In order to direct the flow of the conversation, several helper functions
are provided.  These functions should only be called from within a convo.ask
handler function!

`convo.sayFirst(message)` Works just like convo.say, but injects a message into the first spot in the queue
so that it is sent immediately, before any previously queued messages.

`convo.stop()` end the conversation immediately, and set convo.status to `stopped`

`convo.repeat()` repeat the last question sent and continue to wait for a response.

`convo.silentRepeat()` simply wait for another response without saying anything.

`convo.next()` proceed to the next message in the conversatio.  *This must be called* at the end of each handler.

### conversation.on()

Conversations may trigger events during the course of their life.  Currently,
only two events are fired, and only one is very useful: end.

Conversations end naturally when the last message has been sent and no messages remain in the queue.
In this case, the value of `convo.status` will be `completed`. Other values for this field include `active` and `stopped`.

```
convo.on('end',function(convo) {

  if (convo.status=='completed') {
    // do something useful with the users responses
    var res = convo.extractResponses();

    // reference a specific response by key
    var value  = convo.extractResponse('key');
  } else {
    // something happened that caused the conversation to stop prematurely
  }

});
```

### convo.extractResponses()

Returns an object containing all of the responses a user sent during the course of a conversation.

```
var values = convo.extractResponses();
var value = values.key;
```

### convo.extractResponse()

Return one specific user response, identified by its key.

```
var value  = convo.extractResponse('key');
```

## Single Team Bot

Use botkit to build a bot that will connect to your team (one team at a time).

These can just be manually configured by putting info into the script or environment variables!

```
var botkit = require('botkit');
var bot = botkit.slackbot({});

// send webhooks
bot.configureIncomingWebhook({url: webhook_url});
bot.api.webhooks.send({
  text: 'Hey!',
  channel: '#testing',
},function(err,res) {

});

// use RTM
bot.startRTM({token: process.env.token},function(err,connection,payload) {});

// receive outgoing or slash commands
// if you are already using Express, you can use your own server instance...
bot.setupWebserver(process.env.port,function(err,webserver) {

  bot.createWebhookEndpoints(bot.webserver);

});
```


## Working with Slack Integrations

### Incoming webhooks

Incoming webhooks allow you to send data from your application into Slack.

[Read official docs](https://api.slack.com/incoming-webhooks)
[Setup an integration](https://my.slack.com/services/new/incoming-webhook/)

```
bot.configureIncomingWebhook({url: webhook_url});

bot.api.webhooks.send({
  text: 'This is an incoming webhook',
  channel: '#general',
},function(err,res) {
  if (err) {
    // ...
  }
});
```
### Outgoing Webhooks and Slash commands

Outgoing webhooks and slash commands allow you to send data out of Slack.

[Official Outgoing Webhooks docs](https://api.slack.com/outgoing-webhooks)
[Official Slash Command docs](https://api.slack.com/slash-commands)


```
bot.setupWebserver(function(err,express_webserver) {
  createWebhookEndpoints(express_webserver)
});

bot.on('slash_command',function(message) {



})

bot.on('outgoing_webhook',function(message) {



})

```

events
---
slash_command
outgoing_webhook

special responses
---

bot.replyPublic()
bot.replyPublicDelayed()

bot.replyPrivate()
bot.replyPrivateDelayed()



## Real Time API

```
bot.startRTM({token: my_slack_bot_token},function(err,connection,payload) { });
```

events
---
rtm_open
rtm_close
tick
direct_mention
direct_message
mention
ambient
message_received
* all the normal slack events

# Other stuff

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

## Multi Team Bot

This requires using oauth and the add to slack features.

also requires storing provisioning info for teams!


```
var bot = Botkit.slackbot();

bot.configureSlackApp({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirect_uri: 'http://localhost:3002',
  scopes: ['incoming-webhook','team:read','users:read','channels:read','im:read','im:write','groups:read','emoji:read','chat:write:bot']
});

bot.setupWebserver(process.env.port,function(err,webserver) {

  // set up web endpoints for oauth, receiving webhooks, etc.
  bot
    .createHomepageEndpoint(bot.webserver)
    .createOauthEndpoints(bot.webserver,function(err,req,res) { ... })
    .createWebhookEndpoints(bot.webserver);

});

```

events
---
create_incoming_webhook
update_team
create_team
