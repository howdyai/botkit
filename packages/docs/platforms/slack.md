[&larr; Botkit Documentation](..)  [&larr; Platform Index](index.md) 

# botbuilder-adapter-slack

Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Slack.

This package contains an adapter that communicates directly with the Slack API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Slack.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-slack
```

Import the adapter class into your code:

```javascript
const { SlackAdapter } = require('botbuilder-adapter-slack');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](https://botkit.ai/getstarted.html)

## Use SlackAdapter in your App

SlackAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Slack and have access to the Slack's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Slack.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../index.md).

[A full description of the SlackAdapter options and example code can be found in the class reference docs.](../reference/slack.md#create-a-new-slackadapter)

```javascript
const adapter = new SlackAdapter({
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

Alternately, developers may choose to use `SlackAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const adapter = new SlackAdapter({
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

* [SlackAdapter](../reference/slack.md#slackadapter)
* [BotWorker Extensions](../reference/slack.md#slackbotworker)
* [SlackMessageTypeMiddleware](../reference/slack.md#slackmessagetypemiddleware)
* [SlackEventMiddleware](../reference/slack.md#slackeventmiddleware)


## Event List

Botkit will emit the following events: 

| Event | Description
|--- |---
| message | a message from a user received in a shared channel

The slack adapter includes an optional middleware that will modify the type of incoming events to match their Slack event types (rather than being cast into generic "message or "event" types).

Import the adapter and the middlewares:

```javascript
// load SlackAdapter AND SlackEventMiddleware
const { SlackAdapter, SlackEventMiddleware, SlackMessageTypeMiddleware } = require('botbuilder-adapter-slack');
```

Create your adapter (as above), then bind the middlewares to the adapter:

```javascript
adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());
```

Now, Botkit will emit events with their original Slack names:

```
controller.on('channel_join', async(bot, message) => {
    // do stuff
});
```

## Calling Slack APIs

This package exposes a pre-configured [Slack API client](https://slack.dev/node-slack-sdk/web-api) for developers who want to use one of the many available API endpoints.

In Botkit handlers, the `bot` worker object passed into all handlers will contain a `bot.api` field that contains the client, preconfigured and ready to use.

```javascript
controller.on('message', async(bot, message) {

    // load a user profile
    let profile = await bot.api.users.info({user: message.user});

});
```

## Botkit Extensions

In Botkit handlers, the `bot` worker for Slack contains [all of the base methods](../reference/core.md#BotWorker) as well as the following platform-specific extensions:

### getInstallLink()

### validateOauthCode()

### Use attachments, blocks, and other rich message features

Botkit will automatically construct your outgoing messages according to Slack's specifications. To use attachments, blocks or other features, add them to the message object used to create the reply:

```javascript
await bot.reply(message, {
    blocks: MY_BLOCKS_ARRAY
});

controller.on('block_actions', async(bot, message) => {
    // handle block action
});
```

### [Spawn a worker for a specific team](../reference/slack.md#create-a-new-slackbotworker)

For a bot that works with multiple teams, it is possible to spawn bot workers bound to a specific team by passing the team ID as the primary parameter to `controller.spawn()`:

```javascript
let bot = await controller.spawn(SLACK_TEAM_ID);
```
### Start or resume conversations with people

Use these method to initiate a conversation with a user, or in a specific channel or thread. After calling these methods, any further actions carried out by the bot worker will happen in that context.

This can be used to create or resume conversations with users that are not in direct response to an incoming message, like those sent on a schedule or in response to external events.

* [bot.startPrivateConversation()](../reference/slack.md#startprivateconversation)
* [bot.startConversationInChannel()](../reference/slack.md#startconversationinchannel)
* [bot.startConversationInThread()](../reference/slack.md#startconversationinthread)

### Slash Commands

[Read Slack's documentation for Slash commands here &rarr;](https://api.slack.com/slash-commands)

* [bot.replyPublic()](../reference/slack.md#replypublic)
* [bot.replyPrivate()](../reference/slack.md#replyprivate)

```javascript
controller.on('slash_command', async(bot, message) => { 

    // the /<command> part
    let command = message.command;
    // the /command <parameters> part
    let parameter = message.text;

    await bot.replyPublic('My response to your command is: ...');

});
```

Note that if you would prefer to send a response to the Slash command via the synchronous http response back to Slack, you can achieve this by using [bot.httpBody()](../reference/core.md#httpbody).

```javascript
controller.on('slash_command', async(bot, message) => { 
    bot.httpBody({text:'You can send an immediate response using bot.httpBody()'});
});
```


### Working with threads

* bot.replyInThread()

### Ephemeral Messages

* bot.replyEphemeral()

### Interactive messages

* bot.replyInteractive()

### Work with Slack Dialogs

* bot.replyWithDialog()
* bot.dialogError()

### Delete and update Messages

* bot.updateMessage()
* bot.deleteMessage()

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