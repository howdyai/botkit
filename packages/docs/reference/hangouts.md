# Botkit for Hangouts Class Reference

## Classes


* <a href="#HangoutsAdapter">HangoutsAdapter</a>
* <a href="#HangoutsBotWorker">HangoutsBotWorker</a>

## Interfaces

* <a href="#HangoutsAdapterOptions">HangoutsAdapterOptions</a>

---

<a name="HangoutsAdapter"></a>
## HangoutsAdapter
Connect Botkit or BotBuilder to Google Hangouts.

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
server.post('/api/messages', (req, res) => {
 adapter.processActivity(req, res, async(context) => {
     // do your bot logic here!
 });
});
```

### constructor new HangoutsAdapter()
Create a Google Hangouts adapter.

```javascript
const adapter = new HangoutsAdapter({
     token: process.env.GOOGLE_TOKEN,
         google_auth_params: {
         credentials: process.env.GOOGLE_CREDS
     }
});
```


**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [HangoutsAdapterOptions](#HangoutsAdapterOptions) | An object containing API credentials and a webhook verification token<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [HangoutsBotWorker](#HangoutsBotWorker) | A customized BotWorker object that exposes additional utility methods.
| middlewares | any | Object containing one or more Botkit middlewares to bind automatically.
| name | string | Name used by Botkit plugin loader

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



<a name="deleteMessage"></a>
### deleteMessage()
Delete an existing message

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object containing {id}<br/>



<a name="replyInThread"></a>
### replyInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithNew"></a>
### replyWithNew()
Reply to a card_click event with a new message

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



<a name="replyWithUpdate"></a>
### replyWithUpdate()
Reply to a card_click event by updating the original message

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



<a name="startConversationInThread"></a>
### startConversationInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| spaceName| string | 
| userId| string | 
| threadKey (optional)| string | 



<a name="updateMessage"></a>
### updateMessage()
Update an existing message with a new version

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object containing {id, text, cards}<br/>






<a name="HangoutsAdapterOptions"></a>
## Interface HangoutsAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| google_auth_params |  | Parameters passed to the [Google API client library](https://www.npmjs.com/package/googleapis) which is in turn used to send messages.<br/>Define credentials per [the GoogleAuthOptions defined here](https://github.com/googleapis/google-auth-library-nodejs/blob/master/src/auth/googleauth.ts#L54),<br/>OR, specify GOOGLE_APPLICATION_CREDENTIALS in environment [as described in the Google docs](https://cloud.google.com/docs/authentication/getting-started).<br/>
| token | string | Shared secret token used to validate the origin of incoming webhooks.<br/>Get this from the [Google API console for your bot app](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) - it is found on the Configuration tab under the heading "Verification Token".<br/>If defined, the origin of all incoming webhooks will be validated and any non-matching requests will be rejected.<br/>
