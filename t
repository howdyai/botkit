# Botkit and Microsoft Teams

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Microsoft Teams](https://teams.microsoft.com/). For a full list of supported platforms, [check out the main Botkit readme](https://github.com/howdyai/botkit#botkit---building-blocks-for-building-bots)

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
Working on Botkit bots for Teams can be a rewarding experience, but there are a few tasks you need to complete o to setup your bot for development.

### Use Botkit Studio
[Botkit Studio](https://studio.botkit.ai/signup?code=teams) is a set of tools that adds capabilities to the open source Botkit library by offering hosted GUI interfaces for script management and action trigger definition.

Studio contains tools that greatly streamline the steps required to get a bot up on Microsoft Teams, for more information on thease tools, please see these articles on the [Botkit Studio knowledge base](https://botkit.groovehq.com/knowledge_base/categories/microsoft-teams-2).

While Botkit Studio is *not required* to build a bot using Botkit, we highly recommend it as your bot will be easier to manage, customize and extend.

### Install Botkit
To work on your bot, you will need to run Botkit on a web server, which can de done using a variety of methods of your choosing.

#### Start with a Starter Kit
The Teams starter kit contains a number of [useful functions](linktowhatsincluded) that will make running your bot a breeze. There are three recommended paths for setting up your starter kit:

[Remix this project on Glitch]()

[Deploy to Heroku]()

[Hosting this yourself? Clone the Starter kit repo here]()

### Setup your bot on Microsoft's Bot framework
To have a bot on Microsoft Teams, you will need to have or create a Microsoft account, and then log into the [Microsoft Bot Framework](https://dev.botframework.com/bots) to register your bot. To add the bot to your team you will also need to create and edit some helper files , the steps for which are all outlined in [this provisioning guide](https://github.com/howdyai/botkit/blob/master/docs/provisioning/teams.md).

## Extend your Bot
Once you have a operational bot communicating with Teams, now comes the fun part of making your bot. Depending on your use case, you may find that your bot needs minimal work to perform your ideal use of it, to get you started, here is link to additional Botkit resources:

### Developing with Botkit
Information on working with the Botkit bot framework can be found [in our main readme](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit).

### Use Middleware
The functionality of Botkit can be extended using middleware
functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and the incoming or outgoing message.

For more on the types of Middleware and how to develop for them, [checkout this document](https://github.com/howdyai/botkit/blob/master/docs/middleware.md).

For information about existing middleware plugins, [see here](readme-middlewares.md)

### Developing for Microsoft Teams
The [Microsoft Teams API](https://msdn.microsoft.com/en-us/microsoft-teams/) provides a number of functions the bot developer can use to power a useful bot application that operates seamlessly in Teams.

Botkit provides the following resources to make the most of them:
#### Teams API Events
The following Botkit API events are available for Teams:

#### bot.api.createConversation(serviceUrl, conversation, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| cb | Callback function in the form function(err, file_info)

#### bot.api.addMessageToConversation(serviceUrl, conversationId, message, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| message | The contents of your message
| cb | Callback function in the form function(err, file_info)
```javascript
tbd
```

#### bot.api.getChannels(serviceUrl, teamId, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| TeamId | The unique identifier for a given team
| cb | Callback function in the form function(err, file_info)
```javascript
tbd
```

#### bot.api.getUserById(serviceUrl, conversationId, userId, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| userId | The unique identifier for a given user
| cb | Callback function in the form function(err, file_info)
```javascript
tbd
```

#### bot.api.getUserByUpn(serviceUrl, conversationId, upn, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| upn | The [User Principal Name](https://msdn.microsoft.com/en-us/library/windows/desktop/ms721629(v=vs.85).aspx#_security_user_principal_name_gly) of a given team member
| cb | Callback function in the form function(err, file_info)

This function will return a User's info from the API. Example:

```javascript
tbd
```

#### bot.api.getConversationMembers(serviceUrl, conversationId, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| cb | Callback function in the form function(err, file_info)

```javascript
tbd
```

#### bot.api.getTeamRoster(serviceUrl, teamId, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| teamId | The unique identifier for a given team
| cb | Callback function in the form function(err, file_info)

```javascript
tbd
```

### bot.api.updateMessage(serviceUrl, conversationId, messageId, replacement, cb)
| Parameter | Description
|--- |---
| serviceUrl | The endpoint to which your bot should send its response
| conversationId | Contains the unique identifier of a conversation
| messageId | Contains the unique identifier of a message
| replacement | The text that you are using in place of the existing content
| cb | Callback function in the form function(err, file_info)

```javascript
tbd
```

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
