# [Botkit](http://howdy.ai/botkit) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)

Botkit is designed to ease the process of designing and running useful, creative bots that live inside popular messaging platforms, including:

* [Slack](docs/platforms/slack/readme-slack.md)
* [Facebook Messenger](docs/platforms/facebook/readme-facebook.md)
* [Twilio IP Messaging](docs/platforms/twilio/readme-twilioipm.md)
* [Cisco Spark](docs/platforms/cisco/readme-ciscospark.md)
* [Microsoft Bot Framework](docs/platforms/microsoft/readme-botframework.md)
* Yours? [info@howdy.ai](mailto:info@howdy.ai)

## Getting Started

There are two basic ways to start a Botkit project:

1) [Install Botkit directly from NPM or Github](#install-botkit-from-npm-or-github) and build a new app from scratch, or use one of the [included examples](#included-examples) as a starting point.

2) [Install the a Botkit Starter Kit](#install-botkit-using-a-starter-kit)
) and build on top of an already fully functioning bot that comes pre-configured with popular middleware plug-ins and components.



### Install Botkit from NPM or Github

Botkit is available via NPM.

```bash
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
Once installed, the first thing you'll need to do is register your bot with a messaging platform, and get a few configuration options set. This will allow your bot to connect, send and receive messages.

Currently Botkit can connect to the following platforms

* [Slack](readme-slack.md#getting-started)
* [Facebook](readme-facebook.md#getting-started)
* [Twilio IPM](readme-twilioipm.md#getting-started)
* [Microsoft Bot Framework](readme-botframework.md#getting-started).


### Install Botkit using a starter kit
Todo: list all known starter kits


## Botkit Studio

[Botkit Studio](https://studio.botkit.ai) is a hosted development environment for bots from the same team that built Botkit.
Based on feedback from the developer community, as well as experience running our flagship Botkit-powered bot, [Howdy](http://howdy.ai),
the tools in Botkit Studio allow bot designers and developers to manage many aspects of bot behavior without writing additional code.

[Start building your bot with Botkit Studio](readme-studio.md) and you'll start from day one with extra tools and features that
help you create and manage a successful bot application. It is also possible to add Studio features to your existing Botkit application. [With a few lines of code](readme-studio.md#adding-studio-features-to-an-existing-bot), you can add access new features and APIs.

Botkit Studio is built on top of Botkit, so everything that works with Botkit continues to just work. All of the available plugins and middleware are compatible! 

## Core Concepts

Bots built with Botkit have a few key capabilities, which can be used to create clever, conversational applications. These capabilities map to the way real human people talk to each other.

Bots can [hear things](#receiving-messages), [say things and reply](#sending-messages) to what they hear.

With these two building blocks, almost any type of conversation can be created.

To organize the things a bot says and does into useful units, Botkit bots have a subsystem available for managing [multi-message conversations](#multi-message-replies-to-incoming-messages). Conversations add features like the ability to ask a question, queue several messages at once, and track when an interaction has ended.  Handy!

After a bot has been told what to listen for and how to respond,
it is ready to be connected to a stream of incoming messages. Currently, Botkit supports receiving messages from a variety of sources:

* [Slack Events API](https://api.slack.com/events-api)
* [Slack Real Time Messaging (RTM)](http://api.slack.com/rtm)
* [Slack Incoming Webhooks](http://api.slack.com/incoming-webhooks)
* [Slack Slash Commands](http://api.slack.com/slash-commands)
* [Facebook Messenger Webhooks](https://developers.facebook.com/docs/messenger-platform/implementation)
* [Twilio IP Messaging](https://www.twilio.com/user/account/ip-messaging/getting-started)
* [Microsoft Bot Framework](http://botframework.com/)
* [Cisco Spark](https://developer.ciscospark.com/)

Read more about [connecting your bot to Slack](readme-slack.md#connecting-your-bot-to-slack), [connecting your bot to Facebook](readme-facebook.md#getting-started), [connecting your bot to Twilio](readme-twilioipm.md#getting-started),
or [connecting your bot to Microsoft Bot Framework](readme-botframework.md#getting-started)




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

```
var controller = Botkit.slackbot({
    stats_optout: true
});
```
## Middleware
Brief Description, link to doc.
## Developing with Botkit

Brief Description, link to doc.

## Deploying your Bot

Brief Description, link to doc.

## Botkit Community

Brief Description, links to communities. 

### Chat with us at dev4slack.slack.com
You can get an invite here: http://dev4slack.xoxco.com/.
### Contributing

Brief Description, link to doc.

### Getting help

Brief Description, link to doc.