# Botkit for Webex Teams Class Reference

## Classes


* <a href="#WebexAdapter">WebexAdapter</a>

## Interfaces


---

<a name="WebexAdapter"></a>
## WebexAdapter

### constructor new WebexAdapter()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | any | 

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



<a name="registerWebhookSubscription"></a>
### registerWebhookSubscription()


**Parameters**

| Argument | Type | description
|--- |--- |---
| webhook_path| any | 



<a name="resetWebhookSubscriptions"></a>
### resetWebhookSubscriptions()



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






