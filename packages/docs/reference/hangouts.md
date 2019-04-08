# Botkit for Hangouts Class Reference

## Classes


* <a href="#HangoutsAdapter">HangoutsAdapter</a>
* <a href="#HangoutsBotWorker">HangoutsBotWorker</a>

## Interfaces

* <a href="#HangoutsAdapterOptions">HangoutsAdapterOptions</a>

---

<a name="HangoutsAdapter"></a>
## HangoutsAdapter
Connect Botkit or BotBuilder to Google Hangouts.

Use with Botkit:
```javascript
const adapter = new HangoutsAdapter({
 token: process.env.GOOGLE_TOKEN,
 google_auth_params: {
     credentials: process.env.GOOGLE_CREDS
 }
});
const controller = new Botkit({
 adapter: adapter,
 // ... other configuration
});
```

Use with BotBuilder:
```javascript
const adapter = new HangoutsAdapter({
 token: process.env.GOOGLE_TOKEN,
 google_auth_params: {
     credentials: process.env.GOOGLE_CREDS
 }
});
// set up restify...
const server = restify.createServer();
server.post('/api/messages', (req, res) => {
 adapter.processActivity(req, res, async(context) => {

     // do your bot logic here!

 });
});
```

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
| logic|  | <br/>



<a name="deleteActivity"></a>
### deleteActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| reference| Partial&lt;ConversationReference&gt; | <br/>



<a name="processActivity"></a>
### processActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| req| any | 
| res| any | 
| logic|  | <br/>



<a name="sendActivities"></a>
### sendActivities()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activities|  | <br/>



<a name="updateActivity"></a>
### updateActivity()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| activity| Partial&lt;Activity&gt; | <br/>




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
| google_auth_params |  | Parameters passed to the [Google API client library](https://www.npmjs.com/package/googleapis) which is in turn used to send messages.<br/>Define auth options per [the GoogleAuthOptions defined here](https://github.com/googleapis/google-auth-library-nodejs/blob/master/src/auth/googleauth.ts#L54)<br/>OR, specify GOOGLE_APPLICATION_CREDENTIALS in environment [as described in the Google docs](https://cloud.google.com/docs/authentication/getting-started).<br/>
| token | string | Shared secret token used to validate the origin of incoming webhooks.<br/>Get this from the [Google API console for your bot app](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) - it is found on the Configuration tab under the heading "Verification Token"<br/>
