# botbuilder-adapter-mattermost

Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Mattermost.

This package contains an adapter that communicates directly with the Mattermost API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Mattermost.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-mattermost
```

Import the adapter class into your code:

```javascript
const { MattermostAdapter } = require('botbuilder-adapter-mattermost');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](https://botkit.ai/getstarted.html)

## Use MattermostAdapter in your App

MattermostAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Mattermost and have access to the Mattermost's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically
connect to Mattermost's WebSocket API in order to receive messages and events.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

[A full description of the MattermostAdapter options and example code can be found in the class reference docs.](../docs/reference/mattermost.md#create-a-new-mattermostadapter)

```javascript
const adapter = new MattermostAdapter({
    host: process.env.MATTERMOST_HOST,
    port: process.env.MATTERMOST_PORT,
    botToken: process.env.MATTERMOST_TOKEN
});

const controller = new Botkit({
    adapter,
    // ...other options
});

controller.on('message', async(bot, message) => {
    await bot.reply(message, 'I heard a message!');
});
```

### BotBuilder Basics

Alternately, developers may choose to use `MattermostAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const adapter = new MattermostAdapter({
    host: process.env.MATTERMOST_HOST,
    port: process.env.MATTERMOST_PORT,
    botToken: process.env.MATTERMOST_TOKEN
});
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
adapter.connectMattermost(async(context) => {
 // handle turn here
});
```

## Class Reference

* [MattermostAdapter](../docs/reference/mattermost.md#mattermostadapter)

## Event List

Botkit will emit the following events: 

| Event | Description
|--- |---
| message | a message from a user received in a shared channel

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Mattermost group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](https://github.com/howdyai/botkit/blob/master/LICENSE.md)
