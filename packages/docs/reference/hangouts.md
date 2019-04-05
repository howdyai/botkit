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




<a name="HangoutsBotWorker"></a>
## HangoutsBotWorker



<a name="deleteMessage"></a>
### deleteMessage()
Delete an existing message

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object containing {id}<br/>



<a name="replyInThread"></a>
### replyInThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | 
| resp| any | 



<a name="replyWithNew"></a>
### replyWithNew()
Reply to a card_click event with a new message

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



<a name="replyWithUpdate"></a>
### replyWithUpdate()
Reply to a card_click event by updating the original message

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| any | An incoming event object representing a card_clicked event
| resp| Partial&lt;BotkitMessage&gt; | A reply message containing text and/or cards<br/>



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
Update an existing message with a new version

**Parameters**

| Argument | Type | description
|--- |--- |---
| update| Partial&lt;BotkitMessage&gt; | An object containing {id, text, cards}<br/>






<a name="HangoutsAdapterOptions"></a>
## Interface HangoutsAdapterOptions


**Fields**

| Name | Type | Description
|--- |--- |---
| google_auth_params | any | 
| token | string | 
