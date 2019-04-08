# Botkit for the Web Class Reference

## Classes


* <a href="#WebsocketAdapter">WebsocketAdapter</a>

## Interfaces


---

<a name="WebsocketAdapter"></a>
## WebsocketAdapter
Create a websocket adapter for Botkit or BotBuilder
Requires a compatible chat client - generate one using the Botkit yeoman generator, or find it [here]()
# TODO: get links for chat client!

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
// instead of binding processActivity to the incoming request, pass in turn handler logic to createWebSocketServer
adapter.createWebSocketServer(server, async(context) => {
 // handle turn here
});
```

### constructor new WebsocketAdapter()
Create a new websocket adapter. No parameters required, though Botkit must have a fully configured


**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| name | string | Name used to register this adapter with Botkit.
| wss | any | The websocket server.

<a name="continueConversation"></a>
### continueConversation()


**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | 
| logic|  | 



<a name="createSocketServer"></a>
### createSocketServer()
Bind a websocket listener to an existing webserver object.
Note: Create the server using Node's http.createServer - NOT an Express or Restify object.

**Parameters**

| Argument | Type | description
|--- |--- |---
| server| any | an http server<br/>
| logic| any | 



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | 



<a name="init"></a>
### init()
Called automatically when Botkit uses this adapter - calls createSocketServer and binds a websocket listener to Botkit's pre-existing webserver.

**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | <br/>



<a name="processActivity"></a>
### processActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | 
| res| any | 
| logic|  | 



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






