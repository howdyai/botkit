# Botkit for Twilio SMS Class Reference

## Classes


* <a href="#TwilioAdapter">TwilioAdapter</a>

## Interfaces

* <a href="#TwilioAdapterOptions">TwilioAdapterOptions</a>

---

<a name="TwilioAdapter"></a>
## TwilioAdapter

### constructor new TwilioAdapter()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | [TwilioAdapterOptions](#TwilioAdapterOptions) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
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






<a name="TwilioAdapterOptions"></a>
## Interface TwilioAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| account_sid | string | 
| auth_token | string | 
| twilio_number | string | 
| validation_url | string | 
