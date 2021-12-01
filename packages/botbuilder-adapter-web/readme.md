# botbuilder-adapter-web
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to the Web.

This package contains an adapter that communicates directly with the web via webhooks or websocket connections.
This package can be used alongside your favorite bot development framework to build bots that work on a website or within an existing app.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-web
```

Import the adapter class into your code:

```javascript
const { WebAdapter } = require('botbuilder-adapter-web');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](../docs/index.md)

## Use WebAdapter in your App

WebAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect directly to users on the web.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with the web.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

[A full description of the WebAdapter options and example code can be found in the class reference docs.](../docs/reference/web.md#create-a-new-webadapter)

```javascript
const adapter = new WebAdapter();
const controller = new Botkit({
    adapter,
    // ...other options
});

// TODO: expose chat client

controller.on('message', async(bot, message) => {
    await bot.reply(message, 'I heard a message!');
});
```

### BotBuilder Basics

Alternately, developers may choose to use `WebAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

[Read more &rarr;](../docs/reference/web.md#create-a-new-webadapter)

## Class Reference

* [WebAdapter](../docs/reference/web.md#webadapter)

## Reference Chat Client

This package includes [a reference implementation of a chat client written in HTML/JS/CSS](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-web/client/#readme) that serves as a base for building a customized chat widget.

> [Using typing indicators with the reference chat client](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-web/client/#typing-indicators)

## Event List

| Event | Description
|--- |---
| message | a message sent by the user
| hello | event sent when a user first connects
| welcome_back | event sent when a user reconnects
| identify | an extended user profile is being sent by the client to be associated with the user id

## Botkit Extensions

In Botkit handlers, the `bot` worker for web contains [all of the base methods](../docs/reference/core.md) as well as the following platform-specific extensions:

### [adapter.createSocketServer()](../docs/reference/web.md#createsocketserver)

Configures the webserver to accept websocket connections. This method is called automatically by Botkit, but must be manually called when using with BotBuilder.

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
