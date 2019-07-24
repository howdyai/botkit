# Botkit for Twilio SMS Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-twilio-sms](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-twilio-sms) package.

## Classes


* <a href="#TwilioAdapter" aria-current="page">TwilioAdapter</a>
* <a href="#TwilioBotWorker" aria-current="page">TwilioBotWorker</a>

## Interfaces

* <a href="#TwilioAdapterOptions" aria-current="page">TwilioAdapterOptions</a>

---

<a name="TwilioAdapter"></a>
## TwilioAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Twilio's SMS service.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-twilio-sms
```

Then import this and other classes into your code:
```javascript
const { TwilioAdapter } = require('botbuilder-adapter-twilio-sms');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [processActivity()](#processActivity)
* [sendActivities()](#sendActivities)



### Create a new TwilioAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [TwilioAdapterOptions](#TwilioAdapterOptions) | An object containing API credentials, a webhook verification token and other options<br/>

Create an adapter to handle incoming messages from Twilio's SMS service and translate them into a standard format for processing by your bot.

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




## TwilioAdapter Class Methods
<a name="continueConversation"></a>
### continueConversation()
Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)

**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | A conversation reference to be applied to future messages.
| logic|  | A bot logic function that will perform continuing action in the form `async(context) => { ... }`<br/>



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




<a name="TwilioBotWorker"></a>
## TwilioBotWorker
This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Twilio SMS.
It includes all functionality from the base class, as well as the extension methods below.

When using the TwilioAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-twilio-sms
```

Then import this and other classes into your code:
```javascript
const { TwilioBotWorker } = require('botbuilder-adapter-twilio-sms');
```

This class includes the following methods:
* [startConversationWithUser()](#startConversationWithUser)




## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| api | Twilio.Twilio | A copy of the Twilio API client.

## TwilioBotWorker Class Methods
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
| enable_incomplete | boolean | Allow the adapter to startup without a complete configuration.<br/>This is risky as it may result in a non-functioning or insecure adapter.<br/>This should only be used when getting started.<br/>
| twilio_number | string | The phone number associated with this Twilio app, in the format 1XXXYYYZZZZ<br/>
| validation_url | string | An optional url to override the automatically generated url signature used to validate incoming requests -- [See Twilio docs about securing your endpoint.](https://www.twilio.com/docs/usage/security#validating-requests)<br/>
