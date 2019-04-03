<a name="BotWorker"></a>
## BotWorker

### constructor new BotWorker()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| controller | any | 
| config | any | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| controller |  | 

<a name="beginDialog"></a>
### beginDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| id| any | 
| options| any | 



<a name="changeContext"></a>
### changeContext()


**Parameters**

| Argument | Type | description
|--- |--- |---
| reference| Partial | 



<a name="ensureMessageFormat"></a>
### ensureMessageFormat()
Take a crudely-formed Botkit message with any sort of field
and map it into a beautiful BotFramework activity

**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 



<a name="getConfig"></a>
### getConfig()


**Parameters**

| Argument | Type | description
|--- |--- |---
| key (optional)| string | 



<a name="httpBody"></a>
### httpBody()


**Parameters**

| Argument | Type | description
|--- |--- |---
| body| any | 



<a name="httpStatus"></a>
### httpStatus()


**Parameters**

| Argument | Type | description
|--- |--- |---
| status| number | 



<a name="reply"></a>
### reply()


**Parameters**

| Argument | Type | description
|--- |--- |---
| src| Partial | 
| resp| Partial | 



<a name="say"></a>
### say()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| Partial | 





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
| name| string | The name of the dependency that is being loaded.




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
| name| string | The name of the dependency that has completed loading.




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
| turnContext| TurnContext | a TurnContext representing an incoming message, typically created by an adapter's `processActivity()` method.




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
| handler| [BotkitHandler](#BotkitHandler) | a function that will be called should the pattern be matched




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
| handler| [BotkitHandler](#BotkitHandler) | a function that will be called should the pattern be matched




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
| p| string | path to module file




<a name="loadModules"></a>
### loadModules()
Load all Botkit feature modules located in a given folder.

**Parameters**

| Argument | Type | description
|--- |--- |---
| p| string | path to a folder of module files




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
| handler| [BotkitHandler](#BotkitHandler) | a handler function that will fire whenever one of the named events is received.




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
| handler|  | A function to run when Botkit is booted and ready to run.




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
| bot| [BotWorker](#BotWorker) | a BotWorker instance created using `controller.spawn()`




<a name="spawn"></a>
### spawn()
Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
for handling platform-specific events or activities.

**Parameters**

| Argument | Type | description
|--- |--- |---
| config| any | Preferably receives a DialogContext, though can also receive a TurnContext. If excluded, must call `bot.changeContext(reference)` before calling any other method.




<a name="trigger"></a>
### trigger()
Trigger an event to be fired.  This will cause any bound handlers to be executed.
Note: This is normally used internally, but can be used to emit custom events.

**Parameters**

| Argument | Type | description
|--- |--- |---
| event| string | the name of the event
| bot| [BotWorker](#BotWorker) | a BotWorker instance created using `controller.spawn()`
| message| [BotkitMessage](#BotkitMessage) | An incoming message or event




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

### constructor new BotkitConversation()

**Parameters**

| Argument | Type | Description
|--- |--- |---
| dialogId | string | 
| controller | any | 

**Properties and Accessors**

| Name | Type | Description
|--- |--- |---
| script | any | 

<a name="addMessage"></a>
### addMessage()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 
| thread_name| any | 



<a name="addQuestion"></a>
### addQuestion()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 
| handlers| any | 
| options| any | 
| thread_name| any | 



<a name="after"></a>
### after()


**Parameters**

| Argument | Type | description
|--- |--- |---
| handler|  | 



<a name="ask"></a>
### ask()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 
| handlers| any | 
| options| any | 



<a name="before"></a>
### before()


**Parameters**

| Argument | Type | description
|--- |--- |---
| thread_name| any | 
| handler| any | 



<a name="beginDialog"></a>
### beginDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | 
| options| any | 



<a name="continueDialog"></a>
### continueDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | 



<a name="end"></a>
### end()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| DialogContext | 
| value| any | 



<a name="endDialog"></a>
### endDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| context| TurnContext | 
| instance| DialogInstance | 
| reason| DialogReason | 



<a name="gotoThread"></a>
### gotoThread()


**Parameters**

| Argument | Type | description
|--- |--- |---
| thread| any | 
| dc| any | 
| step| any | 



<a name="onChange"></a>
### onChange()


**Parameters**

| Argument | Type | description
|--- |--- |---
| variable| any | 
| handler| any | 



<a name="onStep"></a>
### onStep()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | 
| step| any | 



<a name="resumeDialog"></a>
### resumeDialog()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | 
| reason| any | 
| result| any | 



<a name="runStep"></a>
### runStep()


**Parameters**

| Argument | Type | description
|--- |--- |---
| dc| any | 
| index| any | 
| thread_name| any | 
| reason| any | 
| result (optional)| any | 



<a name="say"></a>
### say()


**Parameters**

| Argument | Type | description
|--- |--- |---
| message| any | 





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


**Parameters**

| Argument | Type | description
|--- |--- |---
| thread| any | 





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
Configuration options used when instantiating Botkit to create the main app controller.

**Fields**

| Name | Type | Description
|--- |--- |---
| adapter | BotFrameworkAdapter | A fully configured BotBuilder Adapter, such as botbuilder-adapter-slack or botbuilder-adapter-websocket
The adapter is responsible for translating platform-specific messages into the format understood by Botkit and BotBuilder\n
| adapterConfig |  | If using the BotFramework service, options included in `adapterConfig` will be passed to the new Adapter when created internally.
See [BotFrameworkAdapterSettings](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=azure-node-latest&viewFallbackFrom=botbuilder-ts-latest).\n
| authFunction |  | An Express middleware function used to authenticate requests to the /admin URI of your Botkit application.\n
| cms |  | A configuration passed to the Botkit CMS helper.\n
| storage | Storage | A Storage interface compatible with [this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/storage?view=botbuilder-ts-latest)
Defaults to the ephemeral [MemoryStorage](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/memorystorage?view=botbuilder-ts-latest) implementation.\n
| webhook_uri | string | Path used to create incoming webhook URI.  Defaults to /api/messages\n
| webserver | any | An instance of Express used to define web endpoints.  If not specified, oen will be created internally.
Note: only use your own Express if you absolutely must for some reason. Otherwise, use `controller.webserver`\n

<a name="BotkitHandler"></a>
## Interface BotkitHandler



<a name="BotkitMessage"></a>
## Interface BotkitMessage


**Fields**

| Name | Type | Description
|--- |--- |---
| channel | string | 
| incoming_message |  | 
| reference | ConversationReference | 
| text | string | 
| type | string | 
| user | string | 

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

<a name="BotkitTrigger"></a>
## Interface BotkitTrigger


**Fields**

| Name | Type | Description
|--- |--- |---
| handler | [BotkitHandler](#BotkitHandler) | 
| pattern |  | 
| type | string | 

<a name="PluginMenu"></a>
## Interface PluginMenu


**Fields**

| Name | Type | Description
|--- |--- |---
| icon | string | 
| title | string | 
| url | string | 

<a name="PluginWebEndpoint"></a>
## Interface PluginWebEndpoint


**Fields**

| Name | Type | Description
|--- |--- |---
| handler |  | 
| method | string | 
| url | string | 

