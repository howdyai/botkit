# botbuilder-adapter-hangouts

Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Google Hangouts.

This package contains an adapter that communicates directly with the Google Hangouts API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Google Hangouts.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-hangouts
```

Import the adapter class into your code:

```javascript
const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](https://botkit.ai/getstarted.html)

## Use HangoutsAdapter in your App

HangoutsAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Google Hangouts and have access to the Google Hangouts's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Google.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

[A full description of the FacebookAdapter options and example code can be found in the class reference docs.](../docs/hangouts.md#create-a-new-hangoutsadapter)

```javascript
const adapter = new HangoutsAdapter({
    token: process.env.GOOGLE_TOKEN,
    google_auth_params: {
        credentials: process.env.GOOGLE_CREDS
    }
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

Alternately, developers may choose to use `HangoutsAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const adapter = new HangoutsAdapter({
    token: process.env.GOOGLE_TOKEN,
    google_auth_params: {
        credentials: process.env.GOOGLE_CREDS
    }
});

const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         await context.sendActivity('I heard a message!');
     });
});
```

## Class Reference

* [HangoutsAdapter](../docs/reference/hangouts.md#hangoutsadapter)
* [BotWorker Extensions](../docs/reference/hangouts.md#hangoutsbotworker)

## Event List

Botkit will emit the following events: 

| Event | Description
|--- |---
| message | a message from a user received in a shared channel
| card_clicked | a user clicked a button on a card attachment
| direct_message | a message from a user received in a private 1:1 with the bot
| bot_room_join | the bot joined a new room
| bot_dm_join | a new 1:1 with a user has been created
| bot_room_leave | the bot has been removed from a room
| bot_dm_leave | a 1:1 with a user has been closed

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](../../CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](LICENSE.md)