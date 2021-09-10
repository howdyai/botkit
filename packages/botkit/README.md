# Botkit - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)
[![Build Status](https://travis-ci.com/howdyai/botkit.svg?branch=master)](https://travis-ci.com/howdyai/botkit)

**Botkit is an open source developer tool for building chat bots, apps and custom integrations for major messaging platforms.**

## The information in this document is for the brand new 4.0 branch of Botkit! If you're looking for documentation for previous versions, [look here](https://github.com/howdyai/botkit-docs).

## Install Botkit

The best way to get started locally with Botkit is by installing our Yeoman template, and using it to create a new Botkit project. 
This will install and configure a starter kit for you!

```bash
npm install -g yo generator-botkit
yo botkit
```

### Remix on Glitch

Want to dive right in? [Remix one of our starter kits on Glitch](https://glitch.com/botkit). You'll start with a fully functioning app that you can edit and run from the browser!

 [![Remix on Glitch](https://github.com/howdyai/botkit/blob/main/packages/docs/glitch.png?raw=true)](https://glitch.com/botkit)

## Build Your Bot

The goal of Botkit is to make it easier and more fun to build software that talks and works like a robot! 
Building a bot should feel cool, and not too technically complicated.

Botkit handles all the nitty gritty details like
API calls, session management and authentication,
allowing you to focus on building COOL FEATURES for your
bot using middleware and event handlers.

The toolkit is designed to provide meaningful building blocks for creating conversational user interfaces - with functions like `hears()`, `ask()`, and `reply()` that do what they say they do.

The [full documentation for Botkit's capabilities begins here &raquo;](../docs/index.md)

## Platform Support

Botkit can connect to multiple messaging channels through the [Microsoft Bot Framework Service](https://dev.botframework.com).
No plugins are necessary to use the Bot Framework service, and bots can be developed locally using the [Bot Framework Emulator](https://aka.ms/botframework-emulator).

The Botkit project includes several official adapters. Using these plugins, your bot can communicate directly with the messaging platforms.

* [Self-hosted web chat](../botbuilder-adapter-web)
* [Slack](../botbuilder-adapter-slack)
* [Webex Teams](../botbuilder-adapter-webex)
* [Facebook Messenger](../botbuilder-adapter-facebook)
* [Twilio SMS](../botbuilder-adapter-twilio-sms)
* [Google Hangouts](../botbuilder-adapter-hangouts)

Additional adapters can be found by [searching npm for Bot Framework-compatible adapters](https://www.npmjs.com/search?q=botbuilder-adapter). The open source community has created a variety of plugins and extensions to Bot Framework.  Check out the [Bot Builder Community Repo](https://github.com/BotBuilderCommunity/botbuilder-community-js) for additional adapters, storage connectors and middlewares.

[Platform specific documentation can be found on the main docs site  &raquo;](../docs/platforms/index.md)

### Hearing Keywords

Most bots do their thing by listening for keywords, phrases or patterns in messages from users. Botkit has a special event handler called `hears()` that makes it easy to configure your bot to listen for this type of trigger.

```javascript
controller.hears(['string','pattern .*',new RegExp('.*','i')],'message,other_event', async (bot, message) => {

  // do something!
  await bot.reply(message, 'I heard a message.')

});
```

[Read more about hearing things &rsaquo;](../docs/core.md#matching-patterns-and-keywords-with-hears)

### Responding to Events

Bots can respond to non-verbal events as well, like when a new user joins a channel, a file gets uploaded, or a button gets clicked. These events are handled using an event handling pattern that should look familiar. Most events in Botkit can be replied to like normal messages.

```javascript
controller.on('channel_join', async (bot, message) => {

  await bot.reply(message,'Welcome to the channel!');

});
```

[See a full list of events and more information about handling them &rsaquo;](../docs/core.md#receiving-messages-and-events)

### Middleware

In addition to taking direct action in response to a certain message or type of event, Botkit can also take passive action on messages as they move through the application using middlewares. Middleware functions work by changing messages, adding new fields, firing alternate events, and modifying or overriding the behavior of Botkit's core features.

Middleware can be used to adjust how Botkit receives, processes, and sends messages.

```javascript
// Log every message received
controller.middleware.receive.use(function(bot, message, next) {

  // log it
  console.log('RECEIVED: ', message);

  // modify the message
  message.logged = true;

  // continue processing the message
  next();

});

// Log every message sent
controller.middleware.send.use(function(bot, message, next) {

  // log it
  console.log('SENT: ', message);

  // modify the message
  message.logged = true;

  // continue processing the message
  next();

});
```
## Documentation

[Full documentation of Botkit, including a class reference, can be found on the docs site](../docs/index.md).

## [Change Log](https://github.com/howdyai/botkit/blob/master/changelog.md)

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our Github site](https://github.com/howdyai/botkit) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](https://github.com/howdyai/botkit/blob/master/LICENSE.md)
