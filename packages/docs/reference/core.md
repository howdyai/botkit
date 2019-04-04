# Botkit Class Reference

## Classes


* <a href="#BotWorker">BotWorker</a>
* <a href="#Botkit">Botkit</a>
* <a href="#BotkitCMSHelper">BotkitCMSHelper</a>
* <a href="#BotkitConversation">BotkitConversation</a>
* <a href="#BotkitConversationState">BotkitConversationState</a>
* <a href="#BotkitDialogWrapper">BotkitDialogWrapper</a>
* <a href="#BotkitPluginLoader">BotkitPluginLoader</a>

## Interfaces

* <a href="#BotkitConfiguration">BotkitConfiguration</a>
* <a href="#BotkitConversationStep">BotkitConversationStep</a>
* <a href="#BotkitHandler">BotkitHandler</a>
* <a href="#BotkitMessage">BotkitMessage</a>
* <a href="#BotkitPlugin">BotkitPlugin</a>

---

<a name="BotWorker"></a>
## BotWorker
A base class for a `bot` instance, an object that contains the information and functionality for taking action in response to an incoming message.
Note that adapters are likely to extend this class with additional platform-specific methods - refer to the adapter documentation for these extensions.
### constructor new BotWorker()
Create a new BotWorker instance. Do not call this directly - instead, use [controller.spawn()](core.md#spawn).

**Parameters**

| Argument | Type | Description
|--- |--- |---
| controller | [Botkit](#Botkit) | A pointer to the main Botkit controller
| config | any | An object typically containing { dialogContext, reference, context, activity }<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| controller |  | Get a reference to the main Botkit controller.

<a name="beginDialog"></a>
### beginDialog()
Begin a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.

**Parameters**

| Argument | Type | description
|--- |--- |---
| id| string | id of dialog
| options| any | object containing options to be passed into the dialog<br/>



<a name="changeContext"></a>
### changeContext()
Alter the context in which a bot instance will send messages.
Use this method to create or adjust a bot instance so that it can send messages to a predefined user/channel combination.

**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial&lt;ConversationReference&gt; | A [ConversationReference](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/conversationreference?view=botbuilder-ts-latest), most likely captured from an incoming message and stored for use in proactive messaging scenarios.<br/>



```javascript
// get the reference field and store it.
const saved_reference = message.reference;

// later on...
let bot = await controller.spawn();
bot.changeContext(saved_reference);
bot.say('Hello!');
```


<a name="ensureMessageFormat"></a>
### ensureMessageFormat()
Take a crudely-formed Botkit message with any sort of field (may just be a string, may be a partial message object)
and map it into a beautiful BotFramework Activity.
Any fields not found in the Activity definition will be moved to activity.channelData.

**Parameters**

| Argument | Type | description
|--- |--- |---
| message| Partial&lt;BotkitMessage&gt; | 


**Returns**

a properly formed Activity object




<a name="getConfig"></a>
### getConfig()
Get a value from the BotWorker's configuration.

**Parameters**

| Argument | Type | description
|--- |--- |---
| key (optional)| string | The name of a value stored in the configuration


**Returns**

The value stored in the configuration (or null if absent)




```javascript
let original_context = bot.getConfig('context');
await original_context.sendActivity('send directly using the adapter instead of Botkit');
```


<a name="httpBody"></a>
### httpBody()
Set the http response body for this turn.
Use this to define the response value when the platform requires a synchronous response to the incoming webhook.

**Parameters**

| Argument | Type | description
|--- |--- |---
| body| any | (any) a value that will be returned as the http response body<br/>



Example handling of a /slash command from Slack:
```javascript
controller.on('slash_command', async(bot, message) {
 bot.httpBody('This is a reply to the slash command.');
})
```


<a name="httpStatus"></a>
### httpStatus()
Set the http response status code for this turn

**Parameters**

| Argument | Type | description
|--- |--- |---
| status| number | a valid http status code like 200 202 301 500 etc<br/>



```javascript
controller.on('event', async(bot, message) => {
  // respond with a 500 error code for some reason!
  bot.httpStatus(500);
});
```


<a name="reply"></a>
### reply()
Reply to an incoming message.
Message will be sent using the context attached to the source message, which may be different than the context used to spawn the bot.

**Parameters**

| Argument | Type | description
|--- |--- |---
| src| Partial&lt;BotkitMessage&gt; | An incoming message, usually passed in to a handler function
| resp| Partial&lt;BotkitMessage&gt; | A string containing the text of a reply, or more fully formed message object


**Returns**

Return value will contain the results of the send action, typically &#x60;{id: &lt;id of message&gt;}&#x60;




```javascript
controller.on('event', async(bot, message) => {

 await bot.reply(message, 'I received an event and am replying to it.');

});
```


<a name="say"></a>
### say()
Send a message.
Message will be sent using the context originally passed in to `controller.spawn()`.
Primarily used for sending proactive messages, in concert with [changeContext()](#changecontext).

**Parameters**

| Argument | Type | description
|--- |--- |---
| message| Partial&lt;BotkitMessage&gt; | A string containing the text of a reply, or more fully formed message object


**Returns**

Return value will contain the results of the send action, typically &#x60;{id: &lt;id of message&gt;}&#x60;




```javascript
controller.on('event', async(bot, message) => {

 await bot.say('I received an event!');

});
```


<a name="Botkit"></a>
## Botkit
Create a new instance of Botkit to define the controller for a conversational app.
To connect Botkit to a chat platform, pass in a fully configured `adapter`.
If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.
### constructor new Botkit()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | [BotkitConfiguration](#BotkitConfiguration) | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| PATH | string | The path of the main Botkit SDK, used to generate relative paths
| adapter | any | A BotBuilder-compatible adapter - defaults to a Bot Framework adapter
| cms | [BotkitCMSHelper](#BotkitCMSHelper) | provides an interface to interact with an instance of Botkit CMS
| dialogSet | DialogSet | A BotBuilder DialogSet that serves as the top level dialog container for the Botkit app
| http | any | A direct reference to the underlying HTTP server object
| plugins | [BotkitPluginLoader](#BotkitPluginLoader) | Provides an interface to interact with external Botkit plugins
| storage | Storage | a BotBuilder storage driver - defaults to MemoryStorage
| version | string | The current version of Botkit Core
| webserver | any | An Express webserver

<a name="addDep"></a>
### addDep()
(For use by plugins only) - Add a dependency to Botkit's bootup process that must be marked as completed using `completeDep()`.
Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.

**Parameters**

| Argument | Type | description
|--- |--- |---
| name| string | The name of the dependency that is being loaded.<br/>



For example, a plugin that needs to do an asynchronous task before Botkit proceeds might do:
```javascript
controller.addDep('my_async_plugin');
somethingAsync().then(function() {
 controller.completeDep('my_async_plugin');
});
```


<a name="completeDep"></a>
### completeDep()
(For use by plugins only) - Mark a bootup dependency as loaded and ready to use
Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.

**Parameters**

| Argument | Type | description
|--- |--- |---
| name| string | The name of the dependency that has completed loading.<br/>



<a name="getConfig"></a>
### getConfig()
Get a value from the configuration.

**Parameters**

| Argument | Type | description
|--- |--- |---
| key (optional)| string | The name of a value stored in the configuration


**Returns**

The value stored in the configuration (or null if absent)




For example:
```javascript
// get entire config object
let config = controller.getConfig();

// get a specific value from the config
let webhook_uri = controller.getConfig('webhook_uri');
```


<a name="handleTurn"></a>
### handleTurn()
Accepts the result of a BotBuilder adapter's `processActivity()` method and processes it into a Botkit-style message and BotWorker instance
which is then used to test for triggers and emit events.
NOTE: This method should only be used in custom adapters that receive messages through mechanisms other than the main webhook endpoint (such as those received via websocket, for example)

**Parameters**

| Argument | Type | description
|--- |--- |---
| turnContext| TurnContext | a TurnContext representing an incoming message, typically created by an adapter's `processActivity()` method.<br/>



<a name="hears"></a>
### hears()
Instruct your bot to listen for a pattern, and do something when that pattern is heard.
Patterns will be "heard" only if the message is not already handled by an in-progress dialog.
To "hear" patterns _before_ dialogs are processed, use `controller.interrupts()` instead.

**Parameters**

| Argument | Type | description
|--- |--- |---
| patterns|  | One or more string, regular expression, or test function
| events|  | A list of event types that should be evaluated for the given patterns
| handler| [BotkitHandler](#BotkitHandler) | a function that will be called should the pattern be matched<br/>



For example:
```javascript
// listen for a simple keyword
controller.hears('hello','message', async(bot, message) => {
 await bot.reply(message,'I heard you say hello.');
});

// listen for a regular expression
controller.hears(new RegExp(/^[A-Z\s]+$/), 'message', async(bot, message) => {
 await bot.reply(message,'I heard a message IN ALL CAPS.');
});

// listen using a function
controller.hears(async (message) => { return (message.intent === 'hello') }, 'message', async(bot, message) => {
 await bot.reply(message,'This message matches the hello intent.');
});
```

<a name="interrupts"></a>
### interrupts()
Instruct your bot to listen for a pattern, and do something when that pattern is heard.
Interruptions work just like "hears" triggers, but fire _before_ the dialog system is engaged,
and thus handlers will interrupt the normal flow of messages through the processing pipeline.

**Parameters**

| Argument | Type | description
|--- |--- |---
| patterns|  | One or more string, regular expression, or test function
| events|  | A list of event types that should be evaluated for the given patterns
| handler| [BotkitHandler](#BotkitHandler) | a function that will be called should the pattern be matched<br/>



```javascript
controller.interrupts('help','message', async(bot, message) => {

 await bot.reply(message,'Before anything else, you need some help!')

});
```

<a name="loadModule"></a>
### loadModule()
Load a Botkit feature module

**Parameters**

| Argument | Type | description
|--- |--- |---
| p| string | path to module file<br/>



<a name="loadModules"></a>
### loadModules()
Load all Botkit feature modules located in a given folder.

**Parameters**

| Argument | Type | description
|--- |--- |---
| p| string | path to a folder of module files<br/>



```javascript
controller.ready(() => {

 // load all modules from sub-folder features/
 controller.loadModules('./features');

});
```


<a name="on"></a>
### on()
Bind a handler function to one or more events.

**Parameters**

| Argument | Type | description
|--- |--- |---
| events|  | One or more event names
| handler| [BotkitHandler](#BotkitHandler) | a handler function that will fire whenever one of the named events is received.<br/>



```javascript
controller.on('conversationUpdate', async(bot, message) => {

 await bot.reply(message,'I received a conversationUpdate event.');

});
```


<a name="ready"></a>
### ready()
Use `controller.ready()` to wrap any calls that require components loaded during the bootup process.
This will ensure that the calls will not be made until all of the components have successfully been initialized.

**Parameters**

| Argument | Type | description
|--- |--- |---
| handler|  | A function to run when Botkit is booted and ready to run.<br/>



For example:
```javascript
controller.ready(() => {

  controller.loadModules(__dirname + '/features');

});
```


<a name="saveState"></a>
### saveState()
Save the current conversation state pertaining to a given BotWorker's activities.
Note: this is normally called internally and is only required when state changes happen outside of the normal processing flow.

**Parameters**

| Argument | Type | description
|--- |--- |---
| bot| [BotWorker](#BotWorker) | a BotWorker instance created using `controller.spawn()`<br/>



<a name="spawn"></a>
### spawn()
Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
for handling platform-specific events or activities.

**Parameters**

| Argument | Type | description
|--- |--- |---
| config| any | Preferably receives a DialogContext, though can also receive a TurnContext. If excluded, must call `bot.changeContext(reference)` before calling any other method.<br/>



<a name="trigger"></a>
### trigger()
Trigger an event to be fired.  This will cause any bound handlers to be executed.
Note: This is normally used internally, but can be used to emit custom events.

**Parameters**

| Argument | Type | description
|--- |--- |---
| event| string | the name of the event
| bot| [BotWorker](#BotWorker) | a BotWorker instance created using `controller.spawn()`
| message| [BotkitMessage](#BotkitMessage) | An incoming message or event<br/>



```javascript
// fire a custom event
controller.trigger('my_custom_event', bot, message);

// handle the custom event
controller.on('my_custom_event', async(bot, message) => {
 //... do something
});
```



<a name="BotkitCMSHelper"></a>
## BotkitCMSHelper

### constructor new BotkitCMSHelper()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| controller | any | 
| config | any | 


<a name="after"></a>
### after()


**Parameters**

| Argument | Type | description
|--- |--- |---
| script_name| string | 
| handler|  | 



<a name="before"></a>
### before()


**Parameters**

| Argument | Type | description
|--- |--- |---
| script_name| string | 
| thread_name| string | 
| handler|  | 



<a name="loadAllScripts"></a>
### loadAllScripts()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dialogSet| DialogSet | 



<a name="onChange"></a>
### onChange()


**Parameters**

| Argument | Type | description
|--- |--- |---
| script_name| string | 
| variable_name| string | 
| handler|  | 



<a name="testTrigger"></a>
### testTrigger()


**Parameters**

| Argument | Type | description
|--- |--- |---
| bot| any | 
| message| any | 




<a name="BotkitConversation"></a>
## BotkitConversation
An extension on the [BotBuilder Dialog Class](https://docs.microsoft.com/en-us/javascript/api/botbuilder-dialogs/dialog?view=botbuilder-ts-latest) that provides a Botkit-friendly interface for
defining and interacting with multi-message dialogs. Dialogs can be constructed using `say()`, `ask()` and other helper methods.

```javascript
// define the structure of your dialog...
const convo = new BotkitConversation('foo', controller);
convo.say('Hello!');
convo.ask('What is your name?', async(answer, convo, bot) => {
     await bot.say('Your name is ' + answer);
});
controller.dialogSet.add(convo);

// later on, trigger this dialog by its id
controller.on('event', async(bot, message) => {
 await bot.beginDialog('foo');
})
```

### constructor new BotkitConversation()
Create a new BotkitConversation object

**Parameters**

| Argument | Type | Description
|--- |--- |---
| dialogId | string | A unique identifier for this dialog, used to later trigger this dialog
| controller | [Botkit](#Botkit) | A pointer to the main Botkit controller<br/>

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| script | any | A map of every message in the dialog, broken into threads

<a name="addMessage"></a>
### addMessage()
Add a message to a specific thread
Messages added with `say()` and `addMessage()` will _not_ wait for a response, will be sent one after another without a pause.

**Parameters**

| Argument | Type | description
|--- |--- |---
| message|  | Message template to be sent
| thread_name| string | Name of thread to which message will be added<br/>



```javascript
let conversation = new BotkitConversation('welcome', controller);
conversation.say('Hello! Welcome to my app.');
conversation.say('Let us get started...');
// pass in a message with an action that will cause gotoThread to be called...
conversation.say({action: 'continuation'});

conversation.addMessage('This is a different thread completely', 'continuation');
```


<a name="addQuestion"></a>
### addQuestion()
Identical to `ask()`, but accepts the name of a thread to which the question is added.

**Parameters**

| Argument | Type | description
|--- |--- |---
| message|  | a message that will be used as the prompt
| handlers|  | one or more handler functions defining possible conditional actions based on the response to the question
| options|  | 
| thread_name| string | Name of thread to which message will be added<br/>



<a name="after"></a>
### after()
Bind a function to run after the dialog has completed.
The first parameter to the handler will include a hash of all variables set and values collected from the user during the conversation.
The second parameter to the handler is a BotWorker object that can be used to start new dialogs or take other actions.

**Parameters**

| Argument | Type | description
|--- |--- |---
| handler|  | in the form async(results, bot) { ... }<br/>



<a name="ask"></a>
### ask()
Add a question to the default thread.

**Parameters**

| Argument | Type | description
|--- |--- |---
| message|  | a message that will be used as the prompt
| handlers|  | one or more handler functions defining possible conditional actions based on the response to the question
| options|  | <br/>



```javascript
// ask a question, handle the response with a function
convo.ask('What is your name?', async(response, convo, bot) => {
 await bot.say('Oh your name is ' + response);
}, {key: 'name'});

// ask a question, evaluate answer, take conditional action based on response
convo.ask('Do you want to eat a taco?', [
 {
     pattern: 'yes',
     type: 'string',
     handler: async(response, convo, bot) => {
         return await convo.gotoThread('yes_taco');
     }
 },
 {
     pattern: 'no',
     type: 'string',
     handler: async(response, convo, bot) => {
         return await convo.gotoThread('no_taco');
     }
  },s
  {
      default: true,
      handler: async(response, convo, bot) => {
          await bot.say('I do not understand your response!');
          // start over!
          return await convo.repeat();
      }
  }
], {key: 'tacos'});
```


<a name="before"></a>
### before()
Register a handler function that will fire before a given thread begins.
Use this hook to set variables, call APIs, or change the flow of the conversation using `convo.gotoThread`

**Parameters**

| Argument | Type | description
|--- |--- |---
| thread_name| string | A valid thread defined in this conversation
| handler| [BotkitConvoHandler](#BotkitConvoHandler) | A handler function in the form async(convo, bot) => { ... }<br/>



```javascript
convo.addMessage('This is the foo thread: var == {{vars.foo}}', 'foo');
convo.before('foo', async(convo, bot) => {
 // set a variable here that can be used in the message template
 convo.setVar('foo','THIS IS FOO');

});
```


<a name="beginDialog"></a>
### beginDialog()
Called automatically when a dialog begins. Do not call this directly!

**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| DialogContext | the current DialogContext
| options| any | an object containing initialization parameters passed to the dialog. may include `thread` which will cause the dialog to begin with that thread instead of the `default` thread.<br/>



<a name="continueDialog"></a>
### continueDialog()
Called automatically when an already active dialog is continued. Do not call this directly!

**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| DialogContext | the current DialogContext<br/>



<a name="end"></a>
### end()
Automatically called when the the dialog ends and causes any handlers bound using `after()` to fire. Do not call this directly!

**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| DialogContext | The current DialogContext
| value| any | The final value collected by the dialog.<br/>



<a name="onChange"></a>
### onChange()
Bind a function to run whenever a user answers a specific question.  Can be used to validate input and take conditional actions.

**Parameters**

| Argument | Type | description
|--- |--- |---
| variable| string | name of the variable to watch for changes
| handler|  | a handler function that will fire whenever a user's response is used to change the value of the watched variable<br/>



```javascript
convo.ask('What is your name?', async(response, convo, bot) { ... }, {key: 'name'});
convo.onChange('name', async(response, convo, bot) {

 // user changed their name!
 // do something...

});
```

<a name="resumeDialog"></a>
### resumeDialog()
Called automatically when a dialog moves forward a step. Do not call this directly!

**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | The current DialogContext
| reason| any | Reason for resuming the dialog
| result| any | Result of previous step<br/>



<a name="say"></a>
### say()
Add a non-interactive message to the default thread.
Messages added with `say()` and `addMessage()` will _not_ wait for a response, will be sent one after another without a pause.

**Parameters**

| Argument | Type | description
|--- |--- |---
| message|  | Message template to be sent<br/>



```javascript
let conversation = new BotkitConversation('welcome', controller);
conversation.say('Hello! Welcome to my app.');
conversation.say('Let us get started...');
```



<a name="BotkitConversationState"></a>
## BotkitConversationState

### constructor new BotkitConversationState()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| storage | Storage | 
| namespace | string | 


<a name="getStorageKey"></a>
### getStorageKey()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 




<a name="BotkitDialogWrapper"></a>
## BotkitDialogWrapper

### constructor new BotkitDialogWrapper()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| dc | any | 
| step | any | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| vars | __type | 

<a name="gotoThread"></a>
### gotoThread()
Jump immediately to the first message in a different thread.

**Parameters**

| Argument | Type | description
|--- |--- |---
| thread| string | Name of a thread<br/>



<a name="repeat"></a>
### repeat()
Repeat the last message sent on the next turn.


<a name="setVar"></a>
### setVar()
Set the value of a variable that will be available to messages in the conversation.
Equivalent to convo.vars.key = val;
Results in {{vars.key}} being replaced with the value in val.

**Parameters**

| Argument | Type | description
|--- |--- |---
| key| any | the name of the variable
| val| any | the value for the variable<br/>




<a name="BotkitPluginLoader"></a>
## BotkitPluginLoader

### constructor new BotkitPluginLoader()


**Parameters**

| Argument | Type | Description
|--- |--- |---
| botkit | any | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| botkit | [Botkit](#Botkit) | 

<a name="localView"></a>
### localView()


**Parameters**

| Argument | Type | description
|--- |--- |---
| path_to_view| any | 



<a name="publicFolder"></a>
### publicFolder()


**Parameters**

| Argument | Type | description
|--- |--- |---
| alias| any | 
| path| any | 



<a name="register"></a>
### register()


**Parameters**

| Argument | Type | description
|--- |--- |---
| name| any | 
| endpoints| [BotkitPlugin](#BotkitPlugin) | 



<a name="use"></a>
### use()


**Parameters**

| Argument | Type | description
|--- |--- |---
| plugin_or_function|  | 






<a name="BotkitConfiguration"></a>
## Interface BotkitConfiguration
Defines the options used when instantiating Botkit to create the main app controller with `new Botkit(options)`

**Fields**

| Name | Type | Description
|--- |--- |---
| adapter | BotFrameworkAdapter | A fully configured BotBuilder Adapter, such as `botbuilder-adapter-slack` or `botbuilder-adapter-websocket`<br/>The adapter is responsible for translating platform-specific messages into the format understood by Botkit and BotBuilder.<br/>
| adapterConfig |  | If using the BotFramework service, options included in `adapterConfig` will be passed to the new Adapter when created internally.<br/>See [BotFrameworkAdapterSettings](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=azure-node-latest&viewFallbackFrom=botbuilder-ts-latest).<br/>
| authFunction |  | An Express middleware function used to authenticate requests to the /admin URI of your Botkit application.<br/>
| cms |  | A configuration passed to the Botkit CMS helper.<br/>
| storage | Storage | A Storage interface compatible with [this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/storage?view=botbuilder-ts-latest)<br/>Defaults to the ephemeral [MemoryStorage](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/memorystorage?view=botbuilder-ts-latest) implementation.<br/>
| webhook_uri | string | Path used to create incoming webhook URI.  Defaults to `/api/messages`<br/>
| webserver | any | An instance of Express used to define web endpoints.  If not specified, oen will be created internally.<br/>Note: only use your own Express if you absolutely must for some reason. Otherwise, use `controller.webserver`<br/>
<a name="BotkitConversationStep"></a>
## Interface BotkitConversationStep


**Fields**

| Name | Type | Description
|--- |--- |---
| index | number | The number pointing to the current message in the current thread in this dialog's script<br/>
| next |  | A function to call when the step is completed.<br/>
| options | any | A pointer to any options passed into the dialog when it began<br/>
| reason | DialogReason | The reason for this step being called<br/>
| result | any | The results of the previous turn<br/>
| state | any | A pointer to the current dialog state<br/>
| thread | string | The name of the current thread<br/>
| values | any | A pointer directly to state.values<br/>
<a name="BotkitHandler"></a>
## Interface BotkitHandler
A handler function passed into `hears()` or `on()` that receives a [BotWorker](#botworker) instance and a [BotkitMessage](#botkitmessage).  Should be defined as an async function and/or return a Promise.

The form of these handlers should be:
```javascript
async (bot, message) => {
// stuff.
}
```

For example:
```javascript
controller.on('event', async(bot, message) => {
 // do somethign using bot and message like...
 await bot.reply(message,'Received an event.');
});
```


<a name="BotkitMessage"></a>
## Interface BotkitMessage
Defines the expected form of a message or event object being handled by Botkit.
Will also contain any additional fields including in the incoming payload.

**Fields**

| Name | Type | Description
|--- |--- |---
| channel | string | Unique identifier of the room/channel/space in which the message was sent. Typically contains the platform specific designator for that channel.<br/>
| incoming_message | Activity | The original incoming [BotBuilder Activity](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest) object as created by the adapter.<br/>
| reference | ConversationReference | A full [ConversationReference](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/conversationreference?view=botbuilder-ts-latest) object that defines the address of the message and all information necessary to send messages back to the originating location.<br/>Can be stored for later use, and used with [bot.changeContext()](#changeContext) to send proactive messages.<br/>
| text | string | Text of the message sent by the user (or primary value in case of button click)<br/>
| type | string | The type of event, in most cases defined by the messaging channel or adapter<br/>
| user | string | Unique identifier of user who sent the message. Typically contains the platform specific user id.<br/>
<a name="BotkitPlugin"></a>
## Interface BotkitPlugin


**Fields**

| Name | Type | Description
|--- |--- |---
| init |  | 
| menu |  | 
| middlewares | __type | 
| name | string | 
| web |  | 
