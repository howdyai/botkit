# Botkit for Facebook Class Reference

[&larr; Botkit Core Docs](..)  [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-facebook](../../botbuilder-adapter-facebook) package.

## Classes


* <a href="#FacebookAPI">FacebookAPI</a>
* <a href="#FacebookAdapter">FacebookAdapter</a>
* <a href="#FacebookBotWorker">FacebookBotWorker</a>
* <a href="#FacebookEventTypeMiddleware">FacebookEventTypeMiddleware</a>

## Interfaces

* <a href="#FacebookAdapterOptions">FacebookAdapterOptions</a>

---

<a name="FacebookAPI"></a>
## FacebookAPI
A simple API client for the Facebook API.  Automatically signs requests with the access token and app secret proof.
It can be used to call any API provided by Facebook.
### constructor new FacebookAPI()
Create a FacebookAPI client.
```
let api = new FacebookAPI(TOKEN, SECRET);
await api.callAPI('/some/api','POST', {some_options});
```

**Parameters**

| Argument | Type | Description
|--- |--- |---
| token | string | a page access token
| secret | string | an app secret
| api_host | string | optional root hostname for constructing api calls, defaults to graph.facebook.com
| api_version | string | optional api version used when constructing api calls, defaults to v3.2<br/>


<a name="callAPI"></a>
### callAPI()
Call one of the Facebook APIs

**Parameters**

| Argument | Type | description
|--- |--- |---
| path| string | Path to the API endpoint, for example `/me/messages`
| method| string | HTTP method, for example POST, GET, DELETE or PUT.
| payload| any | An object to be sent as parameters to the API call.<br/>




<a name="FacebookAdapter"></a>
## FacebookAdapter
Connect Botkit or BotBuilder to FacebookMessenger. See [FacebookAdapterOptions](#FacebookAdapterOptions) for parameters.
The Facebook Adapter can be used in 2 modes: bound to a single Facebook page,
or in multi-tenancy mode able to serve multiple pages.. [Read here for more information](#constructor-new-facebookadapter).

To use with Botkit:
```javascript
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
const controller = new Botkit({
     adapter: adapter,
     // other options
});
```

To use with BotBuilder:
```javascript
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         // do your bot logic here!
     });
});
```

### constructor new FacebookAdapter()
Create a FacebookAdapter to handle messages from Facebook.
To create an app bound to a single page, pass in `access_token`.
To create an app that can be bound to multiple pages, pass in `getAccessTokenForPage` function in the form `async (pageId) => page_access_token`
```javascript
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
```

**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [FacebookAdapterOptions](#FacebookAdapterOptions) | Configuration options<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [FacebookBotWorker](#FacebookBotWorker) | 
| middlewares | any | 
| name | string | 

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
Facebook adapter does not support updateActivity.

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | 



<a name="getAPI"></a>
### getAPI()
Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any bot worker instances.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



<a name="init"></a>
### init()
Botkit plugin init function - defines an additional webhook behavior for providing webhook verification

**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | <br/>



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
Facebook adapter does not support updateActivity.

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activity| Partial&lt;Activity&gt; | 




<a name="FacebookBotWorker"></a>
## FacebookBotWorker
This is a specialized version of the BotWorker class that includes additional methods for interacting with Facebook.
It includes all functionality from [the core BotWorker class](core.md#BotWorker) as well as the extension methods below.
When using the FacebookAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.
### constructor new FacebookBotWorker()
Used internally by controller.spawn, creates a BotWorker instance that can send messages, replies, and make other API calls.

The example below demonstrates spawning a bot for sending proactive messages to users:
```javascript
let bot = await controller.spawn(FACEBOOK_PAGE_ID);
await bot.startConversationWithUser(FACEBOOK_USER_PSID);
await bot.say('Howdy human!');
```

**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | Botkit | The Botkit controller object responsible for spawning this bot worker
| config | any | Normally, a DialogContext object.  Can also be the ID of a Facebook page managed by this app.<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| api | [FacebookAPI](#FacebookAPI) | A copy of the FacebookAPI client giving access to `await res = bot.api.callAPI(path, method, parameters);`

<a name="startConversationWithUser"></a>
### startConversationWithUser()


**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| any | 




<a name="FacebookEventTypeMiddleware"></a>
## FacebookEventTypeMiddleware
This adapter middleware, when used in conjunction with FacebookAdapter and Botkit, will result in Botkit emitting events with
names based on their event type.

```javascript
const adapter = new FacebookAdapter(MY_OPTIONS);
adapter.use(new FacebookEventTypeMiddleware());
```

When used, events emitted may include:
* facebook_postback
* facebook_referral
* facebook_optin
* message_delivered
* message_read
* facebook_account_linking
* message_echo
* facebook_app_roles
* standby
* facebook_receive_thread_control
* facebook_request_thread_control



<a name="onTurn"></a>
### onTurn()
Implements the middleware's onTurn function. Called automatically!

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| any | 
| next| any | <br/>






<a name="FacebookAdapterOptions"></a>
## Interface FacebookAdapterOptions
This interface defines the options that can be passed into the FacebookAdapter constructor function.

**Fields**

| Name | Type | Description
|--- |--- |---
| access_token | string | When bound to a single page, use `access_token` to specify the "page access token" provided in the Facebook developer portal's "Access Tokens" widget of the "Messenger Settings" page.<br/>
| api_host | string | Alternate root url used to contruct calls to Facebook's API.  Defaults to 'graph.facebook.com' but can be changed (for mocking, proxy, etc).<br/>
| api_version | string | Alternate API version used to construct calls to Facebook's API. Defaults to v3.2<br/>
| app_secret | string | The "app secret" from the "basic settings" page from your app's configuration in the Facebook developer portal<br/>
| getAccessTokenForPage |  | When bound to multiple teams, provide a function that, given a page id, will return the page access token for that page.<br/>
| verify_token | string | The "verify token" used to initially create and verify the Webhooks subscription settings on Facebook's developer portal.<br/>
