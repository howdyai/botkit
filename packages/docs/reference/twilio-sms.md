# Botkit for Twilio SMS Class Reference

[Boktkit Core Docs](..) &raquo; [Botkit Class References](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-twilio-sms](../../botbuilder-adapter-twilio-sms) package.

## Classes


* <a href="#TwilioAdapter">TwilioAdapter</a>
* <a href="#TwilioBotWorker">TwilioBotWorker</a>

## Interfaces

* <a href="#TwilioAdapterOptions">TwilioAdapterOptions</a>

---

<a name="TwilioAdapter"></a>
## TwilioAdapter
Connect Botkit or BotBuilder to Twilio's SMS service. See [TwilioAdapterOptions](#TwilioAdapterOptions) for parameters.

Use with Botkit:
```javascript
const adapter = new TwilioAdapter({
     twilio_number: process.env.TWILIO_NUMBER,
     account_sid: process.env.TWILIO_ACCOUNT_SID,
     auth_token: process.env.TWILIO_AUTH_TOKEN,
     validation_url: process.env.TWILIO_VALIDATION_URL
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new TwilioAdapter({
     twilio_number: process.env.TWILIO_NUMBER,
     account_sid: process.env.TWILIO_ACCOUNT_SID,
     auth_token: process.env.TWILIO_AUTH_TOKEN,
     validation_url: process.env.TWILIO_VALIDATION_URL
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

### constructor new TwilioAdapter()
Create a Twilio adapter. See [TwilioAdapterOptions](#TwilioAdapterOptions) for a full definition of the allowed parameters.

```javascript
const adapter = new TwilioAdapter({
     twilio_number: process.env.TWILIO_NUMBER,
     account_sid: process.env.TWILIO_ACCOUNT_SID,
     auth_token: process.env.TWILIO_AUTH_TOKEN,
});
```


**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [TwilioAdapterOptions](#TwilioAdapterOptions) | An object containing API credentials, a webhook verification token and other options<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [TwilioBotWorker](#TwilioBotWorker) | A specialized BotWorker for Botkit that exposes Twilio specific extension methods.
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
Twilio SMS adapter does not support deleteActivity.

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | 



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
Twilio SMS adapter does not support updateActivity.

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activity| Partial&lt;Activity&gt; | 




<a name="TwilioBotWorker"></a>
## TwilioBotWorker
Specialized version of the BotWorker class that includes additional methods for interacting with Twilio.
When using the TwilioAdapter with Botkit, all `bot` objects will be of this type.

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| api | Twilio.Twilio | A copy of the Twilio API client

<a name="startConversationWithUser"></a>
### startConversationWithUser()
Start a conversation with a given user identified by their phone number. Useful for sending pro-active messages:

**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| string | A phone number in the form +1XXXYYYZZZZ<br/>



```javascript
let bot = await controller.spawn();
await bot.startConversationWithUser(MY_PHONE_NUMBER);
await bot.send('An important update!');
```





<a name="TwilioAdapterOptions"></a>
## Interface TwilioAdapterOptions
Parameters passed to the TwilioAdapter constructor.

**Fields**

| Name | Type | Description
|--- |--- |---
| account_sid | string | The account SID from the twilio account<br/>
| auth_token | string | An api auth token associated with the twilio account<br/>
| twilio_number | string | The phone number associated with this Twilio app, in the format 1XXXYYYZZZZ<br/>
| validation_url | string | An optional url to override the automatically generated url signature used to validate incoming requests -- [See Twilio docs about securing your endpoint.](https://www.twilio.com/docs/usage/security#validating-requests)<br/>
