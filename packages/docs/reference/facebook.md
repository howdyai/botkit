<a name="FacebookAPI"></a>
## FacebookAPI

### constructor new FacebookAPI()

**Parameters**

| name | type | description
|--- |--- |---
| token | string | 
| api_host | string | 
| api_version | string | 


<a name="callAPI"></a>
### callAPI()


**Parameters**

| name | type | description
|--- |--- |---
| uri| string | 
| method| string | 
| payload| any | 





<a name="FacebookAdapter"></a>
## FacebookAdapter

### constructor new FacebookAdapter()

**Parameters**

| name | type | description
|--- |--- |---
| options | [FacebookAdapterOptions](#FacebookAdapterOptions) | 

**Properties and Accessors**

| name | type | comment
|--- |--- |---
| botkit_worker | [FacebookBotWorker](#FacebookBotWorker) | 
| menu | any | 
| middlewares | any | 
| name | string | 
| web | any | 

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



<a name="processActivity"></a>
### processActivity()


**Parameters**

| name | type | description
|--- |--- |---
| req| any | 
| res| any | 
| logic| any | 



<a name="processSingleMessage"></a>
### processSingleMessage()


**Parameters**

| name | type | description
|--- |--- |---
| message| any | 
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





<a name="FacebookBotWorker"></a>
## FacebookBotWorker

### constructor new FacebookBotWorker()

**Parameters**

| name | type | description
|--- |--- |---
| botkit | any | 
| config | any | 




<a name="FacebookEventTypeMiddleware"></a>
## FacebookEventTypeMiddleware



<a name="onTurn"></a>
### onTurn()


**Parameters**

| name | type | description
|--- |--- |---
| context| any | 
| next| any | 







<a name="FacebookAdapterOptions"></a>
## Interface FacebookAdapterOptions


**Fields**

| name | type | comment
|--- |--- |---
| access_token | string | 
| api_host | string | 
| app_secret | string | 
| verify_token | string | 

