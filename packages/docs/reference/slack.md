# Botkit for Slack Class Reference

## Classes

* <a href="#SlackAdapter">SlackAdapter</a>
* <a href="#SlackBotWorker">SlackBotWorker</a>
* <a href="#SlackDialog">SlackDialog</a>
* <a href="#SlackEventMiddleware">SlackEventMiddleware</a>
* <a href="#SlackIdentifyBotsMiddleware">SlackIdentifyBotsMiddleware</a>
* <a href="#SlackMessageTypeMiddleware">SlackMessageTypeMiddleware</a>

## Interfaces
* <a href="#AuthTestResult">AuthTestResult</a>
* <a href="#ChatPostMessageResult">ChatPostMessageResult</a>
* <a href="#SlackAdapterOptions">SlackAdapterOptions</a>

---

<a name="SlackAdapter"></a>
## SlackAdapter

### constructor new SlackAdapter()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [SlackAdapterOptions](#SlackAdapterOptions) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [SlackBotWorker](#SlackBotWorker) | 
| menu | any | 
| middlewares | any | 
| name | string | 
| web | any | 

<a name="activityToSlack"></a>
### activityToSlack()


**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| any | 



<a name="continueConversation"></a>
### continueConversation()


**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| ConversationReference | 
| logic|  | 



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| ConversationReference | 



<a name="getAPI"></a>
### getAPI()


**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Activity | 



<a name="getBotUserByTeam"></a>
### getBotUserByTeam()


**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Activity | 



<a name="getInstallLink"></a>
### getInstallLink()



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
| logic| any | 



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
| activity| Activity | 



<a name="validateOauthCode"></a>
### validateOauthCode()


**Parameters**

| Argument | Type | description
|--- |--- |---
| code| string | 



<a name="verifySignature"></a>
### verifySignature()


**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | 
| res| any | 





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
| title | any | 
| callback_id | any | 
| submit_label | any | 
| elements | any | 


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
| label| any | 
| name| any | 
| value| any | 
| options| any | 
| subtype| any | 



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
| v| any | 



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
| v| any | 



<a name="title"></a>
### title()


**Parameters**

| Argument | Type | description
|--- |--- |---
| v| any | 





<a name="SlackEventMiddleware"></a>
## SlackEventMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| any | 
| next| any | 





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
| context| any | 
| next| any | 







<a name="AuthTestResult"></a>
## Interface AuthTestResult


**Fields**

| Name | Type | Description
|--- |--- |---
| ok | boolean | 
| team | string | 
| team_id | string | 
| user | string | 
| user_id | string | 

<a name="ChatPostMessageResult"></a>
## Interface ChatPostMessageResult


**Fields**

| Name | Type | Description
|--- |--- |---
| channel | string | 
| message |  | 
| ts | string | 

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

