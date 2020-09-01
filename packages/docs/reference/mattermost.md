# Botkit for Mattermost Class Reference

[&larr; Botkit Documentation](../core.md) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botbuilder-adapter-mattermost](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-mattermost) package.

## Classes


* <a href="#MattermostAdapter" aria-current="page">MattermostAdapter</a>
* <a href="#MattermostBotWorker" aria-current="page">MattermostBotWorker</a>
* <a href="#MattermostDialog" aria-current="page">MattermostDialog</a>
* <a href="#MattermostEventMiddleware" aria-current="page">MattermostEventMiddleware</a>
* <a href="#MattermostMessageTypeMiddleware" aria-current="page">MattermostMessageTypeMiddleware</a>

## Interfaces

* <a href="#MattermostAdapterOptions" aria-current="page">MattermostAdapterOptions</a>

---

<a name="MattermostAdapter"></a>
## MattermostAdapter
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Mattermost.

To use this class in your application, first install the package:
```bash
npm install --save botbuilder-adapter-mattermost
```

Then import this and other classes into your code:
```javascript
const { MattermostAdapter } = require('botbuilder-adapter-mattermost');
```

This class includes the following methods:
* [continueConversation()](#continueConversation)
* [deleteActivity()](#deleteActivity)
* [sendActivities()](#sendActivities)
* [updateActivity()](#updateActivity)



### Create a new MattermostAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [MattermostAdapterOptions](#MattermostAdapterOptions) | An object containing API credentials, a webhook verification token and other options<br/>

Create a Mattermost adapter.

[Read here for more information about all the ways to configure the MattermostAdapter &rarr;](../../botbuilder-adapter-mattermost/readme.md).

Use with Botkit:
```javascript
const adapter = new MattermostAdapter({
    host: process.env.MATTERMOST_HOST,
    port: process.env.MATTERMOST_PORT,
    botToken: process.env.MATTERMOST_TOKEN
});
const controller = new Botkit({
    adapter: adapter,
    // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new MattermostAdapter({
    host: process.env.MATTERMOST_HOST,
    port: process.env.MATTERMOST_PORT,
    botToken: process.env.MATTERMOST_TOKEN
});
// set up restify...
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
adapter.connectMattermost(async(context) => {
 // handle turn here
});
```

## MattermostAdapter Class Methods
<a name="connectMattermost"></a>
### connectMattermost()
Bind a websocket listener to an existing webserver object.
Note: Create the server using Node's http.createServer

**Parameters**

| Argument | Type | description
|--- |--- |---
| logic| any | a turn handler function in the form `async(context)=>{ ... }` that will handle the bot's logic.<br/>



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
Standard BotBuilder adapter method to delete a previous message.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| reference| Partial&lt;ConversationReference&gt; | An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of mattermost channel>}}`<br/>



<a name="init"></a>
### init()
Botkit-only: Initialization function called automatically when used with Botkit.
     * Calls connectMattermost to connect to Mattermost's WebSocket API.

**Parameters**

| Argument | Type | description
|--- |--- |---
| botkit| any | <br/>



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
Standard BotBuilder adapter method to update a previous message with new content.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| activity| Partial&lt;Activity&gt; | The updated activity in the form `{id: <id of activity to update>, ...}`<br/>





<a name="MattermostAdapterOptions"></a>
## Interface MattermostAdapterOptions
This interface defines the options that can be passed into the MattermostAdapter constructor function.

**Fields**

| Name | Type | Description
|--- |--- |---
| host | string | Mattermost host<br/>
| port | number | Mattermost port<br/>
| botToken | string | A token (provided by Mattermost) for a bot to work on a single team<br/>
