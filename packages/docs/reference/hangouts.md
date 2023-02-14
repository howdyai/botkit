# Botkit for Hangouts Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-hangouts](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-hangouts) package.

## Classes


* <a href="#HangoutsAdapter" aria-current="page">HangoutsAdapter</a>
* <a href="#HangoutsBotWorker" aria-current="page">HangoutsBotWorker</a>

## Interfaces

* <a href="#HangoutsAdapterOptions" aria-current="page">HangoutsAdapterOptions</a>

---

<a name="HangoutsAdapter"></a>
## HangoutsAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Google Hangouts

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-hangouts
```

Then import this and other classes into your code:
```javascript
const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [deleteActivity()](#deleteActivity)
* [processActivity()](#processActivity)
* [sendActivities()](#sendActivities)
* [updateActivity()](#updateActivity)



### Create a new HangoutsAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [HangoutsAdapterOptions](#HangoutsAdapterOptions) | An object containing API credentials and a webhook verification token<br/>

Create an adapter to handle incoming messages from Google Hangouts and translate them into a standard format for processing by your bot.

Use with Botkit:
```javascript
const adapter = new HangoutsAdapter({
     token: process.env.GOOGLE_TOKEN,
     google_auth_params: {
         credentials: process.env.GOOGLE_CREDS
     }
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new HangoutsAdapter({
     token: process.env.GOOGLE_TOKEN,
     google_auth_params: {
         credentials: process.env.GOOGLE_CREDS
     }
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




## HangoutsAdapter Class Methods
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
| context| TurnContext | A TurnContext representing the current incoming message and environment. (Not used)
| reference| Partial&lt;ConversationReference&gt; | An object in the form `{activityId: <id of message to delete>}`<br/>



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
| context| TurnContext | A TurnContext representing the current incoming message and environment. (Not used)
| activities|  | An array of outgoing activities to be sent back to the messaging API.<br/>



<a name="updateActivity"></a>
### updateActivity()
Standard BotBuilder adapter method to update a previous message with new content.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment. (Not used)
| activity| Partial&lt;Activity&gt; | The updated activity in the form `{id: <id of activity to update>, text: <updated text>, cards?: [<array of updated hangouts cards>]}`<br/>




<a name="HangoutsBotWorker"></a>
## HangoutsBotWorker
This is a specialized version of [Botkit's core BotWorker class](#BotWorker) that includes additional methods for interacting with Google Hangouts.
It includes all functionality from the base class, as well as the extension methods below.

When using the HangoutsAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-hangouts
```

Then import this and other classes into your code:
```javascript
const { HangoutsBotWorker } = require('botbuilder-adapter-hangouts');
```

This class includes the following methods:
* [deleteMessage()](#deleteMessage)
* [replyInThread()](#replyInThread)
* [replyWithNew()](#replyWithNew)
* [replyWithUpdate()](#replyWithUpdate)
* [startConversationInThread()](#startConversationInThread)
* [updateMessage()](#updateMessage)




## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| api | any | Access to the official [Google API client for Hangouts](https://www.npmjs.com/package/googleapis)

## HangoutsBotWorker Class Methods
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
Reply to an incoming message in a brand new thread.  Works for a single message reply - if multiple replies or replying with a dialog is necessary, use [startConversationInThread](#startconversationinthread).

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming message or event object
| resp| any | A reply message containing text and/or cards<br/>



```javascript
controller.hears('thread','message', async(bot, message) =>{
     await bot.replyInThread(message,'This will appear in a new thread.');
});
```

<a name="replyWithNew"></a>
### replyWithNew()
Reply to a card_click event with a new message. [See Google doc for interactive cards &rarr;](https://developers.google.com/hangouts/chat/how-tos/cards-onclick#responding_to_clicks_with_a_new_or_updated_message).

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



When a user clicks a button contained in a card attachment, a `card_clicked` event will be emitted.
In order to reply to the incoming event with a new message (rather than replacing the original card), use this method!

```javascript
controller.on('card_clicked', async(bot, message) => {
     // check message.action.actionMethodName to see what button was clicked...
     await bot.replyWithNew(message,'Reply to button click!');
})
```


<a name="replyWithUpdate"></a>
### replyWithUpdate()
Reply to a card_click event with an update to the original message. [See Google doc for interactive cards &rarr;](https://developers.google.com/hangouts/chat/how-tos/cards-onclick#responding_to_clicks_with_a_new_or_updated_message).

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



When a user clicks a button contained in a card attachment, a `card_clicked` event will be emitted.
In order to reply to the incoming event by replacing the original message, use this method!

```javascript
controller.on('card_clicked', async(bot, message) => {
     // check message.action.actionMethodName to see what button was clicked...
     await bot.replyWithUpdate(message,'Reply to button click!');
})
```


<a name="startConversationInThread"></a>
### startConversationInThread()
Switch the bot's active context to a new thread.
Use this to change the location of a bot's responses or calls to beginDialog into a new conversation thread (rather than continuing in the same thread as the originating message)

**Parameters**

| Argument | Type | description
|--- |--- |---
| spaceName| string | The name of the main space - usually `message.channel`
| userId| string | The id of the user conducting the conversation - usually `message.user`
| threadKey (optional)| string | An optional key definining the thread - if one is not provided, a random one is generated.<br/>



```javascript
controller.hears('new thread', 'message', async(bot, message) => {

     // change to a new thread
     await bot.startConversationInThread(message.channel, message.user);

     // begin a dialog in the new thread
     await bot.beginDialog('foo');

});
```


<a name="updateMessage"></a>
### updateMessage()
Update an existing message with new content.

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object in the form `{id: <id of message to update>, text: <new text>, card: <array of card objects>}`<br/>



```javascript
// send a reply, capture the results
let sent = await bot.reply(message,'this is my original reply...');

// update the sent message using the sent.id field
await bot.updateMessage({
     id: sent.id,
     text: 'this is an update!',
})
```




<a name="HangoutsAdapterOptions"></a>
## Interface HangoutsAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| enable_incomplete | boolean | Allow the adapter to startup without a complete configuration.<br/>This is risky as it may result in a non-functioning or insecure adapter.<br/>This should only be used when getting started.<br/>
| google_auth_params |  | Parameters passed to the [Google API client library](https://www.npmjs.com/package/googleapis) which is in turn used to send messages.<br/>Define credentials per [the GoogleAuthOptions defined here](https://github.com/googleapis/google-auth-library-nodejs/blob/master/src/auth/googleauth.ts#L54),<br/>OR, specify GOOGLE_APPLICATION_CREDENTIALS in environment [as described in the Google docs](https://cloud.google.com/docs/authentication/getting-started).<br/>
| token | string | Shared secret token used to validate the origin of incoming webhooks.<br/>Get this from the [Google API console for your bot app](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) - it is found on the Configuration tab under the heading "Verification Token".<br/>If defined, the origin of all incoming webhooks will be validated and any non-matching requests will be rejected.<br/>
