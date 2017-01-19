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

1. [Getting Started](#getting-started)
	1. [Install Botkit from NPM or Github](#install-botkit-from-npm-or-github)
	2. [Botkit Starter Kits](#botkit-starter-kits)
	3. [Botkit Studio](#botkit-studio)
2. [Core Concepts](#core-concepts)
3. [Basic Usage](#basic-usage)
	1. [Botkit Statistics Gathering](#botkit-statistics-gathering)
	2. [Opt Out of Stats](#opt-out-of-stats)
4. [Developing with Botkit](#developing-with-botkit)
5. [Deploying your Bot](#deploying-your-bot)
6. [Botkit Community](#botkit-community)
	1. [Contributing](#contributing)
	2. [Have questions? Want to contact us?](#have-questions-want-to-contact-us)
	3. [Join our Bot Developer Hangout](#join-our-bot-developer-hangout)

# Getting Started

There are two basic ways to start a Botkit project:

### Install Botkit from NPM or Github

Botkit is available via NPM.

```bash
npm install --save botkit
```

You can also check out Botkit directly from Git. If you want to use the example code and included bots, it may be preferable to use Github over NPM.

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
Once installed, the first thing you'll need to do is register your bot with [a messaging platform](/docs/platforms/readme.md), and get a few configuration options set. This will allow your bot to connect, send and receive messages.

### Botkit Starter Kits ###
The Botkit community strives to create easy Starter Kits for our full complement of platforms and any possible deploy cases. Starter kits can be focused on [Platforms](), [Hosting services](), or to demonstrate tools like [Botkit Studio]() or [Botkit Middleware]().

## Botkit Studio

[Botkit Studio](https://studio.botkit.ai) is a hosted development environment for bots from the same team that built Botkit.
Based on feedback from the developer community, as well as experience running our flagship Botkit-powered bot, [Howdy](http://howdy.ai), the tools in Botkit Studio allow bot designers and developers to manage many aspects of bot behavior without writing additional code.

[Start building your bot with Botkit Studio](readme-studio.md) and you'll start from day one with extra tools and features that
help you create and manage a successful bot application. It is also possible to add Studio features to your existing Botkit application. [With a few lines of code](readme-studio.md#adding-studio-features-to-an-existing-bot), you can add access new features and APIs.

Botkit Studio is built on top of Botkit, so everything that works with Botkit continues to just work. Botkit Studio is *not* required to use Botkit, but it is strongly recomended. All of the available intregrations and middleware are compatible! 

# Core Concepts

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

[Connect your bot to Slack](docs/platforms/slack/readme-slack.md#connecting-your-bot-to-slack)

* [Facebook Messenger Webhooks](https://developers.facebook.com/docs/messenger-platform/implementation)

[Connect your bot to Facebook Messenger](docs/platforms/facebook/readme-facebook.md#getting-started)


* [Twilio IP Messaging](https://www.twilio.com/user/account/ip-messaging/getting-started)

[Connect your bot to Slack](docs/platforms/twilio/readme-twilioipm.md#getting-started)


* [Microsoft Bot Framework](http://botframework.com/)

[Connect your bot to Slack](docs/platforms/microsoft/readme-botframework.md#getting-started)


* [Cisco Spark](https://developer.ciscospark.com/)

[Connect your bot to Cisco Spark](docs/platforms/cisco/readme-slack.md#connecting-your-bot-to-slack)

## Basic Usage

Here's an example of using Botkit with Slack's [real time API](https://api.slack.com/rtm). You can [read the documentation](docs/platforms/readme.md) for a given source to find similar usage information for your source of choice.

This sample bot listens for the word "hello" to be said to it -- either as a direct mention ("@bot hello") or an indirect mention ("hello @bot") or a direct message (a private message inside Slack between the user and the bot).

The Botkit constructor returns a `controller` object. By attaching event handlers to the controller object, developers can specify what their bot should look for and respond to, including keywords, patterns and various [messaging and status events](#responding-to-events). These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human says THIS the bot does THAT."

The `controller` object is then used to `spawn()` bot instances that represent a specific bot identity and connection to Slack. Once spawned and connected to the API, the bot user will appear online in Slack, and can then be used to send messages and conduct conversations with users. They are called into action by the `controller` when firing event handlers.

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

As of version 0.4, Botkit records anonymous usage statistics about Botkit bots in the wild. These statistics are used by the Botkit team at [Howdy](http://howdy.ai) to measure and analyze the Botkit community, and help to direct resources to the appropriate parts of the project.

We take the privacy of Botkit developers and their users very seriously. Botkit does not collect, or transmit any message content, user data, or personally identifiable information to our statistics system. The information that is collected is anonymized inside Botkit and converted using one-way encryption into a hash before being transmitted.

#### Opt Out of Stats

To opt out of the stats collection, pass in the `stats_optout` parameter when initializing Botkit, as seen in the example below:

```
var controller = Botkit.slackbot({
    stats_optout: true
});
```

# Developing with Botkit
### Sending and Receiving
TODO write a description of this concept, link to developing doc.

### Middleware
The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot’s configuration and the incoming or outgoing message. Anyone can [create their own middleware](docs/advance usage/readme-creating middleware.md), and if they wish, be added to our [directory of available middlewares](docs/advance usage/readme-creating middleware.md).

### Integrate your application with Botkit Studio
TODO write a description of this concept, link to developing doc.

# Deploying your Bot
For the purposes of creating a bot, you may find that running your server locally is suitable for the devlopment process. When you want to deploy the bot to production, there are [numerous hosting solutions]() available that provide easy deployment and testing of your work.

# Botkit Community
Github has recognized Botkit as one of [the top communities for new contributors](https://github.com/showcases/great-for-new-contributors), and to support all kinds of users in our community, we have a few resources to help you make great bots.

### Contributing
We are always looking to improve Botkit, and will welcome any help from our community with regards to new features, bug fixes, and documentation enhancements. [These are a few guidelines to get you started on contributing to this project](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md#submitting-issues).

### Have questions? Want to contact us?
Having trouble with a aspect of creating a bot? While we do not provide direct support, you can [search existing issues](https://github.com/howdyai/botkit/issues), or [post a new issue on our github](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md#submitting-issues). 

Botkit Studio users [should view our documentation](https://studio.botkit.ai/docs) and can contact our support team via [their account portal](https://studio.botkit.ai/account).

If you need to contact Howdy, the maintainers of Botkit, you can do so via [our homepage](https://botkit.ai/).

### Join our Bot Developer Hangout
We maintain a public Slack with over 5000 developers discussing the nuts and bolts of building bots. With users of all skill levels, and representives of the platforms we support, this is a [great resource for anyone looking to connect with other developers.](http://dev4slack.xoxco.com/)


