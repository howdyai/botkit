# Botkit for Slack Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-slack](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-slack) package.

## Classes


* <a href="#SlackAdapter" aria-current="page">SlackAdapter</a>
* <a href="#SlackBotWorker" aria-current="page">SlackBotWorker</a>
* <a href="#SlackDialog" aria-current="page">SlackDialog</a>
* <a href="#SlackEventMiddleware" aria-current="page">SlackEventMiddleware</a>
* <a href="#SlackMessageTypeMiddleware" aria-current="page">SlackMessageTypeMiddleware</a>

## Interfaces

* <a href="#SlackAdapterOptions" aria-current="page">SlackAdapterOptions</a>

---

<a name="SlackAdapter"></a>
## SlackAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Slack.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-slack
```

Then import this and other classes into your code:
```javascript
const { SlackAdapter } = require('botbuilder-adapter-slack');
```

This class includes the following methods:
* [activityToSlack()](#activityToSlack)
* [continueConversation()](#continueConversation)
* [deleteActivity()](#deleteActivity)
* [getAPI()](#getAPI)
* [getBotUserByTeam()](#getBotUserByTeam)
* [getInstallLink()](#getInstallLink)
* [processActivity()](#processActivity)
* [sendActivities()](#sendActivities)
* [updateActivity()](#updateActivity)
* [validateOauthCode()](#validateOauthCode)



### Create a new SlackAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [SlackAdapterOptions](#SlackAdapterOptions) | An object containing API credentials, a webhook verification token and other options<br/>

Create a Slack adapter.

The SlackAdapter can be used in 2 modes:
     * As an "[internal integration](https://api.slack.com/internal-integrations) connected to a single Slack workspace
     * As a "[Slack app](https://api.slack.com/slack-apps) that uses oauth to connect to multiple workspaces and can be submitted to the Slack app.

[Read here for more information about all the ways to configure the SlackAdapter &rarr;](../../botbuilder-adapter-slack/readme.md).

Use with Botkit:
```javascript
const adapter = new SlackAdapter({
     clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
     botToken: process.env.BOT_TOKEN
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new SlackAdapter({
     clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
     botToken: process.env.BOT_TOKEN
});
// set up restify...
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         // do your bot logic here!
     });
});
```

Use in "Slack app" multi-team mode:
```javascript
const adapter = new SlackAdapter({
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    clientId: process.env.CLIENT_ID, // oauth client id
    clientSecret: process.env.CLIENT_SECRET, // oauth client secret
    scopes: ['bot'], // oauth scopes requested
    oauthVersion: 'v1',
    redirectUri: process.env.REDIRECT_URI, // url to redirect post login defaults to `https://<mydomain>/install/auth`
    getTokenForTeam: async(team_id) => Promise<string>, // function that returns a token based on team id
    getBotUserByTeam: async(team_id) => Promise<string>, // function that returns a bot's user id based on team id
});
```




## SlackAdapter Class Methods
<a name="activityToSlack"></a>
### activityToSlack()
Formats a BotBuilder activity into an outgoing Slack message.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | A BotBuilder Activity object


**Returns**

a Slack message object with {text, attachments, channel, thread_ts} as well as any fields found in activity.channelData




<a name="continueConversation"></a>
### continueConversation()
Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)

**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | A conversation reference to be applied to future messages.
| logic|  | A bot logic function that will perform continuing action in the form `async(context) => { ... }`<br/>



<a name="deleteActivity"></a>
### deleteActivity()
Standard BotBuilder adapter method to delete a previous message.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| reference| Partial&lt;ConversationReference&gt; | An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`<br/>



<a name="getAPI"></a>
### getAPI()
Get a Slack API client with the correct credentials based on the team identified in the incoming activity.
This is used by many internal functions to get access to the Slack API, and is exposed as `bot.api` on any bot worker instances.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



<a name="getBotUserByTeam"></a>
### getBotUserByTeam()
Get the bot user id associated with the team on which an incoming activity originated. This is used internally by the SlackMessageTypeMiddleware to identify direct_mention and mention events.
In single-team mode, this will pull the information from the Slack API at launch.
In multi-team mode, this will use the `getBotUserByTeam` method passed to the constructor to pull the information from a developer-defined source.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



<a name="getInstallLink"></a>
### getInstallLink()
Get the oauth link for this bot, based on the clientId and scopes passed in to the constructor.

**Returns**

A url pointing to the first step in Slack&#x27;s oauth flow.




An example using Botkit's internal webserver to configure the /install route:

```javascript
controller.webserver.get('/install', (req, res) => {
 res.redirect(controller.adapter.getInstallLink());
});
```


<a name="processActivity"></a>
### processActivity()
Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.

**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | A request object from Restify or Express
| res| any | A response object from Restify or Express
| logic|  | A bot logic function in the form `async(context) => { ... }`<br/>



<a name="sendActivities"></a>
### sendActivities()
Standard BotBuilder adapter method to send a message from the bot to the messaging API.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| activities|  | An array of outgoing activities to be sent back to the messaging API.<br/>



<a name="updateActivity"></a>
### updateActivity()
Standard BotBuilder adapter method to update a previous message with new content.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| activity| Partial&lt;Activity&gt; | The updated activity in the form `{id: <id of activity to update>, ...}`<br/>



<a name="validateOauthCode"></a>
### validateOauthCode()
Validates an oauth v2 code sent by Slack during the install process.

**Parameters**

| Argument | Type | description
|--- |--- |---
| code| string | the value found in `req.query.code` as part of Slack's response to the oauth flow.<br/>



An example using Botkit's internal webserver to configure the /install/auth route:

```javascript
controller.webserver.get('/install/auth', async (req, res) => {
     try {
         const results = await controller.adapter.validateOauthCode(req.query.code);
         // make sure to capture the token and bot user id by team id...
         const team_id = results.team.id;
         const token = results.access_token;
         const bot_user = results.bot_user_id;
         // store these values in a way they'll be retrievable with getBotUserByTeam and getTokenForTeam
     } catch (err) {
          console.error('OAUTH ERROR:', err);
          res.status(401);
          res.send(err.message);
     }
});
```


<a name="SlackBotWorker"></a>
## SlackBotWorker
This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Slack.
It includes all functionality from the base class, as well as the extension methods below.

When using the SlackAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-slack
```

Then import this and other classes into your code:
```javascript
const { SlackBotWorker } = require('botbuilder-adapter-slack');
```

This class includes the following methods:
* [deleteMessage()](#deleteMessage)
* [dialogError()](#dialogError)
* [replyEphemeral()](#replyEphemeral)
* [replyInThread()](#replyInThread)
* [replyInteractive()](#replyInteractive)
* [replyPrivate()](#replyPrivate)
* [replyPublic()](#replyPublic)
* [replyWithDialog()](#replyWithDialog)
* [startConversationInChannel()](#startConversationInChannel)
* [startConversationInThread()](#startConversationInThread)
* [startPrivateConversation()](#startPrivateConversation)
* [updateMessage()](#updateMessage)



### Create a new SlackBotWorker()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | Botkit | The Botkit controller object responsible for spawning this bot worker
| config | any | Normally, a DialogContext object.  Can also be the id of a team.<br/>

Reserved for use internally by Botkit's `controller.spawn()`, this class is used to create a BotWorker instance that can send messages, replies, and make other API calls.

It is possible to spawn a bot instance by passing in the Slack workspace ID of a team that has installed the app.
Use this in concert with [startPrivateConversation()](#startPrivateConversation) and [changeContext()](core.md#changecontext) to start conversations
or send proactive alerts to users on a schedule or in response to external events.


```javascript
// spawn a bot for a given team.
let bot = await controller.spawn('T0123456');

// start a 1:1 with a specific user
await bot.startPrivateConversation('U0123456');

// send a message
await bot.say('Hi user');
```



## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| api | WebClient | A copy of hte Slack WebClient giving, giving access to all of Slack's APIs via `let res = await bot.api.object.method(params);`

## SlackBotWorker Class Methods
<a name="deleteMessage"></a>
### deleteMessage()
Delete an existing message.

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object in the form of `{id: <id of message to delete>, conversation: { id: <channel of message> }}`<br/>



```javascript
// send a reply, capture the results
let sent = await bot.reply(message,'this is my original reply...');

// delete the sent message using the sent.id field
await bot.deleteMessage(sent);
```


<a name="dialogError"></a>
### dialogError()
Return 1 or more error to a `dialog_submission` event that will be displayed as form validation errors.
Each error must be mapped to the name of an input in the dialog.

**Parameters**

| Argument | Type | description
|--- |--- |---
| errors|  | 1 or more objects in form {name: string, error: string}<br/>



<a name="replyEphemeral"></a>
### replyEphemeral()
Like bot.reply, but sent as an "ephemeral" message meaning only the recipient can see it.
Uses [chat.postEphemeral](https://api.slack.com/methods/chat.postEphemeral)

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object
| resp| any | an outgoing message object (or part of one or just reply text)<br/>



<a name="replyInThread"></a>
### replyInThread()
Like bot.reply, but as a threaded response to the incoming message rather than a new message in the main channel.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object
| resp| any | an outgoing message object (or part of one or just reply text)<br/>



<a name="replyInteractive"></a>
### replyInteractive()
Like bot.reply, but used to respond to an `interactive_message` event and cause the original message to be replaced with a new one.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object of type `interactive_message`
| resp| any | a new or modified message that will replace the original one<br/>



<a name="replyPrivate"></a>
### replyPrivate()
Like bot.reply, but used to send an immediate private reply to a /slash command.
The message in `resp` will be displayed only to the person who executed the slash command.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object of type `slash_command`
| resp| any | an outgoing message object (or part of one or just reply text)<br/>



<a name="replyPublic"></a>
### replyPublic()
Like bot.reply, but used to send an immediate public reply to a /slash command.
The message in `resp` will be displayed to everyone in the channel.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object of type `slash_command`
| resp| any | an outgoing message object (or part of one or just reply text)<br/>



<a name="replyWithDialog"></a>
### replyWithDialog()
Reply to a button click with a request to open a dialog.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming `interactive_callback` event containing a `trigger_id` field
| dialog_obj| Dialog | A dialog, as created using [SlackDialog](#SlackDialog) or [authored to this spec](https://api.slack.com/dialogs).<br/>



<a name="startConversationInChannel"></a>
### startConversationInChannel()
Switch a bot's context into a different channel.
After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| channelId| string | A Slack channel id, like one found in `message.channel`
| userId| string | A Slack user id, like one found in `message.user` or in a `<@mention>`<br/>



```javascript
controller.hears('dm me', 'message', async(bot, message) => {

     // switch to the channel specified in SLACK_CHANNEL_ID
     // if just using bot.say and not starting a dialog, can use a fake value for user id.
     await bot.startConversationInChannel(SLACK_CHANNEL_ID, message.user);

     // say hello
     await bot.say('Shall we discuss this matter over here?');
     // ... continue...
     await bot.beginDialog(ANOTHER_DIALOG);

});
```

<a name="startConversationInThread"></a>
### startConversationInThread()
Switch a bot's context into a specific sub-thread within a channel.
After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| channelId| string | A Slack channel id, like one found in `message.channel`
| userId| string | A Slack user id, like one found in `message.user` or in a `<@mention>`
| thread_ts| string | A thread_ts value found in the `message.thread_ts` or `message.ts` field.<br/>



```javascript
controller.hears('in a thread', 'message', async(bot, message) => {

     // branch from the main channel into a side thread associated with this message
     await bot.startConversationInThread(message.channel, message.user, message.ts);

     // say hello
     await bot.say(`Let's handle this offline...`);
     // ... continue...
     await bot.beginDialog(OFFLINE_DIALOG);

});
```

<a name="startPrivateConversation"></a>
### startPrivateConversation()
Switch a bot's context to a 1:1 private message channel with a specific user.
After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| string | A Slack user id, like one found in `message.user` or in a `<@mention>`<br/>



```javascript
controller.hears('dm me', 'message', async(bot, message) => {

     // switch to a 1:1 conversation in a DM
     await bot.startPrivateConversation(message.user);

     // say hello
     await bot.say('We are in private now...');
     await bot.beginDialog(MY_PRIVATE_DIALOG);

});
```

Also useful when sending pro-active messages such as those sent on a schedule or in response to external events:
```javascript
// Spawn a worker with a Slack team id.
let bot = await controller.spawn(SLACK_TEAM_ID);

// Set the context for the bot's next action...
await bot.startPrivateConversation(SLACK_ADMIN_USER);

// Begin a dialog in the 1:1 context
await bot.beginDialog(ALERT_DIALOG);
```


<a name="updateMessage"></a>
### updateMessage()
Update an existing message with new content.

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object in the form `{id: <id of message to update>, conversation: { id: <channel> }, text: <new text>, card: <array of card objects>}`<br/>



```javascript
// send a reply, capture the results
let sent = await bot.reply(message,'this is my original reply...');

// update the sent message using the sent.id field
await bot.updateMessage({
     text: 'this is an update!',
     ...sent
})
```



<a name="SlackDialog"></a>
## SlackDialog
Create a Slack Dialog object for use with [replyWithDialog()](#replyWithDialog).

```javascript
let dialog = new SlackDialog('My Dialog', 'callback_123', 'Save');
dialog.addText('Your full name', 'name').addEmail('Your email', 'email');
dialog.notifyOnCancel(true);
bot.replyWithDialog(message, dialog.asObject());
```



To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-slack
```

Then import this and other classes into your code:
```javascript
const { SlackDialog } = require('botbuilder-adapter-slack');
```

This class includes the following methods:
* [addEmail()](#addEmail)
* [addNumber()](#addNumber)
* [addSelect()](#addSelect)
* [addTel()](#addTel)
* [addText()](#addText)
* [addTextarea()](#addTextarea)
* [addUrl()](#addUrl)
* [asObject()](#asObject)
* [asString()](#asString)
* [callback_id()](#callback_id)
* [notifyOnCancel()](#notifyOnCancel)
* [state()](#state)
* [submit_label()](#submit_label)
* [title()](#title)



### Create a new SlackDialog()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| title | string | Title of dialog
| callback_id | string | Callback id of dialog
| submit_label | string | Label for the submit button
| elements | any | An array of dialog elements<br/>

Create a new dialog object



## SlackDialog Class Methods
<a name="addEmail"></a>
### addEmail()
Add an email input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value| string | 
| options (optional)| any | <br/>



<a name="addNumber"></a>
### addNumber()
Add a number input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value| string | 
| options (optional)| any | <br/>



<a name="addSelect"></a>
### addSelect()
Add a dropdown select input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value|  | 
| option_list|  | 
| options (optional)| any | <br/>



<a name="addTel"></a>
### addTel()
Add a telephone number input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value| string | 
| options (optional)| any | <br/>



<a name="addText"></a>
### addText()
Add a text input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label|  | 
| name| string | 
| value| string | 
| options|  | 
| subtype (optional)| string | <br/>



<a name="addTextarea"></a>
### addTextarea()
Add a text area input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value| string | 
| options| any | 
| subtype| string | <br/>



<a name="addUrl"></a>
### addUrl()
Add a URL input to the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| label| string | 
| name| string | 
| value| string | 
| options (optional)| any | <br/>



<a name="asObject"></a>
### asObject()
Get the dialog object for use with bot.replyWithDialog()


<a name="asString"></a>
### asString()
Get the dialog object as a JSON encoded string.


<a name="callback_id"></a>
### callback_id()
Set the dialog's callback_id

**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | Value for the callback_id<br/>



<a name="notifyOnCancel"></a>
### notifyOnCancel()
Set true to have Slack notify you with a `dialog_cancellation` event if a user cancels the dialog without submitting

**Parameters**

| Argument | Type | description
|--- |--- |---
| set| boolean | True or False<br/>



<a name="state"></a>
### state()
Set the dialog's state field

**Parameters**

| Argument | Type | description
|--- |--- |---
| v| any | value for state<br/>



<a name="submit_label"></a>
### submit_label()
Set the button text for the submit button on the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | Value for the button label<br/>



<a name="title"></a>
### title()
Set the title of the dialog

**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | Value for title<br/>




<a name="SlackEventMiddleware"></a>
## SlackEventMiddleware
A middleware for Botkit developers using the BotBuilder SlackAdapter class.
This middleware causes Botkit to emit message events by their `type` or `subtype` field rather than their default BotBuilder Activity type (limited to message or event).
This keeps the new Botkit behavior consistent withprevious versions, and provides helpful filtering on the many event types that Slack sends.
To use this, bind it to the adapter before creating the Botkit controller:
```javascript
const adapter = new SlackAdapter(options);
adapter.use(new SlackEventMiddleware());
const controller = new Botkit({
     adapter: adapter,
     // ...
});

// can bind directly to channel_join (which starts as a message with type message and subtype channel_join)
controller.on('channel_join', async(bot, message) => {
 // send a welcome
});
```


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-slack
```

Then import this and other classes into your code:
```javascript
const { SlackEventMiddleware } = require('botbuilder-adapter-slack');
```

This class includes the following methods:
* [onTurn()](#onTurn)





## SlackEventMiddleware Class Methods
<a name="onTurn"></a>
### onTurn()
Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| next|  | <br/>




<a name="SlackMessageTypeMiddleware"></a>
## SlackMessageTypeMiddleware
A middleware for Botkit developers using the BotBuilder SlackAdapter class.
This middleware causes Botkit to emit more specialized events for the different types of message that Slack might send.
Responsible for classifying messages:

     * `direct_message` events are messages received through 1:1 direct messages with the bot
     * `direct_mention` events are messages that start with a mention of the bot, i.e "@mybot hello there"
     * `mention` events are messages that include a mention of the bot, but not at the start, i.e "hello there @mybot"

In addition, messages from bots and changing them to `bot_message` events. All other types of message encountered remain `message` events.

To use this, bind it to the adapter before creating the Botkit controller:
```javascript
const adapter = new SlackAdapter(options);
adapter.use(new SlackMessageTypeMiddleware());
const controller = new Botkit({
     adapter: adapter,
     // ...
});
```


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-slack
```

Then import this and other classes into your code:
```javascript
const { SlackMessageTypeMiddleware } = require('botbuilder-adapter-slack');
```

This class includes the following methods:
* [onTurn()](#onTurn)





## SlackMessageTypeMiddleware Class Methods
<a name="onTurn"></a>
### onTurn()
Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| next|  | <br/>





<a name="SlackAdapterOptions"></a>
## Interface SlackAdapterOptions
This interface defines the options that can be passed into the SlackAdapter constructor function.

**Fields**

| Name | Type | Description
|--- |--- |---
| botToken | string | A token (provided by Slack) for a bot to work on a single workspace<br/>
| clientId | string | The oauth client id provided by Slack for multi-team apps<br/>
| clientSecret | string | The oauth client secret provided by Slack for multi-team apps<br/>
| clientSigningSecret | string | A token used to validate that incoming webhooks originated with Slack.<br/>
| enable_incomplete | boolean | Allow the adapter to startup without a complete configuration.<br/>This is risky as it may result in a non-functioning or insecure adapter.<br/>This should only be used when getting started.<br/>
| getBotUserByTeam |  | A method that receives a Slack team id and returns the bot user id associated with that team. Required for multi-team apps.<br/>
| getTokenForTeam |  | A method that receives a Slack team id and returns the bot token associated with that team. Required for multi-team apps.<br/>
| oauthVersion | string | Which version of Slack's oauth protocol to use, v1 or v2. Defaults to v1.<br/>
| redirectUri | string | The URL users will be redirected to after an oauth flow. In most cases, should be `https://<mydomain.com>/install/auth`<br/>
| scopes |  | A array of scope names that are being requested during the oauth process. Must match the scopes defined at api.slack.com<br/>
| verificationToken | string | Legacy method for validating the origin of incoming webhooks. Prefer `clientSigningSecret` instead.<br/>
