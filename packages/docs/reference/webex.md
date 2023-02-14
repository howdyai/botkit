# Botkit for Webex Teams Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-webex](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-webex) package.

## Classes


* <a href="#WebexAdapter" aria-current="page">WebexAdapter</a>
* <a href="#WebexBotWorker" aria-current="page">WebexBotWorker</a>

## Interfaces

* <a href="#WebexAdapterOptions" aria-current="page">WebexAdapterOptions</a>

---

<a name="WebexAdapter"></a>
## WebexAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Webex Teams.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-webex
```

Then import this and other classes into your code:
```javascript
const { WebexAdapter } = require('botbuilder-adapter-webex');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [deleteActivity()](#deleteActivity)
* [getIdentity()](#getIdentity)
* [init()](#init)
* [processActivity()](#processActivity)
* [registerAdaptiveCardWebhookSubscription()](#registerAdaptiveCardWebhookSubscription)
* [registerWebhookSubscription()](#registerWebhookSubscription)
* [resetWebhookSubscriptions()](#resetWebhookSubscriptions)
* [sendActivities()](#sendActivities)



### Create a new WebexAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | [WebexAdapterOptions](#WebexAdapterOptions) | 

Create a Webex adapter. See [WebexAdapterOptions](#webexadapteroptions) for a full definition of the allowed parameters.

Use with Botkit:
```javascript
const adapter = new WebexAdapter({
     access_token: process.env.ACCESS_TOKEN, // access token from https://developer.webex.com
     public_address: process.env.PUBLIC_ADDRESS,  // public url of this app https://myapp.com/
     secret: process.env.SECRET // webhook validation secret - you can define this yourself
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new WebexAdapter({
     access_token: process.env.ACCESS_TOKEN, // access token from https://developer.webex.com
     public_address: process.env.PUBLIC_ADDRESS,  // public url of this app https://myapp.com/
     secret: process.env.SECRET // webhook validation secret - you can define this yourself
});

// set up restify...
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
// register the webhook subscription to start receiving messages - Botkit does this automatically!
adapter.registerWebhookSubscription('/api/messages');
// Load up the bot's identity, otherwise it won't know how to filter messages from itself
adapter.getIdentity();
// create an endpoint for receiving messages
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         // do your bot logic here!
     });
});
```



## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| identity |  | Returns the identity of the bot, including {id, emails, displayName, created} and anything else from [this spec](https://webex.github.io/spark-js-sdk/api/#personobject)

## WebexAdapter Class Methods
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
| context| TurnContext | A TurnContext representing the current incoming message and environment. (not used)
| reference| Partial&lt;ConversationReference&gt; | An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`<br/>



<a name="getIdentity"></a>
### getIdentity()
Load the bot's identity via the Webex API.
MUST be called by BotBuilder bots in order to filter messages sent by the bot.


<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Calls registerWebhookSubscription() during bootup.
     * Calls getIdentit() to load the bot's identity.

**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | 



<a name="processActivity"></a>
### processActivity()
Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.

**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | A request object from Restify or Express
| res| any | A response object from Restify or Express
| logic|  | A bot logic function in the form `async(context) => { ... }`<br/>



<a name="registerAdaptiveCardWebhookSubscription"></a>
### registerAdaptiveCardWebhookSubscription()
Register a webhook subscription with Webex Teams to start receiving message events.

**Parameters**

| Argument | Type | description
|--- |--- |---
| webhook_path| any | the path of the webhook endpoint like `/api/messages`<br/>



<a name="registerWebhookSubscription"></a>
### registerWebhookSubscription()
Register a webhook subscription with Webex Teams to start receiving message events.

**Parameters**

| Argument | Type | description
|--- |--- |---
| webhook_path| any | the path of the webhook endpoint like `/api/messages`<br/>



<a name="resetWebhookSubscriptions"></a>
### resetWebhookSubscriptions()
Clear out and reset all the webhook subscriptions currently associated with this application.


<a name="sendActivities"></a>
### sendActivities()
Standard BotBuilder adapter method to send a message from the bot to the messaging API.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| activities|  | An array of outgoing activities to be sent back to the messaging API.<br/>




<a name="WebexBotWorker"></a>
## WebexBotWorker
This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Webex Teams.
It includes all functionality from the base class, as well as the extension methods below.

When using the WebexAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-webex
```

Then import this and other classes into your code:
```javascript
const { WebexBotWorker } = require('botbuilder-adapter-webex');
```

This class includes the following methods:
* [deleteMessage()](#deleteMessage)
* [replyInThread()](#replyInThread)
* [startConversationInRoom()](#startConversationInRoom)
* [startConversationInThread()](#startConversationInThread)
* [startPrivateConversation()](#startPrivateConversation)




## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| api | Webex | An instance of the [webex api client](https://www.npmjs.com/package/webex)

## WebexBotWorker Class Methods
<a name="deleteMessage"></a>
### deleteMessage()
Delete an existing message.

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object in the form of `{id: <id of message to delete>}`<br/>



```javascript
// send a reply, capture the results
let sent = await bot.reply(message,'this is my original reply...');

// delete the sent message using the sent.id field
await bot.deleteMessage(sent);
```


<a name="replyInThread"></a>
### replyInThread()
Like bot.reply, but as a threaded response to the incoming message rather than a new message in the main channel.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | an incoming message object
| resp| any | an outgoing message object (or part of one or just reply text)<br/>



<a name="startConversationInRoom"></a>
### startConversationInRoom()
Switch a bot's context into a different room.
After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| roomId| string | A Webex rooom id, like one found in `message.channel`
| userId| string | A Webex user id, like one found in `message.user`<br/>



```javascript
controller.hears('take this offline', 'message', async(bot, message) => {

     // switch to a different channel
     await bot.startConversationInRoom(WEBEX_ROOM_ID, message.user);

     // say hello
     await bot.say('Shall we discuss this matter over here?');
     // ... continue...
     await bot.beginDialog(ANOTHER_DIALOG);

});
```

Also useful when sending pro-active messages such as those sent on a schedule or in response to external events:
```javascript
// Spawn a worker
let bot = await controller.spawn();

// Set the context for the bot's next action...
await bot.startConversationInRoom(CACHED_ROOM_ID, CACHED_USER_ID);

// Begin a dialog in the 1:1 context
await bot.beginDialog(ALERT_DIALOG);
```


<a name="startConversationInThread"></a>
### startConversationInThread()
Switch a bot's context into a specific thread within a room.
After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| roomId| string | A Webex rooom id, like one found in `message.channel`
| userId| string | A Webex user id, like one found in `message.user`
| parentId| string | A webex message id that should be the parent message, like the one found in `message.id`<br/>



```javascript
controller.hears('take this offline', 'message', async(bot, message) => {

     // switch to a different channel
     await bot.startConversationInThread(WEBEX_ROOM_ID, message.user, message.id);

     // say hello
     await bot.say('Shall we discuss this matter over here?');
     // ... continue...
     await bot.beginDialog(ANOTHER_DIALOG);

});
```

Also useful when sending pro-active messages such as those sent on a schedule or in response to external events:
```javascript
// Spawn a worker
let bot = await controller.spawn();

// Set the context for the bot's next action...
await bot.startConversationInRoom(CACHED_ROOM_ID, CACHED_USER_ID);

// Begin a dialog in the 1:1 context
await bot.beginDialog(ALERT_DIALOG);
```


<a name="startPrivateConversation"></a>
### startPrivateConversation()
Change the context of the _next_ message
Due to a quirk in the Webex API, we can't know the address of the DM until after sending the first message.
As a result, the internal tracking for this conversation can't be persisted properly.
USE WITH CAUTION while we try to sort this out.

**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| string | user id of a webex teams user, like one from `message.user`<br/>





<a name="WebexAdapterOptions"></a>
## Interface WebexAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| access_token | string | An access token for the bot. Get one from [https://developer.webex.com/](https://developer.webex.com/)<br/>
| enable_incomplete | boolean | Allow the adapter to startup without a complete configuration.<br/>This is risky as it may result in a non-functioning or insecure adapter.<br/>This should only be used when getting started.<br/>
| public_address | string | The root URL of your bot application.  Something like `https://mybot.com/`<br/>
| secret | string | Secret used to validate incoming webhooks - you can define this yourself<br/>
| webhook_name | string | a name for the webhook subscription that will be created to tell Webex to send your bot webhooks.<br/>
