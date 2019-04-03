# Botkit for Hangouts Class Reference

## Classes


* <a href="#HangoutsAdapter">HangoutsAdapter</a>

* <a href="#HangoutsBotWorker">HangoutsBotWorker</a>


## Interfaces

* <a href="#HangoutsAdapterOptions">HangoutsAdapterOptions</a>


---

<a name="HangoutsAdapter"></a>
## HangoutsAdapter

### constructor new HangoutsAdapter()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [HangoutsAdapterOptions](#HangoutsAdapterOptions) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit_worker | [HangoutsBotWorker](#HangoutsBotWorker) | 
| menu | any | 
| middlewares | any | 
| name | string | 
| web | any | 

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




<a name="HangoutsBotWorker"></a>
## HangoutsBotWorker

### constructor new HangoutsBotWorker()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | any | 
| config | any | 


<a name="deleteMessage"></a>
### deleteMessage()


**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial | 



<a name="replyInThread"></a>
### replyInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithNew"></a>
### replyWithNew()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| Partial | 



<a name="replyWithUpdate"></a>
### replyWithUpdate()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| Partial | 



<a name="startConversationInThread"></a>
### startConversationInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| spaceName| string | 
| userId| string | 
| threadKey (optional)| string | 



<a name="updateMessage"></a>
### updateMessage()


**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial | 






<a name="HangoutsAdapterOptions"></a>
## Interface HangoutsAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| google_auth_params | any | 
| token | string | 
