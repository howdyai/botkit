# Botkit for Webex Teams Class Reference

## Classes


* <a href="#WebexAdapter">WebexAdapter</a>
* <a href="#WebexBotWorker">WebexBotWorker</a>

## Interfaces

* <a href="#WebexAdapterOptions">WebexAdapterOptions</a>

---

<a name="WebexAdapter"></a>
## WebexAdapter
Connect Botkit or BotBuilder to Webex Teams. See [WebexAdapterOptions](#WebexAdapterOptions) for parameters.

Use with Botkit:
```javascript
const adapter = new WebexAdapter({
    access_token: process.env.ACCESS_TOKEN,
    public_address: process.env.PUBLIC_ADDRESS
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new WebexAdapter({
    access_token: process.env.ACCESS_TOKEN,
    public_address: process.env.PUBLIC_ADDRESS
});
// set up restify...
const server = restify.createServer();
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         // do your bot logic here!
     });
});
```

### constructor new WebexAdapter()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | [WebexAdapterOptions](#WebexAdapterOptions) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [WebexBotWorker](#WebexBotWorker) | A customized BotWorker object that exposes additional utility methods.
| middlewares | any | Object containing one or more Botkit middlewares to bind automatically.
| name | string | Name used by Botkit plugin loader

<a name="continueConversation"></a>
### continueConversation()


**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | 
| logic|  | 



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | 



<a name="init"></a>
### init()


**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | 



<a name="processActivity"></a>
### processActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | 
| res| any | 
| logic|  | 



<a name="registerWebhookSubscription"></a>
### registerWebhookSubscription()


**Parameters**

| Argument | Type | description
|--- |--- |---
| webhook_path| any | 



<a name="resetWebhookSubscriptions"></a>
### resetWebhookSubscriptions()



<a name="sendActivities"></a>
### sendActivities()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activities|  | 



<a name="updateActivity"></a>
### updateActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activity| Partial&lt;Activity&gt; | 




<a name="WebexBotWorker"></a>
## WebexBotWorker


**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| api | Ciscospark | 

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
| public_address | string | The root URL of your bot application.  Something like `https://mybot.com/`<br/>
| secret | string | Shared secret used to validate incoming webhooks.<br/>
| webhook_name | string | a name for the webhook subscription that will be created to tell Webex to send your bot webhooks.<br/>
