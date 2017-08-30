# Botkit for Microsoft Teams

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Microsoft Teams](https://products.office.com/en-us/microsoft-teams/group-chat-software). For a full list of supported platforms, [check out the main Botkit readme](https://github.com/howdyai/botkit#botkit---building-blocks-for-building-bots)

Botkit features a comprehensive set of tools to deal with [Microsoft Teams's integration platform](https://msdn.microsoft.com/en-us/microsoft-teams/), and allows developers to build both custom integrations for their team, as well as public "Microsoft Teams" applications that can be run from a central location, and be used by many teams at the same time.

This document covers the Microsoft Teams-specific implementation details only. [Start here](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit) if you want to learn about how to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Extend your Bot]()
* [Developing with Microsoft Teams]()
* [Developer and Support Community]()
* [About Botkit]()
* [Botkit Documentation Index]()

## Getting Started

Building bots is a fun and rewarding experience, but requires a few technical details be sorted out before you can start poking around inside your robot's brain.

To get started building your bot, you'll need get these *three components* set up so that they can communicate with each other:

* A Botkit-powered Node.js web app - this is the container inside which your bot brain lives, and where all its capabilities are defined
* The messaging platform - the place users interact with your bot, which provides a set of features, APIs and client applications
* A hosting environment - this gives your bot application a publicly reachable address on the public internet, which allows the messaging platform to communicate with your bot

Getting these elements in place is a multi-step process, but only takes a few minutes, and in most cases, only has to be done once!

### Fastest Option: Use Botkit Studio

The fastest way to get up and running with Botkit for Microsoft Teams is to use [Botkit Studio](https://studio.botkit.ai).
Botkit Studio will guide you through the process of setting up the [Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams),
walk you through the process of configuring the Microsoft Teams and Bot Framework APIs,
and deploy your bot to a stable hosting environment so that you can start building right away.

**[![Sign up for Botkit Studio](docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**

### Manual Setup: Get the Starter Kit

If you are comfortable with developer tools like Git, NPM, and setting up your own web host,
or if you want to build your bot on your laptop before making it available on the internet,
you can start by cloning the [Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams).
The starter kit contains everything you need to build your bot, including a pre-configured Express webserver,
customizable webhook endpoints, and a set of example features that provide a great base for your new bot.

[Get Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams)

[Read our step-by-step guide for configuring your starter kit](provisioning/teams.md)

### Expert Option: Get Botkit from NPM

If you are excited about building your entire bot from scratch,
or if you want to integrate bot functionality into an existing Node application,
you can install the Botkit core library directly from NPM.

`npm install --save botkit`

If you choose to use Botkit's core library directly like this, you'll need
to either use Botkit's simple [built-in webserver](#using-the-built-in-webserver),
or configure your own webserver and connect it to Botkit.
An example of this can be seen [in the starter kit](https://github.com/howdyai/botkit-starter-teams).

([Our step-by-step guide to setting things up is probably still be useful, even for experts.](provisioning/teams.md))

## Developing with Botkit for Microsoft Teams

The full code for a simple Microsoft Teams bot is below:

~~~ javascript
var Botkit = require('botkit');

var controller = Botkit.teamsbot({
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, function() {
        console.log("BOTKIT: Webhooks set up!");
    });
});

controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});
~~~

#### Botkit.teamsbot()
| Argument | Description
|--- |---
| client_id | The application' client id, provided by Bot Framework
| client_secret | The application's client secret, provided by Bot Framework

This function creates a Teams-ready Botkit controller. The values for client_id and client_secret must be acquired from [Bot Framework](http://dev.botframework.com).

~~~ javascript
var controller = Botkit.teamsbot({
    debug: true,
    log: true,
    client_id: process.env.client_id,
    client_secret: process.env.client_secret
});
~~~

#### controller.spawn()
| Argument | Description
|--- |---
| options | An object defining options for this specific bot instance - MUST include a serviceUrl.

This function returns a new instance of the bot. This is used internally by Botkit
to respond to incoming events.

When spawning a bot for Microsoft Teams, you must pass in a `serviceUrl` field as part of
the options parameter.  The serviceUrl can be extracted from the incoming message payload at `message.serviceUrl`.

For those curious about this parameter: the serviceUrl is used to construct API calls the bot makes to Microsoft's API endpoints.
The endpoint URLs are actually defined dynamically in response to different kinds of incoming messages. This is because Microsoft Teams is just one of a
network of Microsoft products that uses the Bot Framework API specification, each one with its own endpoint URLs.

In the event that your bot needs to send outbound messages without first receiving an inbound event from teams,
you should capture and store the serviceUrl value you receive from the `bot_channel_join` event, which indicates
that a bot has been added to a new team.

```
var bot = controller.spawn({serviceUrl: my_team_info.serviceUrl});
```

#### Using the built-in webserver

In order to receive messages and other events from Microsoft Teams, Botkit must
expose multiple web endpoints.

Botkit includes a simple built-in webserver based on Express that is great for
getting started. With just a few lines of code, Botkit automatically configure
the necessary web endpoints. There are very few options available for the built-in
webserver, as it is intended to be used only for stand-alone bots.

If you want your bot application to have additional web features (like [tabs](#using-tabs)),
or if you need to add bot functionality to an existing Express website,
or if you want to configure your own custom endpoints,
we suggest using the [Express Webserver component](https://github.com/howdyai/botkit-starter-teams/blob/master/components/express_webserver.js)
and [Incoming Webhook Route](https://github.com/howdyai/botkit-starter-teams/blob/master/components/routes/incoming_webhooks.js)
from the Botkit Starter Kit as a guide for your custom implementation.

#### controller.setupWebserver()
| Argument | Description
|---  |---
| port | port for webserver
| callback | callback function

Setup an [Express webserver](http://expressjs.com/en/index.html) for
use with `createWebhookEndpoints()`

#### controller.createWebhookEndpoints()
| Argument | Description
|---  |---
| webserver | An instance of the Express webserver

This function configures the route `http://_your_server_/teams/receive`
to receive incoming event data from Microsoft Teams.

This url should be used when configuring your Bot Framework record.

## Working with Microsoft Teams

In addition to sending and receiving chat messages, Botkit bots can use all
of the other features in the Microsoft Teams API. With these other features,
Botkit bots can send rich attachments with interactive buttons, integrate into
the message composer, and expose integrated tab applications that live inside
the Teams window and share data with the bot.

* [Events](#microsoft-teams-specific-events)
* [API Methods](#api-methods)
* [Attachments](#working-with-attachments-and-media)
* [Buttons](#buttons)
* [User Mentions](#user-mentions)
* [Compose Extensions](#using-compose-extensions)
* [Tabs](#using-tabs)

### Microsoft Teams-specific Events

Botkit receives and makes available all of the events supported by Microsoft Teams.

The full list and payload schema of these events is [available from Microsoft](https://msdn.microsoft.com/en-us/microsoft-teams/botevents).

These events undergo a normalization process for use inside Botkit,
so that any type of event can be passed to `bot.reply()` in order for a normal
message response to be sent. All incoming events will have _at least_ the following fields:

```
{
  type: <type of event>,
  user: <microsoft teams user ID>,
  channel: <id for channel or 1:1 conversation>,
  text: <text of message or primary payload value if present>,
  raw_message: <the original event data>
}
```

Botkit leaves all the native fields intact, so any fields that come in from Teams are still present in the original message.
However, our recommendation for accessing any Teams-native fields is to use the `message.raw_message` sub-object
which contains an unmodified version of the event data.

#### Message Received Events
| Event | Description
|--- |---
| direct_message | the bot received a 1:1 direct message from a user
| direct_mention | the bot was addressed directly in a mult-user channel ("@bot hello!")
| mention | the bot was mentioned by someone in a message ("hello everyone including @bot")

#### User Activity Events:

| Event | Description
|--- |---
| bot_channel_join | the bot has joined a channel
| user_channel_join | a user has joined a channel
| bot_channel_leave | the bot has left a channel
| user_channel_leave | a user has left a channel

#### Channel Events
| Event | Description
|--- |---
| channelDeleted | a channel was deleted
| channelRenamed | a channel was renamed
| channelCreated | a new channel was created

#### Teams Features
| Event | Description
|--- |---
| invoke | a user clicked an `invoke` button [See Buttons](#buttons)
| composeExtension | user submitted a query with the compose extension [See Compose Extensions](#using-compose-extensions)


#### API Methods

The [Microsoft Teams API](https://msdn.microsoft.com/en-us/microsoft-teams/botapis) provides a number of features the bot developer can use to power a useful bot application that operates seamlessly in Teams.

#### bot.api.getUserById(conversationId, userId, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| userId | The unique identifier for a given user
| cb | Callback function in the form function(err, user_profile)

`getUserById` takes elements from an incoming message object, and returns the user profile data
associated with the message's sender.

```javascript
controller.hears('who am i', 'direct_message, direct_mention', function(bot, message) {
    bot.api.getUserById(message.channel, message.user, function(err, user) {
        if (err) {
          bot.reply(message,'Error loading user:' + err);
        } else {
          bot.reply(message,'You are ' + user.name + ' and your email is ' + user.email + ' and your user id is ' + user.id);
        }
    });
});
```

#### bot.api.getUserByUpn(conversationId, upn, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| upn | The [User Principal Name](https://msdn.microsoft.com/en-us/library/windows/desktop/ms721629(v=vs.85).aspx#_security_user_principal_name_gly) of a given team member
| cb | Callback function in the form function(err, user_profile)

This function is identical to `getUserById()`, but instead of fetching the user by the Teams-only user ID, it uses the user's "universal principal name" or "UPN", which defines the account in terms of the broader Microsoft Office ecosystem. This function is useful when connecting users in Microsoft Teams chat with the same users in a [Tab Application](#using-tabs), as tab applications only expose the `upn` value.

The [Botkit Starter Kit for Microsoft Teams]() includes [a sample middleware]() that uses this function to automatically
translate the Teams-only ID into a UPN for use with the [built-in storage system](storage.md).

#### bot.api.getConversationMembers(conversationId, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| cb | Callback function in the form function(err, members)

This function returns a list of members in the specified channel - either a 1:1 channel, or a multi-user team channel.
This API returns an array of user profile objects identical to those returned by `getUserById()` and `getUserByUpn()`.

```javascript
controller.hears('get members','direct_mention,direct_message', function(bot, message) {
  bot.api.getConversationMembers(message.channel, function(err, roster) {
    if (err) {
      bot.reply(message,'Error loading roster: ' + err);
    } else {

      var list = [];
      for (var u = 0; u < roster.length; u++) {
        list.push(roster[u].name);
      }
      bot.reply(message,'Conversation members: ' + list.join(', '));
    }
  });
});
```

#### bot.api.getTeamRoster(teamId, cb)
| Parameter | Description
|--- |---
| teamId | The unique identifier for a given team
| cb | Callback function in the form function(err, members)

This function works just like `getConversationMembers()`, but returns all members of a team instead of just the members of a
specific channel.

The teamId, when present, can be extracted from a message object at the Teams-specific field `message.channelData.team.id`. This field is present in messages that occur in multi-user channels, but not in 1:1 messages and other events.

Note that since the team id is not always part of the incoming message payload, and because all multi-user channel contain all members
of the team, `getConversationMembers()` is likely more reliable and easy to use.

```javascript
controller.hears('roster','direct_mention', function(bot, message) {
  bot.api.getTeamRoster(message.channelData.team.id, function(err, roster) {
    if (err) {
      bot.reply(message,'Error loading roster: ' + err);
    } else {
      var list = [];
      for (var u = 0; u < roster.length; u++) {
        list.push(roster[u].name);
      }
      bot.reply(message,'Team roster: ' + list.join(', '));
    }
  });

});
```

### bot.api.updateMessage(conversationId, messageId, replacement, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the identifier for the conversation in which the original message occured
| messageId | Contains the unique identifier of message to be replaced
| replacement | A message object which will be used to replace the previous message
| cb | Callback function in the form function(err, results)

This method allows you to update an existing message with a replacement.
This is super handy when responding to button click events, or updating a message with new information.

In order to update a message, you must first capture it's ID. The message id is part of the response
passed back from bot.reply or bot.say.

`updateMessage()` expects an API-ready message object - the replacement message does _not_ undergo the
normal pre-send transformations that occur during a normal bot.reply or bot.say.

```javascript
  controller.hears('update', 'direct_message,direct_mention', function(bot, message) {
      bot.reply(message,'This is the original message', function(err, outgoing_message) {
          bot.api.updateMessage(message.channel, outgoing_message.id, {type: 'message', text: 'This message has UPDATED CONTENT'}, function(err) {
            if (err) {
              console.error(err);
            }
          });
      });
  })
```

#### bot.api.getChannels(teamId, cb)
| Parameter | Description
|--- |---
| teamId | The unique identifier for a given team
| cb | Callback function in the form function(err, channels)

This function returns an array of all the channels in a given team.

The teamId, when present, can be extracted from a message object at the Teams-specific field `message.channelData.team.id`. This field is present in messages that occur in multi-user channels, but not in 1:1 messages and other events.

```javascript
  controller.hears('channels','direct_mention', function(bot, message) {
    bot.api.getChannels(message.channelData.team.id, function(err, roster) {
      if (err) {
        bot.reply(message,'Error loading channel list: ' + err);
      } else {
        var list = [];
        for (var u = 0; u < roster.length; u++) {
          list.push(bot.channelLink(roster[u]));
        }
        bot.reply(message,'Channels: ' + list.join(', '));
      }
    });
  });
```


#### bot.api.addMessageToConversation(conversationId, message, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| message | The contents of your message
| cb | Callback function in the form function(err, results)

This function is used to send messages to Teams. It is used internally by Botkit's
`bot.say()` function, and is not intended to be used directly by developers.

#### bot.api.createConversation(options, cb)
| Parameter | Description
|--- |---
| options | an object containing {bot: id, members: [], channelData: {}}
| cb | Callback function in the form function(err, new_conversation_object)

This function creates a new conversation context inside Teams.
This is used internally by Botkit inside functions like `startPrivateConversation()`
(to create the 1:1 channel between user and bot). It is not intended to be used directly by developers.


#### Working with attachments and media

In addition to, or as an alternative to text, messages in Microsoft Teams can include one or more attachments.
Attachments appear as interactive cards inside the Teams client, and can include elements such as images,
text, structured data, and interactive buttons.

[Read the official Teams documentation about message attachments](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages)

To use attachments with Botkit, construct an attachment object and add it to the message object.

```javascript
controller.hears('card', function(bot, message) {

  var reply = {
    text: 'Here is an attachment!',
    attachments: [],
  }

  var attachment = {
      // attachment object
  }

  reply.attachments.push(attachment);

  bot.reply(message, reply);

});
```

##### Multiple Attachments

When sending multiple attachments, you may want to specify the `attachmentLayout` attribute
of the message object. Setting `attachmentLayout` to `carousel` will cause attachments
to be displayed as a [carousel](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#carousel-layout), while the default behavior is to use a [list layout](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#list-layout).


##### Sample Hero Card

TODO


##### Sample Thumbnail Card
TODO


##### Sample Image Attachment
TODO


##### Sample O365 Connector Card
TODO


### Buttons

Buttons can be included in attachments.
There are [several types of button](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#buttons) that result in different actions.

* openUrl buttons cause a browser to open to a specific web url
* invoke buttons cause a message to be sent back to your bot application
* imBack buttons cause the user to "say" something back to the bot
* messageBack buttons cause the user to "say" something back to your bot, while displaying a different message for other users to see.

To use buttons, include them in your attachment objects, as seen in the examples above.

#### Handling Invoke Events


### User Mentions

TODO


#### Using Compose Extensions


#### Using Tabs
Tabs are one of the [most useful features of bots on Teams](https://msdn.microsoft.com/en-us/microsoft-teams/tabs), providing the ability to display rich web content directly in your team's UI that works in concert with the functionality of your bot.

At their most basic, tabs are simply web applications. We have included some tab examples in the [starter kit](https://github.com/howdyai/botkit-starter-facebook#whats-included) that you can edit for your purposes.

If you are not using the starter kit, you can connect your tab application to your bot application using the following middleware:

```
tab middleware
```

#### App Package / Manifest File

Before your bot application can be used, you must prepare an "App Package" -
a zip file containing a JSON file of configuration options, and (optionally)
icons for your bot to use inside the Teams interface. This file must then be
"sideloaded" into your Microsoft Teams account - this is just a fancy way
of saying that you will have to upload this file into a settings page.

The manifest.json file is a hefty document, with lots of options! [Here is the full documentation from Microsoft](https://msdn.microsoft.com/en-us/microsoft-teams/schema).
We highly recommend using [Botkit Studio](https://studio.botkit.ai) to build your app package, as we have provided
an easy to use tool to configure and generate the necessary file!

[Manifest.json schema docs](https://msdn.microsoft.com/en-us/microsoft-teams/schema)

[How to sideload your app](https://msdn.microsoft.com/en-us/microsoft-teams/sideload)


## Developer & Support Community
Complete documentation for Botkit can be found on our [GitHub page](https://github.com/howdyai/botkit/blob/master/readme.md). Botkit Studio users can access the [Botkit Studio Knowledge Base](https://botkit.groovehq.com/help_center) for help in managing their Studio integration.

### Get Involved!
Botkit is made possible with feedback and contributions from the community. A full guide to submitting code, reporting bugs, or asking questions on [Github can be found here](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

###  Need more help?
* Join our thriving community of Botkit developers and bot enthusiasts at large. Over 4500 members strong, [our open Slack group](http://community.botkit.ai) is _the place_ for people interested in the art and science of making bots.

Come to ask questions, share your progress, and commune with your peers!

* We also host a [regular meet-up called TALKABOT.](http://talkabot.ai) Come meet, present, and learn from other bot developers!

 [Full video of our 2016 conference is available on our Youtube channel.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)


## About Botkit
Botkit is a product of [Howdy](https://howdy.ai) and made in Austin, TX with the help of a worldwide community of botheads.

## Botkit Documentation Index

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Slack](readme-slack.md)
  * [Cisco Spark](readme-ciscospark.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
