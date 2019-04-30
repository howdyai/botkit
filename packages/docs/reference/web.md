# Botkit for the Web Class Reference

[&larr; Botkit Documentation](..) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-web](https://github.com/howdyai/botkit/tree/next/packages/botbuilder-adapter-web) package.

## Classes


* <a href="#WebAdapter" aria-current="page">WebAdapter</a>


---

<a name="WebAdapter"></a>
## WebAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to the Web.
It offers both websocket and webhook capabilities.
To use this adapter, you will need a compatible chat client - generate one using the [Botkit yeoman generator](https://npmjs.com/package/generator-botkit),
or use [the one included in the project repo here.](https://github.com/howdyai/botkit/tree/next/packages/botbuilder-adapter-web/client)

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
* [init()](#init)
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


<a name="createSocketServer"></a>
### createSocketServer()
Bind a websocket listener to an existing webserver object.
Note: Create the server using Node's http.createServer


<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Calls createSocketServer to bind a websocket listener to Botkit's pre-existing webserver.


<a name="processActivity"></a>
### processActivity()
Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.


<a name="sendActivities"></a>
### sendActivities()
Standard BotBuilder adapter method to send a message from the bot to the messaging API.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).




