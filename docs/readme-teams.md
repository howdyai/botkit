# Botkit and Microsoft Teams

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Microsoft Teams](https://teams.microsoft.com/). For a full list of supported platforms, [check out the main Botkit readme](https://github.com/howdyai/botkit#botkit---building-blocks-for-building-bots)

Botkit features a comprehensive set of tools to deal with [Microsoft Teams's integration platform](https://msdn.microsoft.com/en-us/microsoft-teams/), and allows developers to build both custom integrations for their team, as well as public "Microsoft Teams Button" applications that can be run from a central location, and be used by many teams at the same time.

This document covers the Microsoft Teams-specific implementation details only. [Start here](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit) if you want to learn about how to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Developing with Microsoft Teams]()
* [Extend your Bot]()
* [Developer and Support Community]()
* [About Botkit]()
* [Botkit Documentation Index]()

---
## Getting Started

Working on Botkit bots for Teams can be a rewarding experience, but there are a few tasks you need to do to setup your bot for development. Here are the mimimal steps you get to get your bot running on Teans:

### Use Botkit Studio
[Botkit Studio](https://studio.botkit.ai/signup?code=slackglitch) is a set of tools that adds capabilities to the open source Botkit library by offering hosted GUI interfaces for script management and action trigger definition.

While Botkit Studio is *not required* to build a bot using Botkit, we highly recommend it as your bot will be easier to manage, customize and extend.

### Install Botkit
To work on your bot, you will need to run Botkit on a web server, which can de done using a variety of methods.

#### Start with a Starter Kit
Our starter kit contains a number of [useful functions](linktowhatsincluded) that will make running your bot a breeze. There are three of recomended paths for setting up your starter kit:

[Remix this project on Glitch]()

[Deploy to Heroku]()

[Hosting this yourself? Clone the Starter kit repo here]()

### Setup your bot on Microsoft's Bot framework
To have a bot on Microsoft Teams, you will need to create a Microsoft account, and log into the [Bot Framework](https://dev.botframework.com/bots) to register your bot. To add the bot to your team you will also need to edit and create some helper files, the steps for which are all outlined in [this provisioning guide]().


## Extend your Bot
Once you have a live bot on teams, now comes the fun part of making your bot. Depending on your use case, you may find that your bot needs mimimal work to peform your ideal role for it, to get you started, here is link to additional Botkit resources:

### Developing with Botkit
Information on working with the Botkit bot framework can be found [in our main readme](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit).

### Use Middleware

The functionality of Botkit can be extended using middleware
functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and the incoming or outgoing message.

For more on the types of Middleware and how to develop for them, please [checkout this document](https://github.com/howdyai/botkit/blob/master/docs/middleware.md).

For information about existing middleware plugins, [see here](readme-middlewares.md)


### Developing for Microsoft Teams
#### Teams API Events
#### bot.api.createConversation(serviceUrl, conversation, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversation | tbd
| cb | tbd

#### bot.api.addMessageToConversation(serviceUrl, conversationId, message, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversationId | tbd
| message | tbd
| cb | tbd

#### bot.api.getChannels(serviceUrl, teamId, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| TeamId | tbd
| cb | tbd

#### bot.api.getUserById(serviceUrl, conversationId, userId, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversationId | tbd
| userId | tbd
| cb | tbd

#### bot.api.getUserByUpn(serviceUrl, conversationId, upn, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversationId | tbd
| upn | tbd
| cb | tbd

#### bot.api.getConversationMembers(serviceUrl, conversationId, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversationId | tbd
| cb | tbd

#### bot.api.getTeamRoster(serviceUrl, teamId, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| teamId | tbd
| cb | tbd

### bot.api.updateMessage(serviceUrl, conversationId, messageId, replacement, cb)
| Parameter | Description
|--- |---
| serviceUrl | tbd
| conversationId | tbd
| messageId | tbd
| replacement | tbd
| cb | tbd


#### Working with attachments and media
#### Using Tabs

## Developer & Support Community
You can find full documentation for Botkit on our [GitHub page](https://github.com/howdyai/botkit/blob/master/readme.md). Botkit Studio users can access the [Botkit Studio Knowledge Base](https://botkit.groovehq.com/help_center) for help in managing their account.

### Get Involved!

###  Need more help?
* Glitch allows users to ask the community for help directly from the editor! For more information on raising your hand, [read this blog post.](https://medium.com/glitch/just-raise-your-hand-how-glitch-helps-aa6564cb1685)

* Join our thriving community of Botkit developers and bot enthusiasts at large. Over 4500 members strong, [our open Slack group](http://community.botkit.ai) is _the place_ for people interested in the art and science of making bots.

 Come to ask questions, share your progress, and commune with your peers!

* We also host a [regular meetup and annual conference called TALKABOT.](http://talkabot.ai) Come meet and learn from other bot developers!

 [Full video of our 2016 event is available on our Youtube channel.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)


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
