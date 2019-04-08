# Botkit for Twilio SMS Class Reference

## Classes


* <a href="#TwilioAdapter">TwilioAdapter</a>

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






<a name="TwilioAdapterOptions"></a>
## Interface TwilioAdapterOptions
Parameters passed to the TwilioAdapter constructor.

**Fields**

| Name | Type | Description
|--- |--- |---
| account_sid | string | The account SID from the twilio account<br/>
| auth_token | string | An api auth token associated with the twilio account<br/>
| twilio_number | string | The phone number associated with this Twilio app, in the format 1XXXYYYZZZZ<br/>
| validation_url | string | An optional url to override the automatically generated url signature used to validate requests in [verifySignature](#verifySignature) -- [See Twilio docs about validating incoming requests.](https://www.twilio.com/docs/usage/security#validating-requests)<br/>
