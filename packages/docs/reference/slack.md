<a name="SlackAdapter"></a>
## SlackAdapter

### constructor new SlackAdapter()

**Parameters**
| name | type | description
|--- |--- |---
| options | [SlackAdapterOptions](#SlackAdapterOptions) | 

**Properties and Accessors**
| name | type | comment
|--- |--- |---
| botkit_worker | [SlackBotWorker](#SlackBotWorker) | 
| menu | any | 
| middlewares | any | 
| name | string | 
| web | any | 

<a name="activityToSlack"></a>
### activityToSlack()


**Parameters**
| name | type | description
|--- |--- |---
| activity| any | 



<a name="continueConversation"></a>
### continueConversation()


**Parameters**
| name | type | description
|--- |--- |---
| reference| ConversationReference | 
| logic|  | 



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**
| name | type | description
|--- |--- |---
| context| TurnContext | 
| reference| ConversationReference | 



<a name="getAPI"></a>
### getAPI()


**Parameters**
| name | type | description
|--- |--- |---
| activity| Activity | 



<a name="getBotUserByTeam"></a>
### getBotUserByTeam()


**Parameters**
| name | type | description
|--- |--- |---
| activity| Activity | 



<a name="getInstallLink"></a>
### getInstallLink()



<a name="init"></a>
### init()


**Parameters**
| name | type | description
|--- |--- |---
| botkit| any | 



<a name="processActivity"></a>
### processActivity()


**Parameters**
| name | type | description
|--- |--- |---
| req| any | 
| res| any | 
| logic| any | 



<a name="sendActivities"></a>
### sendActivities()


**Parameters**
| name | type | description
|--- |--- |---
| context| TurnContext | 
| activities|  | 



<a name="updateActivity"></a>
### updateActivity()


**Parameters**
| name | type | description
|--- |--- |---
| context| TurnContext | 
| activity| Activity | 



<a name="validateOauthCode"></a>
### validateOauthCode()


**Parameters**
| name | type | description
|--- |--- |---
| code| string | 



<a name="verifySignature"></a>
### verifySignature()


**Parameters**
| name | type | description
|--- |--- |---
| req| any | 
| res| any | 





<a name="SlackBotWorker"></a>
## SlackBotWorker

### constructor new SlackBotWorker()

**Parameters**
| name | type | description
|--- |--- |---
| botkit | any | 
| config | any | 

**Properties and Accessors**
| name | type | comment
|--- |--- |---
| api | WebClient | 

<a name="dialogError"></a>
### dialogError()


**Parameters**
| name | type | description
|--- |--- |---
| errors| any | 



<a name="replyEphemeral"></a>
### replyEphemeral()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyInThread"></a>
### replyInThread()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyInteractive"></a>
### replyInteractive()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyPrivate"></a>
### replyPrivate()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyPublic"></a>
### replyPublic()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithDialog"></a>
### replyWithDialog()


**Parameters**
| name | type | description
|--- |--- |---
| src| any | 
| dialog_obj| Dialog | 



<a name="startConversationInChannel"></a>
### startConversationInChannel()


**Parameters**
| name | type | description
|--- |--- |---
| channelId| string | 
| userId| string | 



<a name="startConversationInThread"></a>
### startConversationInThread()


**Parameters**
| name | type | description
|--- |--- |---
| channelId| string | 
| userId| string | 
| thread_ts| string | 



<a name="startPrivateConversation"></a>
### startPrivateConversation()


**Parameters**
| name | type | description
|--- |--- |---
| userId| string | 





<a name="SlackDialog"></a>
## SlackDialog

### constructor new SlackDialog()

**Parameters**
| name | type | description
|--- |--- |---
| title | any | 
| callback_id | any | 
| submit_label | any | 
| elements | any | 


<a name="addEmail"></a>
### addEmail()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addNumber"></a>
### addNumber()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addSelect"></a>
### addSelect()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| option_list| any | 
| options| any | 



<a name="addTel"></a>
### addTel()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 



<a name="addText"></a>
### addText()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 
| subtype| any | 



<a name="addTextarea"></a>
### addTextarea()


**Parameters**
| name | type | description
|--- |--- |---
| label| any | 
| name| any | 
| value| any | 
| options| any | 
| subtype| any | 



<a name="addUrl"></a>
### addUrl()


**Parameters**
| name | type | description
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
| name | type | description
|--- |--- |---
| v| any | 



<a name="notifyOnCancel"></a>
### notifyOnCancel()


**Parameters**
| name | type | description
|--- |--- |---
| set| boolean | 



<a name="state"></a>
### state()


**Parameters**
| name | type | description
|--- |--- |---
| v| any | 



<a name="submit_label"></a>
### submit_label()


**Parameters**
| name | type | description
|--- |--- |---
| v| any | 



<a name="title"></a>
### title()


**Parameters**
| name | type | description
|--- |--- |---
| v| any | 





<a name="SlackEventMiddleware"></a>
## SlackEventMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**
| name | type | description
|--- |--- |---
| context| any | 
| next| any | 





<a name="SlackIdentifyBotsMiddleware"></a>
## SlackIdentifyBotsMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**
| name | type | description
|--- |--- |---
| context| any | 
| next| any | 





<a name="SlackMessageTypeMiddleware"></a>
## SlackMessageTypeMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**
| name | type | description
|--- |--- |---
| context| any | 
| next| any | 







<a name="AuthTestResult"></a>
## Interface AuthTestResult


**Fields**
| name | type | comment
|--- |--- |---
| ok | boolean | 
| team | string | 
| team_id | string | 
| user | string | 
| user_id | string | 

<a name="ChatPostMessageResult"></a>
## Interface ChatPostMessageResult


**Fields**
| name | type | comment
|--- |--- |---
| channel | string | 
| message |  | 
| ts | string | 

<a name="SlackAdapterOptions"></a>
## Interface SlackAdapterOptions


**Fields**
| name | type | comment
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

