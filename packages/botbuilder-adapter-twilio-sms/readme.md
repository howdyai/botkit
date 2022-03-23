# botbuilder-adapter-twilio-sms

Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Twilio SMS.

This package contains an adapter that communicates directly with the Twilio API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Twilio SMS.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-twilio-sms
```

Import the adapter class into your code:

```javascript
const { TwilioAdapter } = require('botbuilder-adapter-twilio-sms');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](../docs/index.md)

## Use TwilioAdapter in your App

TwilioAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Twilio SMS and have access to the Twilio API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Twilio.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

[A full description of the TwilioAdapter options and example code can be found in the class reference docs.](../docs/reference/twilio-sms.md#create-a-new-twilioadapter)

```javascript
const adapter = new TwilioAdapter({
    twilio_number: process.env.TWILIO_NUMBER,
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
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

Alternately, developers may choose to use `TwilioAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const adapter = new TwilioAdapter({
    twilio_number: process.env.TWILIO_NUMBER,
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
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

* [TwilioAdapter](../docs/reference/twilio-sms.md#twilioadapter)
* [BotWorker Extensions](../docs/reference/twilio-sms.md#twiliobotworker)

## Event List

Botkit will emit the following events: 

| Event | Description
|--- |---
| message | a message from a user
| picture_message | a message with a picture attached

## Calling Twilio APIs

This package exposes a pre-configured [Twilio API client](https://www.twilio.com/docs/libraries/node) for developers who want to use one of the many available API endpoints.

In Botkit handlers, the `bot` worker object passed into all handlers will contain a `bot.api` field that contains the client, preconfigured and ready to use.


```javascript
controller.on('message', async(bot, message) {

    // create a message using the API directly
    let res = await bot.api.messages.create(my_message_object);

});
```

## Botkit Extensions

In Botkit handlers, the `bot` worker for Twilio contains [all of the base methods](../docs/reference/core.md#BotWorker) as well as the following platform-specific extensions:

### [bot.startConversationWithUser()](../docs/reference/twilio-sms.md#startconversationwithuser)

Use this method to initiate a conversation with a user. After calling this method, any further actions carried out by the bot worker will happen with the specified user.

This can be used to create or resume conversations with users that are not in direct response to an incoming message, like those sent on a schedule or in response to external events.

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
