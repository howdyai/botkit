# Botkit for the Web Class Reference

[&larr; Botkit Documentation](..)  [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-websocket](https://github.com/howdyai/botkit/tree/next/packages/botbuilder-adapter-websocket) package.

## Classes


* <a href="#WebsocketAdapter">WebsocketAdapter</a>


---

<a name="WebsocketAdapter"></a>
## WebsocketAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to the Web.
It offers both websocket and webhook capabilities.
Requires a compatible chat client - generate one using the Botkit yeoman generator, or find it [here]()
# TODO: get links for chat client!

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-websocket
```

Then import this and other classes into your code:
```javascript
const { WebsocketAdapter } = require('botbuilder-adapter-websocket');
```

This class includes:
* [continueConversation(#continueConversation)

* [createSocketServer(#createSocketServer)

* [init(#init)

* [processActivity(#processActivity)

* [sendActivities(#sendActivities)




### Create a new WebsocketAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| socketServerOptions |  | an optional object containing parameters to send to a call to [WebSocket.server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).<br/>

Create an adapter to handle incoming messages from a websocket and/or webhook and translate them into a standard format for processing by your bot.

To use with Botkit:
```javascript
const adapter = new WebsocketAdapter();
const controller = new Botkit({
     adapter: adapter,
     // other options
});
```

To use with BotBuilder:
```javascript
const adapter = new WebsocketAdapter();
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

## WebsocketAdapter Class Methods
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



<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Calls createSocketServer to bind a websocket listener to Botkit's pre-existing webserver.

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
| context| TurnContext | A TurnContext representing the current incoming message and environment. (not used)
| activities|  | An array of outgoing activities to be sent back to the messaging API.<br/>





