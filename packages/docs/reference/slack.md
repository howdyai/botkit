# Botkit for Slack Class Reference

## Classes


* <a href="#SlackAdapter">SlackAdapter</a>
* <a href="#SlackBotWorker">SlackBotWorker</a>
* <a href="#SlackDialog">SlackDialog</a>
* <a href="#SlackEventMiddleware">SlackEventMiddleware</a>
* <a href="#SlackIdentifyBotsMiddleware">SlackIdentifyBotsMiddleware</a>
* <a href="#SlackMessageTypeMiddleware">SlackMessageTypeMiddleware</a>

## Interfaces

* <a href="#SlackAdapterOptions">SlackAdapterOptions</a>

---

<a name="SlackAdapter"></a>
## SlackAdapter
Connect Botkit or BotBuilder to Slack. See [SlackAdapterOptions](#SlackAdapterOptions) for parameters.
The SlackAdapter can be used in 2 modes: as an "internal" app connected to a single Slack workspace,
or as a "multi-team" app that uses oauth to connect to multiple workspaces. [Read here for more information](../../botbuilder-adapter-slack/readme.md).

Use with Botkit:
```javascript
const adapter = new SlackAdapter({
     clientSigningSecret: process.env.SLACK_SECRET,
     botToken: process.env.SLACK_TOKEN
});
const controller = new Botkit({
     adapter: adapter,
     // ... other configuration options
});
```

Use with BotBuilder:
```javascript
const adapter = new SlackAdapter({
     clientSigningSecret: process.env.SLACK_SECRET,
     botToken: process.env.SLACK_TOKEN
});
// set up restify...
const server = restify.createServer();
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         // do your bot logic here!
     });
});
```

### constructor new SlackAdapter()
Create a Slack adapter. See [SlackAdapterOptions](#slackadapteroptions) for a full definition of the allowed parameters.

```javascript
const adapter = new SlackAdapter({
     clientSigningSecret: process.env.SLACK_SECRET,

// if single team
     botToken: process.env.SLACK_TOKEN

// if multi-team
    clientId: process.env.clientId, // oauth client id
    clientSecret: process.env.clientSecret, // oauth client secret
    scopes: ['bot'], // oauth scopes requested
    redirectUri: process.env.redirectUri, // url to redirect post login defaults to `https://<mydomain>/install/auth`
    getTokenForTeam: async(team_id) => Promise<string>, // function that returns a token based on team id
    getBotUserByTeam: async(team_id) => Promise<string>, // function that returns a bot's user id based on team id
});
```


**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [SlackAdapterOptions](#SlackAdapterOptions) | An object containing API credentials, a webhook verification token and other options<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [SlackBotWorker](#SlackBotWorker) | A customized BotWorker object that exposes additional utility methods.
| middlewares | any | Object containing one or more Botkit middlewares to bind automatically.
| name | string | Name used by Botkit plugin loader

<a name="activityToSlack"></a>
### activityToSlack()


**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| any | 



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
| reference| Partial&lt;ConversationReference&gt; | An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`<br/>



<a name="getAPI"></a>
### getAPI()
Get a Slack API client with the correct credentials based on the team identified in the incoming activity.
This is used by many internal functions to get access to the Slack API, and is exposed as `bot.api` on any bot worker instances.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



<a name="getBotUserByTeam"></a>
### getBotUserByTeam()


**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Activity | 



<a name="getInstallLink"></a>
### getInstallLink()



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
Standard BotBuilder adapter method to update a previous message with new content.
[BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).

**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | A TurnContext representing the current incoming message and environment.
| activity| Partial&lt;Activity&gt; | The updated activity in the form `{id: <id of activity to update>, ...}`<br/>



<a name="validateOauthCode"></a>
### validateOauthCode()


**Parameters**

| Argument | Type | description
|--- |--- |---
| code| string | 




<a name="SlackBotWorker"></a>
## SlackBotWorker

### constructor new SlackBotWorker()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | any | 
| config | any | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| api | WebClient | 

<a name="dialogError"></a>
### dialogError()


**Parameters**

| Argument | Type | description
|--- |--- |---
| errors| any | 



<a name="replyEphemeral"></a>
### replyEphemeral()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyInThread"></a>
### replyInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyInteractive"></a>
### replyInteractive()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyPrivate"></a>
### replyPrivate()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyPublic"></a>
### replyPublic()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithDialog"></a>
### replyWithDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| dialog_obj| Dialog | 



<a name="startConversationInChannel"></a>
### startConversationInChannel()


**Parameters**

| Argument | Type | description
|--- |--- |---
| channelId| string | 
| userId| string | 



<a name="startConversationInThread"></a>
### startConversationInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| channelId| string | 
| userId| string | 
| thread_ts| string | 



<a name="startPrivateConversation"></a>
### startPrivateConversation()


**Parameters**

| Argument | Type | description
|--- |--- |---
| userId| string | 




<a name="SlackDialog"></a>
## SlackDialog

### constructor new SlackDialog()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| title | string | 
| callback_id | string | 
| submit_label | string | 
| elements | string | 


<a name="addEmail"></a>
### addEmail()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addNumber"></a>
### addNumber()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addSelect"></a>
### addSelect()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| option_list| any | 
| options| any | 



<a name="addTel"></a>
### addTel()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addText"></a>
### addText()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label|  | 
| name| string | 
| value| string | 
| options|  | 
| subtype (optional)| string | 



<a name="addTextarea"></a>
### addTextarea()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 
| subtype| any | 



<a name="addUrl"></a>
### addUrl()


**Parameters**

| Argument | Type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="asObject"></a>
### asObject()



<a name="asString"></a>
### asString()



<a name="callback_id"></a>
### callback_id()


**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | 



<a name="notifyOnCancel"></a>
### notifyOnCancel()


**Parameters**

| Argument | Type | description
|--- |--- |---
| set| boolean | 



<a name="state"></a>
### state()


**Parameters**

| Argument | Type | description
|--- |--- |---
| v| any | 



<a name="submit_label"></a>
### submit_label()


**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | 



<a name="title"></a>
### title()


**Parameters**

| Argument | Type | description
|--- |--- |---
| v| string | 




<a name="SlackEventMiddleware"></a>
## SlackEventMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| next|  | 




<a name="SlackIdentifyBotsMiddleware"></a>
## SlackIdentifyBotsMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| any | 
| next| any | 




<a name="SlackMessageTypeMiddleware"></a>
## SlackMessageTypeMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| next|  | 






<a name="SlackAdapterOptions"></a>
## Interface SlackAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| botToken | string | 
| clientId | string | 
| clientSecret | string | 
| clientSigningSecret | string | 
| getBotUserByTeam |  | 
| getTokenForTeam |  | 
| redirectUri | string | 
| scopes |  | 
| verificationToken | string | 
