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

Your bot will consist of three major components:

* A Botkit-powered Node.js application - this is the container inside which your bot brain lives, and where all its capabilities are defined
* The messaging platform - where users interact with your bot - a set of features, APIs and client applications that your bot interacts with
* A hosting environment - this gives your bot application a publicly reachable address on the public internet, which allows the messaging platform to communicate with your bot





### Developing with Botkit for Microsoft Teams

Information on working with the Botkit bot framework can be found [in our main readme](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit).

## The controller

TODO

#### controller.spawn()

TODO


## Working with Microsoft Teams

TODO

* Events
* API Methods
* Attachments
* Compose Extensions
* Tabs

#### Microsoft Teams-specific Events

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
| invoke | a user clicked an `invoke` button
| composeExtension | user submitted a query with the compose extension


#### Teams API Methods

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
Teams supports communicating with it's API in the form of [Messages, cards, and actions](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages), currently building these attachments are either done by hand using the previously linked specification, using something like:

```
message.attachments = [my attachment]
```

Or by using [the robust message editing tools built-in to Botkit Studio](https://botkit.groovehq.com/knowledge_base/topics/microsoft-teams-attachments).

If you are going to be building your own attachments, Here are a few examples of the different types of messages you can send with Botkit:

```
Picture messages

Inline cards

Hero Cards

Rich Media Attachments

```

### Buttons

TODO




#### Using Compose Extensions


#### Using Tabs
Tabs are one of the [most useful features of bots on Teams](https://msdn.microsoft.com/en-us/microsoft-teams/tabs), providing the ability to display rich web content directly in your team's UI that works in concert with the functionality of your bot.

At their most basic, tabs are simply web applications. We have included some tab examples in the [starter kit](https://github.com/howdyai/botkit-starter-facebook#whats-included) that you can edit for your purposes.

If you are not using the starter kit, you can connect your tab application to your bot application using the following middleware:

```
tab middleware
```


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
