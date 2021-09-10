[&larr; Botkit Documentation](../core.md)  [&larr; Platform Index](index.md) 

# botbuilder-adapter-webex
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Webex Teams.

This package contains an adapter that communicates directly with the Webex Teams API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Webex Teams.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-webex
```

Import the adapter class into your code:

```javascript
const { WebexAdapter } = require('botbuilder-adapter-webex');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](../index.md)

## Use WebexAdapter in your App

WebexAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Webex Teams and have access to Webex's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Webex.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../index.md).

[A full description of the WebexAdapter options and example code can be found in the class reference docs.](../reference/webex.md#create-a-new-webexadapter)

```javascript
const adapter = new WebexAdapter({
    access_token: process.env.ACCESS_TOKEN,
    public_address: process.env.PUBLIC_ADDRESS,
    secret: process.env.SECRET 
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

Alternately, developers may choose to use `WebexAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const adapter = new WebexAdapter({
    access_token: process.env.ACCESS_TOKEN,
    public_address: process.env.PUBLIC_ADDRESS,
    secret: process.env.SECRET 
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

* [WebexAdapter](../reference/webex.md#webexadapter)
* [BotWorker Extensions](../reference/webex.md#webexbotworker)

## Event List

All events [listed here](https://developer.webex.com/webhooks-explained.html#resources-events) should be expected, in the format `resource`.`event` - for example, `rooms.created`.  

| Event | Description
|--- |---
| message |
| self_message | 


## Calling Webex APIs

This package exposes a pre-configured [Webex API client](https://www.npmjs.com/package/webex) for developers who want to use one of the many available API endpoints.

In Botkit handlers, the `bot` worker object passed into all handlers will contain a `bot.api` field that contains the client, preconfigured and ready to use.

```javascript
controller.on('message', async(bot, message) {

    // get a list of the members of a room
    let members = await bot.api.memberships.get(message.channel);
    // .. do stuff
});
```

## Botkit Extensions
In Botkit handlers, the `bot` worker for Webex contains [all of the base methods](../reference/core.md#BotWorker) as well as the following platform-specific extensions:

### [bot.startConversationInRoom()](../reference/webex.md#startconversationinroom)

Use this method to initiate a conversation with a user in a given, known room.  After calling this method, any further actions carried out by the bot worker will happen in that context.

This can be used to create or resume conversations with users that are not in direct response to an incoming message, like those sent on a schedule or in response to external events.

### [bot.startPrivateConversation()](../reference/webex.md#startprivateconversation)

Use this method to initiate a private 1:1 conversation with a user.

Calling this method will create or switch to the private 1:1 room for any messages sent with `bot.say`. However, due to a quirk in the Webex protocol, multi-message dialogs started with `beginDialog` will not work.

### Remove messages

Webex Teams supports deleting messages. Do so with the following convenience method:

* [bot.deleteMessage](../reference/webex.md#deletemessage)

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](https://github.com/howdyai/botkit/blob/master/LICENSE.md)

