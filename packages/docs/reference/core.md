<a name="BotWorker"></a>
## BotWorker

### constructor new BotWorker()

**Parameters**
| name | type | description
|--- |--- |---
| controller | any |
| config | any |



**Properties and Accessors**
| name | type | comment
|--- |--- |---
| controller |  | 

<a name="beginDialog"></a>
### beginDialog()


**Parameters**
| name | type | description
|--- |--- |---
| id| any | 
| options| any | 



<a name="changeContext"></a>
### changeContext()


**Parameters**
| name | type | description
|--- |--- |---
| reference| Partial | 



<a name="ensureMessageFormat"></a>
### ensureMessageFormat()
Take a crudely-formed Botkit message with any sort of field
and map it into a beautiful BotFramework activity

**Parameters**
| name | type | description
|--- |--- |---
| message| any | 



<a name="getConfig"></a>
### getConfig()


**Parameters**
| name | type | description
|--- |--- |---
| key (optional)| string | 



<a name="httpBody"></a>
### httpBody()


**Parameters**
| name | type | description
|--- |--- |---
| body| any | 



<a name="httpStatus"></a>
### httpStatus()


**Parameters**
| name | type | description
|--- |--- |---
| status| number | 



<a name="reply"></a>
### reply()


**Parameters**
| name | type | description
|--- |--- |---
| src| Partial | 
| resp| Partial | 



<a name="say"></a>
### say()


**Parameters**
| name | type | description
|--- |--- |---
| message| Partial | 





<a name="Botkit"></a>
## Botkit
Create a new instance of Botkit to define the controller for a conversational app.
To connect Botkit to a chat platform, pass in a fully configured &#x60;adapter&#x60;.
If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.
### constructor new Botkit()

**Parameters**
| name | type | description
|--- |--- |---
| config | [BotkitConfiguration](#BotkitConfiguration) | 

**Properties and Accessors**
| name | type | comment
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
| name | type | description
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
| name | type | description
|--- |--- |---
| name| string | The name of the dependency that has completed loading.




<a name="getConfig"></a>
### getConfig()
Get a value from the configuration.

**Parameters**
| name | type | description
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


**Parameters**
| name | type | description
|--- |--- |---
| turnContext| any | 



<a name="hears"></a>
### hears()


**Parameters**
| name | type | description
|--- |--- |---
| patterns|  | 
| events|  | 
| handler|  | 



<a name="ingest"></a>
### ingest()


**Parameters**
| name | type | description
|--- |--- |---
| bot| [BotWorker](#BotWorker) | 
| message| [BotkitMessage](#BotkitMessage) | 



<a name="interrupts"></a>
### interrupts()


**Parameters**
| name | type | description
|--- |--- |---
| patterns|  | 
| events|  | 
| handler|  | 



<a name="loadModule"></a>
### loadModule()


**Parameters**
| name | type | description
|--- |--- |---
| p| string | 



<a name="loadModules"></a>
### loadModules()


**Parameters**
| name | type | description
|--- |--- |---
| p| string | 



<a name="on"></a>
### on()


**Parameters**
| name | type | description
|--- |--- |---
| events|  | 
| handler|  | 



<a name="ready"></a>
### ready()


**Parameters**
| name | type | description
|--- |--- |---
| handler| any | 



<a name="saveState"></a>
### saveState()


**Parameters**
| name | type | description
|--- |--- |---
| bot| any | 



<a name="spawn"></a>
### spawn()


**Parameters**
| name | type | description
|--- |--- |---
| config| any | 



<a name="trigger"></a>
### trigger()


**Parameters**
| name | type | description
|--- |--- |---
| event| string | 
| bot| [BotWorker](#BotWorker) | 
| message| [BotkitMessage](#BotkitMessage) | 





<a name="BotkitCMSHelper"></a>
## BotkitCMSHelper

### constructor new BotkitCMSHelper()

**Parameters**
| name | type | description
|--- |--- |---
| controller | any | 
| config | any | 


<a name="after"></a>
### after()


**Parameters**
| name | type | description
|--- |--- |---
| script_name| string | 
| handler|  | 



<a name="before"></a>
### before()


**Parameters**
| name | type | description
|--- |--- |---
| script_name| string | 
| thread_name| string | 
| handler|  | 



<a name="loadAllScripts"></a>
### loadAllScripts()


**Parameters**
| name | type | description
|--- |--- |---
| dialogSet| DialogSet | 



<a name="onChange"></a>
### onChange()


**Parameters**
| name | type | description
|--- |--- |---
| script_name| string | 
| variable_name| string | 
| handler|  | 



<a name="testTrigger"></a>
### testTrigger()


**Parameters**
| name | type | description
|--- |--- |---
| bot| any | 
| message| any | 





<a name="BotkitConversation"></a>
## BotkitConversation

### constructor new BotkitConversation()

**Parameters**
| name | type | description
|--- |--- |---
| dialogId | string | 
| controller | any | 

**Properties and Accessors**
| name | type | comment
|--- |--- |---
| script | any | 

<a name="addMessage"></a>
### addMessage()


**Parameters**
| name | type | description
|--- |--- |---
| message| any | 
| thread_name| any | 



<a name="addQuestion"></a>
### addQuestion()


**Parameters**
| name | type | description
|--- |--- |---
| message| any | 
| handlers| any | 
| options| any | 
| thread_name| any | 



<a name="after"></a>
### after()


**Parameters**
| name | type | description
|--- |--- |---
| handler|  | 



<a name="ask"></a>
### ask()


**Parameters**
| name | type | description
|--- |--- |---
| message| any | 
| handlers| any | 
| options| any | 



<a name="before"></a>
### before()


**Parameters**
| name | type | description
|--- |--- |---
| thread_name| any | 
| handler| any | 



<a name="beginDialog"></a>
### beginDialog()


**Parameters**
| name | type | description
|--- |--- |---
| dc| any | 
| options| any | 



<a name="continueDialog"></a>
### continueDialog()


**Parameters**
| name | type | description
|--- |--- |---
| dc| any | 



<a name="end"></a>
### end()


**Parameters**
| name | type | description
|--- |--- |---
| dc| DialogContext | 
| value| any | 



<a name="endDialog"></a>
### endDialog()


**Parameters**
| name | type | description
|--- |--- |---
| context| TurnContext | 
| instance| DialogInstance | 
| reason| DialogReason | 



<a name="gotoThread"></a>
### gotoThread()


**Parameters**
| name | type | description
|--- |--- |---
| thread| any | 
| dc| any | 
| step| any | 



<a name="onChange"></a>
### onChange()


**Parameters**
| name | type | description
|--- |--- |---
| variable| any | 
| handler| any | 



<a name="onStep"></a>
### onStep()


**Parameters**
| name | type | description
|--- |--- |---
| dc| any | 
| step| any | 



<a name="resumeDialog"></a>
### resumeDialog()


**Parameters**
| name | type | description
|--- |--- |---
| dc| any | 
| reason| any | 
| result| any | 



<a name="runStep"></a>
### runStep()


**Parameters**
| name | type | description
|--- |--- |---
| dc| any | 
| index| any | 
| thread_name| any | 
| reason| any | 
| result (optional)| any | 



<a name="say"></a>
### say()


**Parameters**
| name | type | description
|--- |--- |---
| message| any | 





<a name="BotkitConversationState"></a>
## BotkitConversationState

### constructor new BotkitConversationState()

**Parameters**
| name | type | description
|--- |--- |---
| storage | Storage | 
| namespace | string | 


<a name="getStorageKey"></a>
### getStorageKey()


**Parameters**
| name | type | description
|--- |--- |---
| context| TurnContext | 





<a name="BotkitDialogWrapper"></a>
## BotkitDialogWrapper

### constructor new BotkitDialogWrapper()

**Parameters**
| name | type | description
|--- |--- |---
| dc | any | 
| step | any | 

**Properties and Accessors**
| name | type | comment
|--- |--- |---
| vars | __type | 

<a name="gotoThread"></a>
### gotoThread()


**Parameters**
| name | type | description
|--- |--- |---
| thread| any | 





<a name="BotkitPluginLoader"></a>
## BotkitPluginLoader

### constructor new BotkitPluginLoader()

**Parameters**
| name | type | description
|--- |--- |---
| botkit | any | 

**Properties and Accessors**
| name | type | comment
|--- |--- |---
| botkit | [Botkit](#Botkit) | 

<a name="localView"></a>
### localView()


**Parameters**
| name | type | description
|--- |--- |---
| path_to_view| any | 



<a name="publicFolder"></a>
### publicFolder()


**Parameters**
| name | type | description
|--- |--- |---
| alias| any | 
| path| any | 



<a name="register"></a>
### register()


**Parameters**
| name | type | description
|--- |--- |---
| name| any | 
| endpoints| [BotkitPlugin](#BotkitPlugin) | 



<a name="use"></a>
### use()


**Parameters**
| name | type | description
|--- |--- |---
| plugin_or_function|  | 







<a name="BotkitConfiguration"></a>
## Interface BotkitConfiguration


**Fields**
| name | type | comment
|--- |--- |---
| adapter | BotFrameworkAdapter | 
| adapterConfig |  | 
| authFunction |  | 
| cms |  | 
| debug | boolean | 
| storage | Storage | 
| webhook_uri | string | 
| webserver | any | 

<a name="BotkitMessage"></a>
## Interface BotkitMessage


**Fields**
| name | type | comment
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
| name | type | comment
|--- |--- |---
| init |  | 
| menu |  | 
| middlewares | __type | 
| name | string | 
| web |  | 

<a name="PluginMenu"></a>
## Interface PluginMenu


**Fields**
| name | type | comment
|--- |--- |---
| icon | string | 
| title | string | 
| url | string | 

<a name="PluginWebEndpoint"></a>
## Interface PluginWebEndpoint


**Fields**
| name | type | comment
|--- |--- |---
| handler |  | 
| method | string | 
| url | string | 

