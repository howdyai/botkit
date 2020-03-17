# Botkit for the Web Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-web](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-web) package.

## Classes


* <a href="#WebAdapter" aria-current="page">WebAdapter</a>


---

<a name="WebAdapter"></a>
## WebAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to the Web.
It offers both websocket and webhook capabilities.
To use this adapter, you will need a compatible chat client - generate one using the [Botkit yeoman generator](https://npmjs.com/package/generator-botkit),
or use [the one included in the project repo here.](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-web/client)

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-web
```

Then import this and other classes into your code:
```javascript
const { WebAdapter } = require('botbuilder-adapter-web');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [createSocketServer()](#createSocketServer)
* [getConnection()](#getConnection)
* [init()](#init)
* [isConnected()](#isConnected)
* [processActivity()](#processActivity)
* [sendActivities()](#sendActivities)



### Create a new WebAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| socketServerOptions |  | an optional object containing parameters to send to a call to [WebSocket.server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).<br/>

Create an adapter to handle incoming messages from a websocket and/or webhook and translate them into a standard format for processing by your bot.

To use with Botkit:
```javascript
const adapter = new WebAdapter();
const controller = new Botkit({
     adapter: adapter,
     // other options
});
```

To use with BotBuilder:
```javascript
const adapter = new WebAdapter();
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
// instead of binding processActivity to the incoming request, pass in turn handler logic to createSocketServer
let options = {}; // socket server configuration options
adapter.createSocketServer(server, options, async(context) => {
 // handle turn here
});
```



## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| wss | any | The websocket server.

## WebAdapter Class Methods
<a name="continueConversation"></a>
### continueConversation()
Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)

**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | A conversation reference to be applied to future messages.
| logic|  | A bot logic function that will perform continuing action in the form `async(context) => { ... }`<br/>



<a name="createSocketServer"></a>
### createSocketServer()
Bind a websocket listener to an existing webserver object.
Note: Create the server using Node's http.createServer

**Parameters**

| Argument | Type | description
|--- |--- |---
| server| any | an http server
| socketOptions| any | additional options passed when creating the websocket server with [WebSocket.server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)
| logic| any | a turn handler function in the form `async(context)=>{ ... }` that will handle the bot's logic.<br/>



<a name="getConnection"></a>
### getConnection()
Returns websocket connection of given user
Example: `if (message.action === 'disconnect') bot.controller.adapter.getConnection(message.user).terminate()`

**Parameters**

| Argument | Type | description
|--- |--- |---
| user| string | <br/>



<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Calls createSocketServer to bind a websocket listener to Botkit's pre-existing webserver.

**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | <br/>



<a name="isConnected"></a>
### isConnected()
Is given user currently connected? Use this to test the websocket connection
between the bot and a given user before sending messages,
particularly in cases where a long period of time may have passed.

**Parameters**

| Argument | Type | description
|--- |--- |---
| user| string | the id of a user, typically from `message.user`<br/>



Example: `bot.controller.adapter.isConnected(message.user)`

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
| context| TurnContext | A TurnContext representing the current incoming message and environment. (not used)
| activities|  | An array of outgoing activities to be sent back to the messaging API.<br/>





