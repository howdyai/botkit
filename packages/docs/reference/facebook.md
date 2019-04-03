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
| botkit_worker | [FacebookBotWorker](#FacebookBotWorker) | 
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



<a name="processSingleMessage"></a>
### processSingleMessage()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 
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





<a name="FacebookBotWorker"></a>
## FacebookBotWorker

### constructor new FacebookBotWorker()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | any | 
| config | any | 




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
| verify_token | string | 

