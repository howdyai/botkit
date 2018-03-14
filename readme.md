# [Botkit](https://botkit.ai) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)
[![bitHound Overall Score](https://www.bithound.io/github/howdyai/botkit/badges/score.svg)](https://www.bithound.io/github/howdyai/botkit)

**Botkit is the leading developer tool for building chat bots, apps and custom integrations for major messaging platforms.**

Botkit offers everything you need to design, build and operate an app:

* Easy-to-extend starter kits
* Fully-featured SDK with support for all major platforms
* Content management and design tools (with [Botkit Studio](https://studio.botkit.ai))
* Built-in analytics and CRM tools (with [Botkit Studio](https://studio.botkit.ai))
* [Tons of plugins and middlewares](https://botkit.ai/docs/readme-middlewares.html)

Plus, Botkit works with all the NLP services (like Microsoft LUIS and IBM Watson), can use any type of database you want, and runs on almost any hosting platform.

# Install Botkit
Botkit is a Node.js module, and works with Node and npm.

### **Botkit Studio**

Botkit Studio is a dashboard and IDE designed to super-charge Botkit. It includes a web-based interface for building and managing dialog, an activity console, third party integrations, and advanced analytics tools like customer segmenting, conversion funnels, and user retention metrics.

Sign up for a free Botkit Studio account, and it will guide you through the process to create, configure and deploy your Botkit app!

**[![Sign up for Botkit Studio](docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**


### **Remix on Glitch**

Want to dive right in? [Remix one of our starter kits on Glitch](https://glitch.com/botkit). You'll start with a fully functioning app that you can edit and run from the browser!

 [![Remix on Glitch](docs/glitch.png)](https://glitch.com/botkit)


### **Command Line Interface**

The best way to get started locally with Botkit is by installing our command line tool, and using it to create a new Botkit project. This will install and configure a starter kit for you!

```
npm install -g botkit
botkit new
```

### **Start from Scratch**

You can also add Botkit into an existing Node application.

First, add it to your project:

```
npm install --save botkit
```

Then, add Botkit to your application code:

```
var Botkit = require('botkit');

var controller = Botkit.anywhere(configuration);

controller.hears('hello','direct_message', function(bot, message) {
    bot.reply(message,'Hello yourself!');
});
```

[Review the documentation](https://botkit.ai/docs/) to learn how to configure Botkit's controller to work with the messaging platform of your choice.

# Build Your Bot

The goal of Botkit is to make it easier and more fun to build software that talks and works like a robot! Building a bot should feel cool, and not too technically complicated.

Botkit handles all the nitty gritty details like
API calls, session management and authentication,
allowing you to focus on building COOL FEATURES for your
bot using middleware and event handlers.

The toolkit is designed to provide meaningful building blocks for creating conversational user interfaces - with functions like `hears()`, `ask()`, and `reply()` that do what they say they do.

### Hearing Keywords

Most bots do their thing by listening for keywords, phrases or patterns in messages from users. Botkit has a special event handler called `hears()` that makes it easy to configure your bot to listen for this type of trigger.

```
controller.hears(['string','pattern .*',new RegExp('.*','i')],'message_received,other_event',function(bot, message) {

  // do something!
  bot.reply(message, 'I heard a message.')

});
```

[Read more about hearing things &rsaquo;](https://botkit.ai/docs/core.html#matching-patterns-and-keywords-with-hears)

### Responding to Events

Bots can respond to non-verbal events as well, like when a new user joins a channel, a file gets uploaded, or a button gets clicked. These events are handled using an event handling pattern that should look familiar. Most events in Botkit can be replied to like normal messages.

```
controller.on('channel_join', function(bot, message) {

  bot.reply(message,'Welcome to the channel!');

});
```

[See a full list of events and more information about handling them &rsaquo;](https://botkit.ai/docs/core.html#receiving-messages-and-events)

### Middleware

In addition to taking direct action in response to a certain message or type of event, Botkit can also take passive action on messages as they move through the application using middlewares. Middleware functions work by changing messages, adding new fields, firing alternate events, and modifying or overriding the behavior of Botkit's core features.

Middleware can be used to adjust how Botkit receives, processes, and sends messages. [Here is a list of available middleware endpoints](https://botkit.ai/docs/readme-pipeline.html).

```
// Log every message recieved
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

# Full Documentation

* [Get Started](https://botkit.ai/getstarted.html)
* [Introduction](https://botkit.ai/docs/)
* [Core Features](https://botkit.ai/docs/core.html)
* [Botkit Studio API](https://botkit.ai/docs/readme-studio.html)
* Platforms
  * [Web and Apps](https://botkit.ai/docs/readme-web.html)
  * [Slack](https://botkit.ai/docs/readme-slack.html)
  * [Cisco Spark](https://botkit.ai/docs/readme-ciscospark.html)
  * [Cisco Jabber](https://botkit.ai/docs/readme-ciscojabber.html)
  * [Microsoft Teams](https://botkit.ai/docs/readme-teams.html)
  * [Facebook Messenger](https://botkit.ai/docs/readme-facebook.html)
  * [Twilio SMS](https://botkit.ai/docs/readme-twiliosms.html)
  * [Twilio IPM](https://botkit.ai/docs/readme-twilioipm.html)
  * [Microsoft Bot Framework](https://botkit.ai/docs/readme-botframework.html)
* [Extending Botkit with Plugins and Middleware](https://botkit.ai/docs/middleware.html)
  * [Message Pipeline](https://botkit.ai/docs/readme-pipeline.html)
  * [List of current plugins](https://botkit.ai/docs/readme-middlewares.html)
* [Storing Information](https://botkit.ai/docs/storage.html)
* [Logging](https://botkit.ai/docs/logging.html)
* Contributing to Botkit
  * [Contributing to Botkit Core](CONTRIBUTING.md)
  * [Building Middleware/plugins](docs/howto/build_middleware.md)
  * [Building platform connectors](docs/howto/build_connector.md)


# Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 6500 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

We also host a [regular meetup and annual conference called TALKABOT.](https://talkabot.ai)
Come meet and learn from other bot developers! [Full video of our 2016 event is available on Youtube.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)

# About Botkit

Botkit is a product of [Howdy.ai](https://howdy.ai).

Want to contribute? [Read the contributor guide](CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](LICENSE.md)
