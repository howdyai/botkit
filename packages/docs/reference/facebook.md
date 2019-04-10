# Botkit for Facebook Class Reference

## Classes


* <a href="#FacebookAPI">FacebookAPI</a>
* <a href="#FacebookAdapter">FacebookAdapter</a>
* <a href="#FacebookBotWorker">FacebookBotWorker</a>
* <a href="#FacebookEventTypeMiddleware">FacebookEventTypeMiddleware</a>

## Interfaces

* <a href="#FacebookAdapterOptions">FacebookAdapterOptions</a>

---

<a name="FacebookAPI"></a>
## FacebookAPI

### constructor new FacebookAPI()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| token | string | 
| api_host | string | 
| api_version | string | 


<a name="callAPI"></a>
### callAPI()


**Parameters**

| Argument | Type | description
|--- |--- |---
| uri| string | 
| method| string | 
| payload| any | 




<a name="FacebookAdapter"></a>
## FacebookAdapter

### constructor new FacebookAdapter()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [FacebookAdapterOptions](#FacebookAdapterOptions) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| middlewares | any | 
| name | string | 

<a name="continueConversation"></a>
### continueConversation()


**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | 
| logic|  | 



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | 



<a name="getAPI"></a>
### getAPI()
Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any bot worker instances.

**Parameters**

| Argument | Type | description
|--- |--- |---
| activity| Partial&lt;Activity&gt; | An incoming message activity<br/>



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




<a name="FacebookBotWorker"></a>
## FacebookBotWorker




<a name="FacebookEventTypeMiddleware"></a>
## FacebookEventTypeMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| any | 
| next| any | 






<a name="FacebookAdapterOptions"></a>
## Interface FacebookAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| access_token | string | 
| api_host | string | 
| app_secret | string | 
| getAccessTokenForPage |  | 
| verify_token | string | 
