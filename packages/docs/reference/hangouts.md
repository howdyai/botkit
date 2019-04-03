<a name="HangoutsAdapter"></a>
## HangoutsAdapter

### constructor new HangoutsAdapter()

**Parameters**

| name | type | description
|--- |--- |---
| options | [HangoutsAdapterOptions](#HangoutsAdapterOptions) | 

**Properties and Accessors**

| name | type | comment
|--- |--- |---
| botkit_worker | [HangoutsBotWorker](#HangoutsBotWorker) | 
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





<a name="HangoutsBotWorker"></a>
## HangoutsBotWorker

### constructor new HangoutsBotWorker()

**Parameters**

| name | type | description
|--- |--- |---
| botkit | any | 
| config | any | 


<a name="deleteMessage"></a>
### deleteMessage()


**Parameters**

| name | type | description
|--- |--- |---
| update| Partial | 



<a name="replyInThread"></a>
### replyInThread()


**Parameters**

| name | type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithNew"></a>
### replyWithNew()


**Parameters**

| name | type | description
|--- |--- |---
| src| any | 
| resp| Partial | 



<a name="replyWithUpdate"></a>
### replyWithUpdate()


**Parameters**

| name | type | description
|--- |--- |---
| src| any | 
| resp| Partial | 



<a name="startConversationInThread"></a>
### startConversationInThread()


**Parameters**

| name | type | description
|--- |--- |---
| spaceName| string | 
| userId| string | 
| threadKey (optional)| string | 



<a name="updateMessage"></a>
### updateMessage()


**Parameters**

| name | type | description
|--- |--- |---
| update| Partial | 







<a name="HangoutsAdapterOptions"></a>
## Interface HangoutsAdapterOptions


**Fields**

| name | type | comment
|--- |--- |---
| google_auth_params | any | 
| token | string | 

