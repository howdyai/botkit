# Botkit for Facebook Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-facebook](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-facebook) package.

## Classes


* <a href="#FacebookAdapter" aria-current="page">FacebookAdapter</a>
* <a href="#FacebookBotWorker" aria-current="page">FacebookBotWorker</a>
* <a href="#FacebookAPI" aria-current="page">FacebookAPI</a>
* <a href="#FacebookEventTypeMiddleware" aria-current="page">FacebookEventTypeMiddleware</a>

## Interfaces

* <a href="#FacebookAdapterOptions" aria-current="page">FacebookAdapterOptions</a>

---

<a name="FacebookAdapter"></a>
## FacebookAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Facebook Messenger.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-facebook
```

Then import this and other classes into your code:
```javascript
const { FacebookAdapter } = require('botbuilder-adapter-facebook');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [getAPI()](#getAPI)
* [init()](#init)
* [processActivity()](#processActivity)
* [sendActivities()](#sendActivities)



### Create a new FacebookAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [FacebookAdapterOptions](#FacebookAdapterOptions) | Configuration options<br/>

Create an adapter to handle incoming messages from Facebook and translate them into a standard format for processing by your bot.

The Facebook Adapter can be used in 2 modes:
* bound to a single Facebook page
* multi-tenancy mode able to serve multiple pages

To create an app bound to a single Facebook page, include that page's `access_token` in the options.

To create an app that can be bound to multiple pages, include `getAccessTokenForPage` - a function in the form `async (pageId) => page_access_token`

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

In multi-tenancy mode:
```javascript
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
      getAccessTokenForPage: async(pageId) => {
          // do something to fetch the page access token for pageId.
          return token;
      })
});
```




## FacebookAdapter Class Methods
<a name="continueConversation"></a>
### continueConversation()
Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)

**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | A conversation reference to be applied to future messages.
| logic|  | A bot logic function that will perform continuing action in the form `async(context) => { ... }`<br/>



<a name="getAPI"></a>
### getAPI()
Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any BotWorker instances passed into Botkit handler functions.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



```javascript
let api = adapter.getAPI(activity);
let res = api.callAPI('/me/messages', 'POST', message);
```

<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Amends the webhook_uri with an additional behavior for responding to Facebook's webhook verification request.

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




<a name="FacebookBotWorker"></a>
## FacebookBotWorker
This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Facebook.
It includes all functionality from the base class, as well as the extension methods below.

When using the FacebookAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.


To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-facebook
```

Then import this and other classes into your code:
```javascript
const { FacebookBotWorker } = require('botbuilder-adapter-facebook');
```

This class includes the following methods:
* [startConversationWithUser()](#startConversationWithUser)



### Create a new FacebookBotWorker()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | Botkit | The Botkit controller object responsible for spawning this bot worker.
| config | any | Normally, a DialogContext object.  Can also be the ID of a Facebook page managed by this app.<br/>

Reserved for use internally by Botkit's `controller.spawn()`, this class is used to create a BotWorker instance that can send messages, replies, and make other API calls.

When used with the FacebookAdapter's multi-tenancy mode, it is possible to spawn a bot instance by passing in the Facebook page ID representing the appropriate bot identity.
Use this in concert with [startConversationWithUser()](#startConversationWithUser) and [changeContext()](core.md#changecontext) to start conversations
or send proactive alerts to users on a schedule or in response to external events.

```javascript
let bot = await controller.spawn(FACEBOOK_PAGE_ID);
```


## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| api | [FacebookAPI](#FacebookAPI) | A copy of the FacebookAPI client giving access to `let res = await bot.api.callAPI(path, method, parameters);`

## FacebookBotWorker Class Methods
<a name="startConversationWithUser"></a>
### startConversationWithUser()
Change the operating context of the worker to begin a conversation with a specific user.
After calling this method, any calls to `bot.say()` or `bot.beginDialog()` will occur in this new context.

**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| any | the PSID of a user the bot has previously interacted with<br/>



This method can be used to send users scheduled messages or messages triggered by external events.
```javascript
let bot = await controller.spawn(FACEBOOK_PAGE_ID);
await bot.startConversationWithUser(FACEBOOK_USER_PSID);
await bot.say('Howdy human!');
```



<a name="FacebookAPI"></a>
## FacebookAPI
A simple API client for the Facebook API.  Automatically signs requests with the access token and app secret proof.
It can be used to call any API provided by Facebook.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-facebook
```

Then import this and other classes into your code:
```javascript
const { FacebookAPI } = require('botbuilder-adapter-facebook');
```

This class includes the following methods:
* [callAPI()](#callAPI)



### Create a new FacebookAPI()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| token | string | a page access token
| secret | string | an app secret
| api_host | string | optional root hostname for constructing api calls, defaults to graph.facebook.com
| api_version | string | optional api version used when constructing api calls, defaults to v3.2<br/>

Create a FacebookAPI client.
```
let api = new FacebookAPI(TOKEN, SECRET);
await api.callAPI('/some/api','POST', {some_options});
```



## FacebookAPI Class Methods
<a name="callAPI"></a>
### callAPI()
Call one of the Facebook APIs

**Parameters**

| Argument | Type | description
|--- |--- |---
| path| string | Path to the API endpoint, for example `/me/messages`
| method| string | HTTP method, for example POST, GET, DELETE or PUT.
| payload| any | An object to be sent as parameters to the API call.<br/>




<a name="FacebookEventTypeMiddleware"></a>
## FacebookEventTypeMiddleware
This adapter middleware, when used in conjunction with FacebookAdapter and Botkit, will result in Botkit emitting events with
names based on their event type.

```javascript
const adapter = new FacebookAdapter(MY_OPTIONS);
adapter.use(new FacebookEventTypeMiddleware());
const controller = new Botkit({
     adapter: adapter,
});

// define a handler for one of the new events
controller.on('facebook_option', async(bot, message) => {
     // ...
});
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



To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-facebook
```

Then import this and other classes into your code:
```javascript
const { FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook');
```








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
| enable_incomplete | boolean | Allow the adapter to startup without a complete configuration.<br/>This is risky as it may result in a non-functioning or insecure adapter.<br/>This should only be used when getting started.<br/>
| getAccessTokenForPage |  | When bound to multiple teams, provide a function that, given a page id, will return the page access token for that page.<br/>
| verify_token | string | The "verify token" used to initially create and verify the Webhooks subscription settings on Facebook's developer portal.<br/>
