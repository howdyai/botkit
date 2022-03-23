[&larr; Botkit Documentation](../core.md)  [&larr; Platform Index](index.md) 

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

If you are starting a brand new project, [follow these instructions to create a customized application template.](../index.md)

## Use SlackAdapter in your App

SlackAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Slack and have access to the Slack's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Slack.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../index.md).

[A full description of the SlackAdapter options and example code can be found in the class reference docs.](../reference/slack.md#create-a-new-slackadapter)

```javascript
const adapter = new SlackAdapter({
    clientSigningSecret: process.env.SLACK_SECRET,
    botToken: process.env.SLACK_TOKEN
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
    clientSigningSecret: process.env.SLACK_SECRET,
    botToken: process.env.SLACK_TOKEN
});

const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         await context.sendActivity('I heard a message!');
     });
});
```

### Important URLs

Your bot application will present several important URLs. You'll need to configure your Slack application profile with these urls.

The messaging endpoint, which receives all events from Slack is: `https://YOURBOT/api/messages`

The default "install" URL that triggers the oauth flow for multi-team installation is `https://YOURBOT/install`

The oauth callback URL (or "redirect uri") that should be added to your Slack application profile is `https://YOURBOT/install/auth`

### Multi-team Support

In the examples above, the `SlackAdapter` constructor received a single `botToken` parameters. This binds the adapter and all API calls it makes to a single Slack workspace.

To use `SlackAdapter` with multiple Slack workspaces, the constructor must receive a a different set of parameters. These parameters allow the adapter to be configured to work as an oauth client application of Slack's API, and will expose an "install link" used to add the application to each Slack workspace.

In additionto fields related to oauth, the constructor must also receive 2 functions:

* a parameter named `getTokenForTeam` that is responsible for returning a token value when provided a Slack workspace ID.
* a parameter named `getBotUserByTeam` that is responsible for returning a bot's user id value when provided a Slack workspace ID.

The application must implement its own mechanism for securely storing and retrieving these values.

```javascript
const adapter = new SlackAdapter({
    clientSigningSecret: process.env.SLACK_SECRET,
    clientId: process.env.CLIENT_ID, // oauth client id
    clientSecret: process.env.CLIENT_SECRET, // oauth client secret
    scopes: ['bot'], // oauth scopes requested, 'bot' deprecated by Slack in favor of granular permissions
    redirectUri: process.env.REDIRECT_URI, // url to redirect post-login
    oauthVersion: 'v1', // or use v2
    getTokenForTeam: async(team_id) => {
        // load the token for this team
        // as captured during oauth 
    }, 
    getBotUserByTeam: async(team_id) = {
        // load bot user id for this team   
        // as captured during oauth 
    }
});

// Create a route for the install link.
// This will redirect the user to Slack's permission request page.
controller.webserver.get('/install', (req, res) => {
    res.redirect(adapter.getInstallLink());
});

// Create a route to capture the results of the oauth flow.
// this URL should match the value of the `redirectUri` passed to Botkit.
controller.webserver.get('/install/auth', (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        // Store token by team in bot state.
        let team = results.team_id; // results.team.id in oauth v2
        let token = results.bot.bot_access_token; // results.access_token in oauth v2
        let userId = results.bot.bot_user_id; // results.bot_user_id in oauth v2

        // Securely store the token and usedId so that they can be retrieved later by the team id.
        // ...

        // customize your post-install success page
        res.send('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        // customize your post-install failure page
        res.status(401);
        res.send(err.message);
    }
});
```

### Using Slack's v2 OAuth

To use Slack's [newer "granular scopes"](https://api.slack.com/authentication/oauth-v2), specify `oauthVersion: 'v2'` in your adapter configuration.
This will cause the adapter to use the v2 oauth URL and credential validation function.
However, note that the payload returned `validateOauthCode` differs between versions.

In v1, your bot's token will be located at `results.bot.bot_access_token`, whereas in v2, it will be `results.access_token`.

In v1, your bot's user id will be at `results.bot.bot_user_id`, whereas in v2 it will be `results.bot_user_id`.

From Slack's official docs:

* [V1 response payload](https://api.slack.com/methods/oauth.access#response)
* [V2 response payload](https://api.slack.com/methods/oauth.v2.access#response)

Take care to update your auth handler function when you migrate to granular scopes.

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
| event | all other events from Slack (unless middlewares enabled, see below)

This package includea a set of optional middleware that will modify the type of incoming events to match their Slack event types (rather than being cast into generic "message or "event" types).

Most Botkit developers who plan to use features above and beyond the basic send/receive API should enable these middleware.

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

### [controller.getInstallLink()](../reference/slack.md#getinstalllink)

Returns the first step of an oauth-flow that results in the Botkit application being enabled on a workspace.
Use this in concert with [multi-team support](#multi-team-support).

### [controller.validateOauthCode()](../reference/slack.md#validateoauthcode)

This method receives the oauth code returned by Slack at the end of the oauth-flow and returns all of the credentials and authentication details associated with it.  Use this to capture the workspace token and bot user ID needed for multi-team support.

### Use attachments, blocks, and other rich message features

Botkit will automatically construct your outgoing messages according to Slack's specifications. To use attachments, blocks or other features, add them to the message object used to create the reply.

**Use Block Kit Blocks**

The preferred way of composing interactive messages is using Slack's Block Kit.  [Read the official Slack documentation here](https://api.slack.com/messaging/composing/layouts). Slack provides a UI to help create your interactive messages. Check out [Block Kit Builder](https://api.slack.com/tools/block-kit-builder).

Additionally, there are open-source libraries available that assist with building out UIs for Slack:

* [**Block Builder**](https://github.com/raycharius/slack-block-builder) – Zero-dependency library, with a SwiftUI-like builder syntax.
* [**JSX-Slack**](https://github.com/speee/jsx-slack) – JSX that transpiles to Slack API-compatible JSON.

Interactive messages using blocks can be sent via any of Botkit's built in functions by passing in the appropriate "blocks" as part of the message.  Here is an example:

```javascript
const content = {
    blocks: [{...}]; // insert valid JSON following Block Kit specs
};

await bot.reply(message, content);
```

**Use "Secondary" Attachments**

Attachments are still supported by Slack, but the preferred way is to use Block Kit. [Read the official Slack documentation here](https://api.slack.com/reference/messaging/attachments)


### [Spawn a worker](../reference/slack.md#create-a-new-slackbotworker)

It is possible to spawn bot workers bound to a specific team by passing the team ID as the primary parameter to `controller.spawn()`:

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

Slash commands are special commands triggered by typing a "/" then a command. They are configured inside Slack's API portal.

[Read Slack's documentation for Slash commands here &rarr;](https://api.slack.com/slash-commands)

When a Botkit application receives a request from a slash command, it will emit a `slash_command` event that can be handled using `controller.on()`.  Several additional reply methods have been provided to handle slash commands.

* [bot.replyPublic()](../reference/slack.md#replypublic)
* [bot.replyPrivate()](../reference/slack.md#replyprivate)

```javascript
controller.on('slash_command', async(bot, message) => { 

    // the /<command> part
    let command = message.command;
    // the /command <parameters> part
    let parameter = message.text;

    await bot.replyPublic(message, 'My response to your command is: ...');

});
```

Note that if you would prefer to send a response to the Slash command via the synchronous http response back to Slack, you can achieve this by using [bot.httpBody()](../reference/core.md#httpbody).

```javascript
controller.on('slash_command', async(bot, message) => {
    bot.httpBody({text:'You can send an immediate response using bot.httpBody()'});
});
```

### Work with threads

Messages in Slack may now exist as part of a thread, separate from the messages included in the main channel. Threads can be used to create new and interesting interactions for bots.

Botkit's default behavior is for replies to be sent in-context. That is, if a bot replies to a message in a main channel, the reply will be added to the main channel. If a bot replies to a message in a thread, the reply will be added to the thread. This behavior can be changed by using one of the following specialized functions:

* [bot.replyInThread()](../reference/slack.md#replyinthread)
* [bot.startConversationInThread()](../reference/slack.md#startconversationinthread)

### Ephemeral Messages

Messages can be sent to a user "ephemerally" which will only show to them, and no one else. [Learn more about ephemeral messages at the Slack API Documentation.](https://api.slack.com/methods/chat.postEphemeral)

* [bot.replyEphemeral()](../reference/slack.md#replyephemeral)

### Interactive messages

Slack applications can use "interactive messages" to include buttons, menus and other interactive elements to improve the user's experience. [See here for how to attach cards and blocks.](#use-attachments-blocks-and-other-rich-message-features)

If your interactive message contains a button, when the user clicks the button in Slack, Botkit triggers an event based on the message type.

When an event is received, your bot can either reply normally, or use the special `bot.replyInteractive` function which will result in the original message in Slack being _replaced_ by the reply. Using `replyInteractive`, bots can present dynamic interfaces inside a single message.

To receive callbacks, register a callback url as part of applications configuration. Botkit's built in support for the Slack Button system supports interactive message callbacks at same url as other events (`/api/messages` by default). 

* [bot.replyInteractive()](../reference/slack.md#replyinteractive)

### Work with Slack Dialogs

[Dialogs](https://api.slack.com/dialogs) allow bots to present multi-field pop-up forms in response to a button click or other interactive message interaction.
Botkit provides helper functions and special events to make using dialogs in your app possible.

Dialogs can be created in response to `interactive_message` or `slash_command` events.
Botkit provides a specialized reply function, `bot.replyWithDialog()` and a object builder class,
`SlackDialog` that should be used to create and send the dialog.

* [bot.replyWithDialog()](../reference/slack.md#replywithdialog)
* [bot.dialogError()](../reference/slack.md#dialogerror)
* [SlackDialog](../reference/slack.md#slackdialog)

### Update and remove messages

Slack supports updating and deleting messages. Do so with the following convenience methods:

* [bot.updateMessage()](../reference/slack.md#updatemessage)
* [bot.deleteMessage()](../reference/slack.md#deletemessage)

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

