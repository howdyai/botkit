# [Botkit](http://howdy.ai/botkit) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.

It provides a semantic interface to sending and receiving messages so that developers can focus on creating novel applications and experiences instead of dealing with API endpoints.

Botkit features a comprehensive set of tools to deal with popular messaging platforms, including:

* [Slack](readme-slack.md)
* [Facebook Messenger](readme-facebook.md)
* [Twilio IP Messaging](readme-twilioipm.md)
* Yours? [info@howdy.ai](mailto:info@howdy.ai)

## Installation

Botkit is available via NPM.

```
bash
npm install --save botkit
```

You can also check out Botkit directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```bash
git clone git@github.com:howdyai/botkit.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

Use the `--production` flag to skip the installation of devDependencies from Botkit. Useful if you just wish to run the example bot.
```bash
npm install --production
```


## Getting Started

After you've installed Botkit, the first thing you'll need to do is register your bot with a messaging platform, and get a few configuration options set. This will allow your bot to connect, send and receive messages.

The fastest way to get a bot online and get to work is to start from one of the [examples included in the repo](#included-examples).

If you intend to create a bot that
lives in Slack, [follow these instructions for attaining a Bot Token](readme-slack.md#getting-started).

If you intend to create a bot that lives in Facebook Messenger, [follow these instructions for configuring your Facebook page](readme-facebook.md#getting-started).

If you intent to create a bot that lives inside a Twilio IP Messaging client, [follow these instructions for configuring your app](readme-twilioipm.md#getting-started).

## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used to create clever, conversational applications. These capabilities map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages). Bots can [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-replies-to-incoming-messages). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, Botkit supports receiving messages from a variety of sources:

* [Slack Real Time Messaging (RTM)](http://api.slack.com/rtm)
* [Slack Incoming Webhooks](http://api.slack.com/incoming-webhooks)
* [Slack Slash Commands](http://api.slack.com/slash-commands)
* [Facebook Messenger Webhooks](https://developers.facebook.com/docs/messenger-platform/implementation)
* [Twilio IP Messaging](https://www.twilio.com/user/account/ip-messaging/getting-started)

Read more about [connecting your bot to Slack](readme-slack.md#connecting-your-bot-to-slack), [connecting your bot to Facebook](readme-facebook.md#getting-started), or [connecting your bot to Twilio](readme-twilioipm.md#getting-started).

## Included Examples

These examples are included in the Botkit [Github repo](https://github.com/howdyai/botkit).

[slack_bot.js](https://github.com/howdyai/botkit/blob/master/slack_bot.js) An example bot that can be connected to your team. Useful as a basis for creating your first bot!

[facebook_bot.js](https://github.com/howdyai/botkit/blob/master/facebook_bot.js) An example bot that can be connected to your Facebook page. Useful as a basis for creating your first bot!

[twilio_ipm_bot.js](https://github.com/howdyai/botkit/blob/master/twilio_ipm_bot.js) An example bot that can be connected to your Twilio IP Messaging client. Useful as a basis for creating your first bot!

[examples/demo_bot.js](https://github.com/howdyai/botkit/blob/master/examples/demo_bot.js) another example bot that uses different ways to send and receive messages.

[examples/team_outgoingwebhook.js](https://github.com/howdyai/botkit/blob/master/examples/team_outgoingwebhook.js) an example of a Botkit app that receives and responds to outgoing webhooks from a single team.

[examples/team_slashcommand.js](https://github.com/howdyai/botkit/blob/master/examples/team_slashcommand.js) an example of a Botkit app that receives slash commands from a single team.

[examples/slackbutton_bot.js](https://github.com/howdyai/botkit/blob/master/examples/slackbutton_bot.js) an example of using the Slack Button to offer a bot integration.

[examples/slackbutton_incomingwebhooks.js](https://github.com/howdyai/botkit/blob/master/examples/slackbutton_incomingwebhooks.js) an example of using the Slack Button to offer an incoming webhook integration. This example also includes a simple form which allows you to broadcast a message to any team who adds the integration.

[example/sentiment_analysis.js](https://github.com/howdyai/botkit/blob/master/examples/sentiment_analysis.js) a simple example of a chatbot using sentiment analysis. Keeps a running score of each user based on positive and negative keywords. Messages and thresholds can be configured.


## Basic Usage

Here's an example of using Botkit with Slack's [real time API](https://api.slack.com/rtm), which is the coolest one because your bot will look and act like a real user inside Slack.

This sample bot listens for the word "hello" to be said to it -- either as a direct mention ("@bot hello") or an indirect mention ("hello @bot") or a direct message (a private message inside Slack between the user and the bot).

The Botkit constructor returns a `controller` object. By attaching event handlers
to the controller object, developers can specify what their bot should look for and respond to,
including keywords, patterns and various [messaging and status events](#responding-to-events).
These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human says THIS the bot does THAT."

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

# Developing with Botkit

Table of Contents

* [Receiving Messages](#receiving-messages)
* [Sending Messages](#sending-messages)
* [Middleware](#middleware)
* [Advanced Topics](#advanced-topics)

### Responding to events

Once connected to a messaging platform, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events. The set of events your bot will receive will depend on what messaging platform it is connected to.

All platforms will receive the `message_received` event. This event is the first event fired for every message of any type received - before any platform specific events are fired.

```javascript
controller.on('message_received', function(bot, message) {

    // carefully examine and
    // handle the message here!
    // Note: Platforms such as Slack send many kinds of messages, not all of which contain a text field!
});
```

Due to the multi-channel, multi-user nature of Slack, Botkit does additional filtering on the messages (after firing message_recieved), and will fire more specific events based on the type of message - for example, `direct_message` events indicate a message has been sent directly to the bot, while `direct_mention` indicates that the bot has been mentioned in a multi-user channel.
[List of Slack-specific Events](readme-slack.md#slack-specific-events)

Twilio IPM bots can also exist in a multi-channel, multi-user environmnet. As a result, there are many additional events that will fire. In addition, Botkit will filter some messages, so that the bot will not receive it's own messages or messages outside of the channels in which it is present.
[List of Twilio IPM-specific Events](readme-twilioipm.md#twilio-ipm-specific-events)

Facebook messages are fairly straightforward. However, because Facebook supports inline buttons, there is an additional event fired when a user clicks a button.
[List of Facebook-specific Events](readme-facebook.md#facebook-specific-events)


## Receiving Messages

Botkit bots receive messages through a system of specialized event handlers. Handlers can be set up to respond to specific types of messages, or to messages that match a given keyword or pattern.

These message events can be handled by attaching an event handler to the main controller object.
These event handlers take two parameters: the name of the event, and a callback function which is invoked whenever the event occurs.
The callback function receives a bot object, which can be used to respond to the message, and a message object.

```javascript
// reply to any incoming message
controller.on('message_received', function(bot, message) {
    bot.reply(message, 'I heard... something!');
});

// reply to a direct mention - @bot hello
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
| middleware function | _optional_ function to redefine how patterns are matched. see [Botkit Middleware](#middleware)
| callback | callback function that receives a message object

```javascript
controller.hears(['keyword','^pattern$'],['message_received'],function(bot,message) {

  // do something to respond to message
  bot.reply(message,'You used a keyword!');

});
```

When using the built in regular expression matching, the results of the expression will be stored in the `message.match` field and will match the expected output of normal Javascript `string.match(/pattern/i)`. For example:

```javascript
controller.hears('open the (.*) doors',['message_received'],function(bot,message) {
  var doorType = message.match[1]; //match[1] is the (.*) group. match[0] is the entire group (open the (.*) doors).
  if (doorType === 'pod bay') {
    return bot.reply(message, 'I\'m sorry, Dave. I\'m afraid I can\'t do that.');
  }
  return bot.reply(message, 'Okay');
});
```

## Sending Messages

Bots have to send messages to deliver information and present an interface for their
functionality.  Botkit bots can send messages in several different ways, depending
on the type and number of messages that will be sent.

Single message replies to incoming commands can be sent using the `bot.reply()` function.

Multi-message replies, particularly those that present questions for the end user to respond to,
can be sent using the `bot.startConversation()` function and the related conversation sub-functions.

Bots can originate messages - that is, send a message based on some internal logic or external stimulus -
using `bot.say()` method.  

All `message` objects must contain a `text` property, even if it's only an empty string.

### Single Message Replies to Incoming Messages

Once a bot has received a message using a `on()` or `hears()` event handler, a response
can be sent using `bot.reply()`.

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive in the  client very quickly
and may be difficult for the user to process. We recommend using `bot.startConversation()`
if more than one message needs to be sent.

You may pass either a string, or a message object to the function.

Message objects may also contain any additional fields supported by the messaging platform in use:

[Slack's chat.postMessage](https://api.slack.com/methods/chat.postMessage) API accepts several additional fields. These fields can be used to adjust the message appearance, add attachments, or even change the displayed user name.

This is also true of Facebook. Calls to [Facebook's Send API](https://developers.facebook.com/docs/messenger-platform/send-api-reference) can include attachments which result in interactive "structured messages" which can include images, links and action buttons.

#### bot.reply()

| Argument | Description
|--- |---
| message | Incoming message object
| reply | _String_ or _Object_ Outgoing response
| callback | _Optional_ Callback in the form function(err,response) { ... }

Simple reply example:
```javascript
controller.hears(['keyword','^pattern$'],['message_received'],function(bot,message) {

  // do something to respond to message
  // ...

  bot.reply(message,"Tell me more!");

});
```

Slack-specific fields and attachments:
```javascript
controller.on('ambient',function(bot,message) {

    // do something...

    // then respond with a message object
    //
    bot.reply(message,{
      text: "A more complex response",
      username: "ReplyBot",
      icon_emoji: ":dash:",
    });

})

//Using attachments
controller.hears('another_keyword','direct_message,direct_mention',function(bot,message) {
  var reply_with_attachments = {
    'username': 'My bot' ,
    'text': 'This is a pre-text',
    'attachments': [
      {
        'fallback': 'To be useful, I need you to invite me in a channel.',
        'title': 'How can I help you?',
        'text': 'To be useful, I need you to invite me in a channel ',
        'color': '#7CD197'
      }
    ],
    'icon_url': 'http://lorempixel.com/48/48'
    }

  bot.reply(message, reply_with_attachments);
});

```


Facebook-specific fields and attachments:
```
// listen for the phrase `shirt` and reply back with structured messages
// containing images, links and action buttons
controller.hears(['shirt'],'message_received',function(bot, message) {
    bot.reply(message, {
        attachment: {
            'type':'template',
            'payload':{
                 'template_type':'generic',
                 'elements':[
                   {
                     'title':'Classic White T-Shirt',
                     'image_url':'http://petersapparel.parseapp.com/img/item100-thumb.png',
                     'subtitle':'Soft white cotton t-shirt is back in style',
                     'buttons':[
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/view_item?item_id=100',
                         'title':'View Item'
                       },
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/buy_item?item_id=100',
                         'title':'Buy Item'
                       },
                       {
                         'type':'postback',
                         'title':'Bookmark Item',
                         'payload':'USER_DEFINED_PAYLOAD_FOR_ITEM100'
                       }
                     ]
                   },
                   {
                     'title':'Classic Grey T-Shirt',
                     'image_url':'http://petersapparel.parseapp.com/img/item101-thumb.png',
                     'subtitle':'Soft gray cotton t-shirt is back in style',
                     'buttons':[
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/view_item?item_id=101',
                         'title':'View Item'
                       },
                       {
                         'type':'web_url',
                         'url':'https://petersapparel.parseapp.com/buy_item?item_id=101',
                         'title':'Buy Item'
                       },
                       {
                         'type':'postback',
                         'title':'Bookmark Item',
                         'payload':'USER_DEFINED_PAYLOAD_FOR_ITEM101'
                       }
                     ]
                   }
                 ]
               }
        }
    });
});
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
| message   | message object containing {user: userId} of the user you would like to start a conversation with
| callback  | a callback function in the form of  function(err,conversation) { ... }

`startPrivateConversation()` is a function that initiates a conversation with a specific user. Note function is currently *Slack-only!*

### Control Conversation Flow

#### conversation.say()
| Argument | Description
|---  |---
| message   | String or message object

Call convo.say() several times in a row to queue messages inside the conversation. Only one message will be sent at a time, in the order they are queued.

```javascript
controller.hears(['hello world'], 'message_received', function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.say('Hello!');
    convo.say('Have a nice day!');

  });
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

```javascript
controller.hears(['question me'], 'message_received', function(bot,message) {

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

```javascript
controller.hears(['question me'], 'message_received', function(bot,message) {

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

##### Multi-stage conversations

![multi-stage convo example](https://www.evernote.com/shard/s321/sh/7243cadf-be40-49cf-bfa2-b0f524176a65/f9257e2ff5ee6869/res/bc778282-64a5-429c-9f45-ea318c729225/screenshot.png?resizeSmall&width=832)

One way to have multi-stage conversations is with multiple functions
which call each other. Each function asks just one question. Example:

```javascript
controller.hears(['pizzatime'], 'message_recieved', function(bot,message) {
    askFlavor = function(response, convo) {
      convo.ask('What flavor of pizza do you want?', function(response, convo) {
        convo.say('Awesome.');
        askSize(response, convo);
        convo.next();
      });
    }
    askSize = function(response, convo) {
      convo.ask('What size do you want?', function(response, convo) {
        convo.say('Ok.')
        askWhereDeliver(response, convo);
        convo.next();
      });
    }
    askWhereDeliver = function(response, convo) {
      convo.ask('So where do you want it delivered?', function(response, convo) {
        convo.say('Ok! Good bye.');
        convo.next();
      });
    }

    bot.startConversation(message, askFlavor);
});
```

The full code for this example can be found in ```examples/convo_bot.js```.

##### Included Utterances

| Pattern Name | Description
|--- |---
| bot.utterances.yes | Matches phrases like yes, yeah, yup, ok and sure.
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

```javascript
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

```javascript
var values = convo.extractResponses();
var value = values.key;
```

#### convo.extractResponse()

Return one specific user response, identified by its key.

```javascript
var value  = convo.extractResponse('key');
```

### Originating Messages

#### bot.say()
| Argument | Description
|--- |---
| message | A message object
| callback | _Optional_ Callback in the form function(err,response) { ... }

Slack-specific Example:
```javascript
bot.say(
  {
    text: 'my message text',
    channel: 'C0H338YH4' // a valid slack channel, group, mpim, or im ID
  }
);
```
Note: If your primary need is to spontaneously send messages rather than respond to incoming messages, you may want to use [Slack's incoming webhooks feature](readme-slack.md#incoming-webhooks) rather than the real time API.


Facebook-specific Example:
```javascript
bot.say(
    {
        text: 'my message_text',
        channel: '+1(###)###-####' // a valid facebook user id or phone number
    }
);
```

## Middleware

The functionality of Botkit can be extended using middleware
functions. These functions can plugin to the core bot running processes at
several useful places and make changes to both a bot's configuration and
the incoming or outgoing message.

### Middleware Endpoints

Botkit currently supports middleware insertion in three places:

* When receiving a message, before triggering any events
* When sending a message, before the message is sent to the API
* When hearing a message

Send and Receive middleware functions are added to Botkit using an Express-style "use" syntax.
Each function receives a bot parameter, a message parameter, and
a next function which must be called to continue processing the middleware stack.

Hear middleware functions are passed in to the `controller.hears` function,
and override the built in regular expression matching.

### Receive Middleware

Receive middleware can be used to do things like preprocess the message
content using external natural language processing services like Wit.ai.  
Additional information can be added to the message object for use down the chain.

```
controller.middleware.receive.use(function(bot, message, next) {

    // do something...
    // message.extrainfo = 'foo';
    next();

});
```


### Send Middleware

Send middleware can be used to do things like preprocess the message
content before it gets sent out to the messaging client.  

```
controller.middleware.send.use(function(bot, message, next) {

    // do something useful...
    if (message.intent == 'hi') {
        message.text = 'Hello!!!';
    }
    next();

});
```


### Hear Middleware

Hear middleware can be used to change the way Botkit bots "hear" triggers.
It can be used to look for values in fields other than message.text, or use comparison methods other than regular expression matching. For example, a middleware function
could enable Botkit to "hear" intents added by an NLP classifier instead of string patterns.

Hear middleware is enabled by passing a function into the `hears()` method on the Botkit controller.
When specified, the middleware function will be used instead of the built in regular expression match.

These functions receive 2 parameters - `patterns` an array of patterns, and `message` the incoming
message. This function will be called _after_ any receive middlewares, so may use any additional
information that may have been added. A return value of `true` indicates the pattern has been
matched and the bot should respond.

```
// this example does a simple string match instead of using regular expressions
function custom_hear_middleware(patterns, message) {

    for (var p = 0; p < patterns.length; p++) {
        if (patterns[p] == message.text) {
            return true;
        }
    }
    return false;
}


controller.hears(['hello'],'direct_message',custom_hear_middleware,function(bot, message) {

    bot.reply(message, 'I heard the EXACT string match for "hello"');

});
```

It is possible to completely replace the built in regular expression match with
a middleware function by calling `controller.changeEars()`. This will replace the matching function used in `hears()`
as well as inside `convo.ask().` This would, for example, enable your bot to
hear only intents instead of strings.

```
controller.changeEars(function(patterns, message) {

    // ... do something
    // return true or false
});
```

# Advanced Topics


## Storing Information

Botkit has a built in storage system used to keep data on behalf of users and teams between sessions. Botkit uses this system automatically when storing information for Slack Button applications (see below).

By default, Botkit will use [json-file-store](https://github.com/flosse/json-file-store) to keep data in JSON files in the filesystem of the computer where the bot is executed. (Note this will not work on Heroku or other hosting systems that do not let node applications write to the file system.) Initialize this system when you create the bot:
```javascript
var controller = Botkit.slackbot({
  json_file_store: 'path_to_json_database'
});
```

This system supports freeform storage on a team-by-team, user-by-user, and channel-by-channel basis. Basically ```controller.storage``` is a key value store. All access to this system is through the following nine functions. Example usage:
```javascript
controller.storage.users.save({id: message.user, foo:'bar'}, function(err) { ... });
controller.storage.users.get(id, function(err, user_data) {...});
controller.storage.users.all(function(err, all_user_data) {...});

controller.storage.channels.save({id: message.channel, foo:'bar'}, function(err) { ... });
controller.storage.channels.get(id, function(err, channel_data) {...});
controller.storage.channels.all(function(err, all_channel_data) {...});

controller.storage.teams.save({id: message.team, foo:'bar'}, function(err) { ... });
controller.storage.teams.get(id, function(err, team_data) {...});
controller.storage.teams.all(function(err, all_team_data) {...});
```

Note that save must be passed an object with an id. It is recommended to use the team/user/channel id for this purpose.
```[user/channel/team]_data``` will always be an object while ```all_[user/channel/team]_data``` will always be a list of objects.

### Writing your own storage module

If you want to use a database or do something else with your data,
you can write your own storage module and pass it in.

Make sure your module returns an object with all the methods. See [simple_storage.js](https://github.com/howdyai/botkit/blob/master/lib/storage/simple_storage.js) for an example of how it is done!
Make sure your module passes the test in [storage_test.js](https://github.com/howdyai/botkit/blob/master/lib/storage/storage_test.js).

Then, use it when you create your bot:
```javascript
var controller = Botkit.slackbot({
  storage: my_storage_provider
})
```

### Writing your own logging module

By default, your bot will log to the standard JavaScript `console` object
available in Node.js. This will synchronously print logging messages to stdout
of the running process.

There may be some cases, such as remote debugging or rotating of large logs,
where you may want a more sophisticated logging solution. You can write your
own logging module that uses a third-party tool, like
[winston](https://github.com/winstonjs/winston) or
[Bristol](https://github.com/TomFrost/Bristol). Just create an object with a
`log` method. That method should take a severity level (such as `'error'` or
`'debug'`) as its first argument, and then any number of other arguments that
will be logged as messages. (Both Winston and Bristol create objects of this
description; it's a common interface.)

Then, use it when you create your bot:
```javascript
var controller = Botkit.slackbot({
  logger: new winston.Logger({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: './bot.log' })
    ]
  })
});
```


##Use BotKit with an Express web server
Instead of controller.setupWebserver(), it is possible to use a different web server to manage authentication flows, as well as serving web pages.

Here is an example of [using an Express web server alongside BotKit](https://github.com/mvaragnat/botkit-express-demo).

# Chat with us at dev4slack.slack.com
You can get an invite here: http://dev4slack.xoxco.com/.
