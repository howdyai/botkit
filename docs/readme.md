# [Botkit](http://howdy.ai/botkit) - Building Blocks for Building Bots

## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used to create clever, conversational applications. These capabilities map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages), [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-conversations). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, Botkit supports receiving messages from a variety of sources:

* [Slack Real Time Messaging (RTM)](http://api.slack.com/rtm)
* [Slack Incoming Webhooks](http://api.slack.com/incoming-webhooks)
* [Slack Slash Commands](http://api.slack.com/slash-commands)
* [Cisco Spark Webhooks](https://developer.ciscospark.com/webhooks-explained.html)
* [Microsoft Teams](https://msdn.microsoft.com/en-us/microsoft-teams/bots)
* [Facebook Messenger Webhooks](https://developers.facebook.com/docs/messenger-platform/implementation)
* [Twilio SMS](https://www.twilio.com/console/sms/dashboard)
* [Twilio IP Messaging](https://www.twilio.com/console/chat/dashboard)
* [Microsoft Bot Framework](http://botframework.com/)

Read more about
[connecting your bot to Slack](readme-slack.md#connecting-your-bot-to-slack),
[connecting your bot to Cisco Spark](readme-ciscospark.md#getting-started),
[connecting your bot to Microsoft Teams](readme-teams.md#getting-started),
[connecting your bot to Facebook](readme-facebook.md#getting-started),
[connecting your bot to Twilio](readme-twilioipm.md#getting-started),
or [connecting your bot to Microsoft Bot Framework](readme-botframework.md#getting-started)

## Basic Usage

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

var controller = Botkit.slackbot(configuration);


// give the bot something to listen for.
controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {

  bot.reply(message,'Hello yourself.');

});

```


# Developing with Botkit

Table of Contents

* [Receiving Messages](#receiving-messages)
* [Sending Messages](#sending-messages)
* [Multi-message Conversations](#multi-message-conversations)
* [Middleware](middleware.md)
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

Due to the multi-channel, multi-user nature of Slack, Botkit does additional filtering on the messages (after firing message_received), and will fire more specific events based on the type of message - for example, `direct_message` events indicate a message has been sent directly to the bot, while `direct_mention` indicates that the bot has been mentioned in a multi-user channel.
[List of Slack-specific Events](readme-slack.md#slack-specific-events)

Similarly, bots in Cisco Spark will receive `direct_message` events to indicate a message has been sent directly to the bot, while `direct_mention` indicates that the bot has been mentioned in a multi-user channel. Several other Spark-specific events will also fire. [List of Cisco Spark-specific Events](readme-ciscospark.md#spark-specific-events)

Twilio IPM bots can also exist in a multi-channel, multi-user environment. As a result, there are many additional events that will fire. In addition, Botkit will filter some messages, so that the bot will not receive it's own messages or messages outside of the channels in which it is present.
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
| middleware function | _optional_ function to redefine how patterns are matched. see [Botkit Middleware](middleware.md)
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
```javascript
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

## Multi-message Conversations

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


### Conversation Threads

While conversations with only a few questions can be managed by writing callback functions,
more complex conversations that require branching, repeating or looping sections of dialog,
or data validation can be handled using feature of the conversations we call `threads`.

Threads are pre-built chains of dialog between the bot and end user that are built before the conversation begins. Once threads are built, Botkit can be instructed to navigate through the threads automatically, allowing many common programming scenarios such as yes/no/quit prompts to be handled without additional code.

You can build conversation threads in code, or you can use [Botkit Studio](readme-studio.md)'s script management tool to build them in a friendly web environment. Conversations you build yourself and conversations managed in Botkit Studio work the same way -- they run inside your bot and use your code to manage the outcome.

If you've used the conversation system at all, you've used threads - you just didn't know it. When calling `convo.say()` and `convo.ask()`, you were actually adding messages to the `default` conversation thread that is activated when the conversation object is created.


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

#### bot.createConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

This works just like `startConversation()`, with one main difference - the conversation
object passed into the callback will be in a dormant state. No messages will be sent,
and the conversation will not collect responses until it is activated using [convo.activate()](#conversationactivate).

Use `createConversation()` instead of `startConversation()` when you plan on creating more complex conversation structures using [threads](#conversation-threads) or [variables and templates](#using-variable-tokens-and-templates-in-conversation-threads) in your messages.

#### bot.createPrivateConversation()
| Argument | Description
|---  |---
| message   | incoming message to which the conversation is in response
| callback  | a callback function in the form of  function(err,conversation) { ... }

This works just like `startPrivateConversation()`, with one main difference - the conversation
object passed into the callback will be in a dormant state. No messages will be sent,
and the conversation will not collect responses until it is activated using [convo.activate()](#conversationactivate).

### Control Conversation Flow

#### convo.activate()

This function will cause a dormant conversation created with [bot.createConversation()](#botcreateconversation) to be activated, which will cause it to start sending messages and receiving replies from end users.

A conversation can be kept dormant in order to preload it with [variables](#using-variable-tokens-and-templates-in-conversation-threads), particularly data that requires asynchronous actions to take place such as loading data from a database or remote source.  You may also keep a conversation inactive while you build threads, setting it in motion only when all of the user paths have been defined.

#### convo.addMessage
| Argument | Description
|---  |---
| message   | String or message object
| thread_name   | String defining the name of a thread

This function works identically to `convo.say()` except that it takes a second parameter which defines the thread to which the message will be added rather than being queued to send immediately, as is the case when using convo.say().

#### convo.addQuestion
| Argument | Description
|---  |---
| message   | String or message object containing the question
| callback _or_ array of callbacks   | callback function in the form function(response_message,conversation), or array of objects in the form ``{ pattern: regular_expression, callback: function(response_message,conversation) { ... } }``
| capture_options |  Object defining options for capturing the response. Pass an empty object if capture options are not needed
| thread_name   | String defining the name of a thread


When passed a callback function, conversation.ask will execute the callback function for any response.
This allows the bot to respond to open ended questions, collect the responses, and handle them in whatever
manner it needs to.

When passed an array, the bot will look first for a matching pattern, and execute only the callback whose
pattern is matched. This allows the bot to present multiple choice options, or to proceed
only when a valid response has been received. At least one of the patterns in the array must be marked as the default option,
which will be called should no other option match. Botkit comes pre-built with several useful patterns which can be used with this function. See [included utterances](#included-utterances)

Callback functions passed to `addQuestion()` receive two parameters - the first is a standard message object containing
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

##### Using conversation.addQuestion with a callback:

```javascript
controller.hears(['question me'], 'message_received', function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.addQuestion('How are you?',function(response,convo) {

      convo.say('Cool, you said: ' + response.text);
      convo.next();

    },{},'default');

  })

});
```

##### Using conversation.addQuestion with an array of callbacks:

```javascript
controller.hears(['question me'], 'message_received', function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {

    convo.addQuestion('Shall we proceed Say YES, NO or DONE to quit.',[
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
    ],{},'default');

  })

});
```

#### convo.say()
| Argument | Description
|---  |---
| message   | String or message object

convo.say() is a specialized version of `convo.addMessage()` that adds messages to the _current_ thread, essentially adding a message dynamically to the conversation. This should only be used in simple cases, or when building a conversation with lots of dynamic content. Otherwise, creating `threads` is the recommended approach.

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

#### convo.ask()
| Argument | Description
|---  |---
| message   | String or message object containing the question
| callback _or_ array of callbacks   | callback function in the form function(response_message,conversation), or array of objects in the form ``{ pattern: regular_expression, callback: function(response_message,conversation) { ... } }``
| capture_options | _Optional_ Object defining options for capturing the response

convo.ask() is a specialized version of `convo.addQuestion()` that adds messages to the _current_ thread, essentially adding a message dynamically to the conversation. This should only be used in simple cases, or when building a conversation with lots of dynamic content. Otherwise, creating `threads` is the recommended approach.

In particular, we recommend that developers avoid calling `convo.ask()` or `convo.say()` inside a callbacks for `convo.ask()`. Multi-level callbacks encourage fragile code - for conversations requiring more than one branch, use threads!


#### convo.gotoThread
| Argument | Description
|---  |---
| thread_name   | String defining the name of a thread

Cause the bot to immediately jump to the named thread.
All conversations start in a thread called `default`, but you may switch to another existing thread before the conversation has been activated, or in a question callback.

Threads are created by adding messages to them using `addMessage()` and `addQuestion()`

```javascript
// create the validation_error thread
convo.addMessage('This is a validation error.', 'validation_error');
convo.addMessage('I am sorry, your data is wrong!', 'validation_error');

// switch to the validation thread immediately
convo.gotoThread('validation_error');
```


#### convo.transitionTo
| Argument | Description
|---  |---
| thread_name   | String defining the name of a thread
| message   | String or message object

Like `gotoThread()`, jumps to the named thread. However, before doing so,
Botkit will first send `message` to the user as a transition. This allows
developers to specify dynamic transition messages to improve the flow of the
conversation.

```javascript
// create an end state thread
convo.addMessage('This is the end!', 'the_end');

// now transition there with a nice message
convo.transitionTo('the_end','Well I think I am all done.');
```

### convo.beforeThread
| Argument | Description
|--- |---
| thread_name | String defining the name of a thread
| handler_function | handler in the form function(convo, next) {...}

Allows developers to specify one or more functions that will be called before the thread
referenced in `thread_name` is activated.

`handler_function` will receive the conversation object and a `next()` function. Developers
must call the `next()` function when their asynchronous operations are completed, or the conversation
may not continue as expected.  

Note that if `gotoThread()` is called inside the handler function,
it is recommended that `next()` be passed with an error parameter to stop processing of any additional thread handler functions that may be defined - that is, call `next('stop');`

```javascript
// create a thread that asks the user for their name.
// after collecting name, call gotoThread('completed') to display completion message
convo.addMessage({text: 'Hello let me ask you a question, then i will do something useful'},'default');
convo.addQuestion({text: 'What is your name?'},function(res, convo) {
  // name has been collected...
  convo.gotoThread('completed');
},{key: 'name'},'default');

// create completed thread
convo.addMessage({text: 'I saved your name in the database, {{vars.name}}'},'completed');

// create an error  thread
convo.addMessage({text: 'Oh no I had an error! {{vars.error}}'},'error');


// now, define a function that will be called AFTER the `default` thread ends and BEFORE the `completed` thread begins
convo.beforeThread('completed', function(convo, next) {

  var name = convo.extractResponse('name');

  // do something complex here
  myFakeFunction(name).then(function(results) {

    convo.setVar('results',results);

    // call next to continue to the secondary thread...
    next();

  }).catch(function(err) {
    convo.setVar('error', err);
    convo.gotoThread('error');
    next(err); // pass an error because we changed threads again during this transition
  });

});
```


#### Automatically Switch Threads using Actions

You can direct a conversation to switch from one thread to another automatically
by including the `action` field on a message object. Botkit will switch threads immediately after sending the message.

```javascript
// first, define a thread called `next_step` that we'll route to...
convo.addMessage({
    text: 'This is the next step...',
},'next_step');


// send a message, and tell botkit to immediately go to the next_step thread
convo.addMessage({
    text: 'Anyways, moving on...',
    action: 'next_step'
});
```

Developers can create fairly complex conversational systems by combining these message actions with conditionals in `ask()` and `addQuestion()`.  Actions can be used to specify
default or next step actions, while conditionals can be used to route between threads.

From inside a callback function, use `convo.gotoThread()` to instantly switch to a different pre-defined part of the conversation. Botkit can be set to automatically navigate between threads based on user input, such as in the example below.

```javascript
bot.createConversation(message, function(err, convo) {

    // create a path for when a user says YES
    convo.addMessage({
            text: 'You said yes! How wonderful.',
    },'yes_thread');

    // create a path for when a user says NO
    convo.addMessage({
        text: 'You said no, that is too bad.',
    },'no_thread');

    // create a path where neither option was matched
    // this message has an action field, which directs botkit to go back to the `default` thread after sending this message.
    convo.addMessage({
        text: 'Sorry I did not understand.',
        action: 'default',
    },'bad_response');

    // Create a yes/no question in the default thread...
    convo.addQuestion('Do you like cheese?', [
        {
            pattern: 'yes',
            callback: function(response, convo) {
                convo.gotoThread('yes_thread');
            },
        },
        {
            pattern: 'no',
            callback: function(response, convo) {
                convo.gotoThread('no_thread');
            },
        },
        {
            default: true,
            callback: function(response, convo) {
                convo.gotoThread('bad_response');
            },
        }
    ],{},'default');

    convo.activate();
});
```

#### Special Actions

In addition to routing from one thread to another using actions, you can also use
one of a few reserved words to control the conversation flow.

Set the action field of a message to `completed` to end the conversation immediately and mark as success.

Set the action field of a message to `stop` end immediately, but mark as failed.

Set the action field of a message to `timeout` to end immediately and indicate that the conversation has timed out.

After the conversation ends, these values will be available in the `convo.status` field. This field can then be used to check the final outcome of a conversation. See [handling the end of conversations](#handling-end-of-conversation).

### Using Variable Tokens and Templates in Conversation Threads

Pre-defined conversation threads are great, but many times developers will need to inject dynamic content into a conversation.
Botkit achieves this by processing the text of every message using the [Mustache template language](https://mustache.github.io/).
Mustache offers token replacement, as well as access to basic iterators and conditionals.

Variables can be added to a conversation at any point after the conversation object has been created using the function `convo.setVar()`. See the example below.

```javascript
convo.createConversation(message, function(err, convo) {

    // .. define threads which will use variables...
    // .. and then, set variable values:
    convo.setVar('foo','bar');
    convo.setVar('list',[{value:'option 1'},{value:'option 2'}]);
    convo.setVar('object',{'name': 'Chester', 'type': 'imaginary'});

    // now set the conversation in motion...
    convo.activate();
});
```

Given the variables defined in this code sample, `foo`, a simple string, `list`, an array, and `object`, a JSON-style object,
the following Mustache tokens and patterns would be available:

```
The value of foo is {{vars.foo}}

The items in this list include {{#vars.list}}{{value}}{{/vars.list}}

The object's name is {{vars.object.name}}.

{{#foo}}If foo is set, I will say this{{/foo}}{{^foo}}If foo is not set, I will say this other thing.{{/foo}}
```
Botkit ensures that your template is a valid Mustache template, and passes the variables you specify directly to the Mustache template rendering system.
Our philosophy is that it is OK to stuff whatever type of information your conversation needs into these variables and use them as you please!

#### convo.setVar
| Argument | Description
|---  |---
| variable_name   | The name of a variable to be made available to message text templates.
| value | The value of the variable, which can be any type of normal Javascript variable

Create or update a variable that is available as a Mustache template token to all the messages in all the threads contained in the conversation.

The variable will be available in the template as `{{vars.variable_name}}`

#### Built-in Variables

Botkit provides several built in variables that are automatically available to all messages:

{{origin}} - a message object that represents the initial triggering message that caused the conversation.

{{responses}} - an object that contains all of the responses a user has given during the course of the conversation. This can be used to make references to previous responses. This requires that `convo.ask()` questions include a keyname, making responses available at `{{responses.keyname}}`

##### Included Utterances

| Pattern Name | Description
|--- |---
| bot.utterances.yes | Matches phrases like yes, yeah, yup, ok and sure.
| bot.utterances.no | Matches phrases like no, nah, nope
| bot.utterances.quit | Matches phrases like, cancel, exit, stop

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

`convo.setTimeout(timeout)` times out conversation if no response from user after specified time period (in milliseconds).

### Handling End of Conversation

Conversations trigger events during the course of their life.  Currently,
only two events are fired, and only one is very useful: end.

Conversations end naturally when the last message has been sent and no messages remain in the queue.
In this case, the value of `convo.status` will be `completed`. Other values for this field include `active`, `stopped`, and `timeout`.

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

### Handling Conversation Timeouts

If a conversation reaches its timeout threshold (set using `convo.setTimeout()`) while waiting for a user to respond to a `convo.ask()` question, the conversation will automatically end. By default, the conversation will end immediately without sending any further messages. Developers may change this behavior in one of two ways:

*Provide a handler function with convo.onTimeout():*
Use `convo.onTimeout(handler)` to define a function that will be called when the conversation reaches the timeout threshold. This function
can be used to prevent the conversation from ending, or to take some other action before ending such as using `gotoThread()` to  change the direction of the conversation.

Note that functions used with onTimeout must call `gotoThread()`, `next()`, or `stop()` in order for the conversation to continue.

```
convo.onTimeout(function(convo) {

  convo.say('Oh no! The time limit has expired.');
  convo.next();

});
```

*Provide an `on_timeout` conversation thread:*
Instead of providing a function, developers may choose to specify a pre-defined thread to be used in the case of a timeout event.
This thread should be called `on_timeout`.

```
convo.addMessage('Oh no! The time limit has expired.','on_timeout');
convo.addMessage('TTYL.','on_timeout');
```

#### convo.onTimeout()
| Argument | Description
|--- |---
| callback | _Optional_ Callback in the form function(convo) { ... }

Provide a handler function that will be called in the event that a conversation reaches its timeout threshold without any user response.


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


### Botkit Statistics Gathering

As of version 0.4, Botkit records anonymous usage statistics about Botkit bots in the wild.
These statistics are used by the Botkit team at [Howdy](http://howdy.ai) to measure and
analyze the Botkit community, and help to direct resources to the appropriate parts of the project.

We take the privacy of Botkit developers and their users very seriously. Botkit does not collect,
or transmit any message content, user data, or personally identifiable information to our statistics system.
The information that is collected is anonymized inside Botkit and converted using one-way encryption
into a hash before being transmitted.

#### Opt Out of Stats

To opt out of the stats collection, pass in the `stats_optout` parameter when initializing Botkit,
as seen in the example below:

```javascript
var controller = Botkit.slackbot({
    stats_optout: true
});
```

# Advanced Topics

## Use Botkit with an Express web server
Instead of controller.setupWebserver(), it is possible to use a different web server to manage authentication flows, as well as serving web pages.

Here is an example of [using an Express web server alongside Botkit](https://github.com/mvaragnat/botkit-express-demo).


## Documentation

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [Message Pipeline](readme-pipeline.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Slack](readme-slack.md)
  * [Cisco Spark](readme-ciscospark.md)
  * [Microsoft Teams](readme-teams.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
