# Botkit Web Connector

The power of bots and conversational software can included in any website or app using Botkit's new web connector!

## What is this?

This connector provides a basic interface for Botkit to send and receive messages directly, rather than relying on a third party messaging service like Slack or Facebook messenger.
It includes a built-in chat server that can send and receive messages using real-time websocket connections or asynchronous webhooks.
This allows Botkit bots to live on the web, or be embedded into websites and native mobile apps.

The functionality provided in the connector is actually very simple, and requires integration with a webserver (to serve the application and host the chat server) and a front-end client (to provide a user interface and render messages). These components are provided in a separate project, [Botkit Anywhere](https://github.com/howdyai/botkit-starter-web).

## Getting Started

Everything you need to build your bot is included in [Botkit Anywhere](https://github.com/howdyai/botkit-starter-web),
a boilerplate application that includes all the components needed to operate your bot, as well as sample code and extra features.

* All the features of Botkit Core and Botkit Studio
* A built-in chat server that can handle thousands of simultaneous conversations
* A customizable front-end chat client built with HTML, CSS, and Javascript
* A webserver for serving the application to users and hosting your bot's business logic

**Most developers should start with the starter kit rather than make direct use of the Botkit core library.**

### Botkit Studio

Botkit Studio is a dashboard and IDE designed to super-charge Botkit. It includes a web-based interface for building and managing dialog, an activity console, third party integrations, and advanced analytics tools like customer segmenting, conversion funnels, and user retention metrics.

Sign up for a free Botkit Studio account, and it will guide you through the process to create, configure and deploy your Botkit app!

**[![Sign up for Botkit Studio](../docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**

### Use the Botkit Command Line Tool

Set up a boilerplate Botkit application using our command line tool. Using the commands highlighted below, install the command line tool from npm, then use it automatically create and configure a customizable app.

```
npm install -g botkit
botkit new --platform web
```

## Developing with Botkit for Web

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

openSocketServer()

replyWithTyping()


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
