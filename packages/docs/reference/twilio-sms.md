<a name="TwilioAdapter"></a>
## TwilioAdapter

### constructor new TwilioAdapter()

**Parameters**

| name | type | description
|--- |--- |---
| options | [TwilioAdapterOptions](#TwilioAdapterOptions) | 

**Properties and Accessors**

| name | type | comment
|--- |--- |---
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







<a name="TwilioAdapterOptions"></a>
## Interface TwilioAdapterOptions


**Fields**

| name | type | comment
|--- |--- |---
| account_sid | string | 
| auth_token | string | 
| twilio_number | string | 
| validation_url | string | 

