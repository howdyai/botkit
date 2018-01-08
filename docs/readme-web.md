# Botkit for the Web

Table of Contents

## What is this?

Botkit includes a built-in chat server that can send and receive messages using real-time websocket connections,
or asynchronous webhooks. This allows Botkit bots to live on the web, or be embedded into websites and native mobile apps.

Botkit's built-in chat server does not require any third party services to work - messages are sent and received directly by your own app!

## Getting Started

To use Botkit for the Web, grab the starter kit project. This includes all the pieces you'll need:

* Botkit and the built-in chat server
* A customizable chat client built with HTML, CSS, and vanilla Javascript
* A webserver for serving the application to users

### **Botkit Studio**

Botkit Studio is a dashboard and IDE designed to super-charge Botkit. It includes a web-based interface for building and managing dialog, an activity console, third party integrations, and advanced analytics tools like customer segmenting, conversion funnels, and user retention metrics.

Sign up for a free Botkit Studio account, and it will guide you through the process to create, configure and deploy your Botkit app!

**[![Sign up for Botkit Studio](../docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**

### Use the Botkit Command Line Tool

Set up a boilerplate Botkit application using our command line tool. Using the commands highlighted below, install the command line tool from npm, then use it automatically create and configure a customizable app.

```
npm install -g botkit
botkit new --platform web
```

### **Remix on Glitch**

Want to dive right in? [Remix one of our starter kits on Glitch](https://glitch.com/botkit). You'll start with a fully functioning app that you can edit and run from the browser!

 [![Remix on Glitch](../docs/glitch.png)](https://glitch.com/botkit)


## Developing with Botkit for Web

 The full code for a simple bot is below:

 ~~~ javascript
 var Botkit = require('botkit');

 var controller = Botkit.socketbot({});

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


## Working with Botkit for Web

### Message Objects

* Quick Replies
* Attachments

### Events

| Event | Description
|-- |--
| message_recieved | the bot has received a message
| hello | a new user has connected to the bot
| welcome_back | a returning user has established a new connection to the bot
| reconnect | an ongoing user session has experienced a disconnect/reconnect


### Functions

replyWithTyping




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
