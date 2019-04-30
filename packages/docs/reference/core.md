# Botkit Core Class Reference

[&larr; Botkit Documentation](..) [&larr; Class Index](index.md) 

This is a class reference for all the methods exposed by the [botkit](https://github.com/howdyai/botkit/tree/next/packages/botkit) package.

## Classes


* <a href="#Botkit" aria-current="page">Botkit</a>
* <a href="#BotkitBotFrameworkAdapter" aria-current="page">BotkitBotFrameworkAdapter</a>
* <a href="#BotWorker" aria-current="page">BotWorker</a>
* <a href="#BotkitConversation" aria-current="page">BotkitConversation</a>
* <a href="#BotkitDialogWrapper" aria-current="page">BotkitDialogWrapper</a>

## Interfaces

* <a href="#BotkitConfiguration" aria-current="page">BotkitConfiguration</a>
* <a href="#BotkitConversationStep" aria-current="page">BotkitConversationStep</a>
* <a href="#BotkitHandler" aria-current="page">BotkitHandler</a>
* <a href="#BotkitMessage" aria-current="page">BotkitMessage</a>
* <a href="#BotkitPlugin" aria-current="page">BotkitPlugin</a>

---

<a name="Botkit"></a>
## Botkit
Create a new instance of Botkit to define the controller for a conversational app.
To connect Botkit to a chat platform, pass in a fully configured `adapter`.
If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.

To use this class in your application, first install the package:
```bash
npm install --save botkit
```

Then import this and other classes into your code:
```javascript
const { Botkit } = require('botkit');
```

This class includes the following methods:
* [addDep()](#addDep)
* [addDialog()](#addDialog)
* [addPluginExtension()](#addPluginExtension)
* [afterDialog()](#afterDialog)
* [completeDep()](#completeDep)
* [getConfig()](#getConfig)
* [getLocalView()](#getLocalView)
* [handleTurn()](#handleTurn)
* [hears()](#hears)
* [interrupts()](#interrupts)
* [loadModule()](#loadModule)
* [loadModules()](#loadModules)
* [on()](#on)
* [publicFolder()](#publicFolder)
* [ready()](#ready)
* [saveState()](#saveState)
* [spawn()](#spawn)
* [trigger()](#trigger)
* [usePlugin()](#usePlugin)



### Create a new Botkit()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| config | [BotkitConfiguration](#BotkitConfiguration) | Configuration for this instance of Botkit<br/>

Create a new Botkit instance and optionally specify a platform-specific adapter.
By default, Botkit will create a [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest).

```javascript
const controller = new Botkit({
     adapter: some_adapter,
     webhook_uri: '/api/messages',
});

controller.on('message', async(bot, message) => {
     // do something!
});
```



## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| PATH | string | The path of the main Botkit SDK, used to generate relative paths
| adapter | any | Any BotBuilder-compatible adapter - defaults to a [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest)
| dialogSet | DialogSet | A BotBuilder DialogSet that serves as the top level dialog container for the Botkit app
| http | any | A direct reference to the underlying HTTP server object
| storage | Storage | a BotBuilder storage driver - defaults to MemoryStorage
| version | string | The current version of Botkit Core
| webserver | any | An Express webserver
| plugins |  | Access plugin extension methods.<br/>After a plugin calls `controller.addPluginExtension('foo', extension_methods)`, the extension will then be available at<br/>`controller.plugins.foo`

## Botkit Class Methods
<a name="addDep"></a>
### addDep()
(For use by Botkit plugins only) - Add a dependency to Botkit's bootup process that must be marked as completed using `completeDep()`.
Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.


For example, a plugin that needs to do an asynchronous task before Botkit proceeds might do:
```javascript
controller.addDep('my_async_plugin');
somethingAsync().then(function() {
 controller.completeDep('my_async_plugin');
});
```


<a name="addDialog"></a>
### addDialog()
Add a dialog to the bot, making it accessible via `bot.beginDialog(dialog_id)`


```javascript
// Create a dialog -- `BotkitConversation` is just one way to create a dialog
const my_dialog = new BotkitConversation('my_dialog', controller);
my_dialog.say('Hello');

// Add the dialog to the Botkit controller
controller.addDialog(my_dialog);

// Later on, trigger the dialog into action!
controller.on('message', async(bot, message) => {
     await bot.beginDialog('my_dialog');
});
```


<a name="addPluginExtension"></a>
### addPluginExtension()
(Plugins only) Extend Botkit's controller with new functionality and make it available globally via the controller object.


```javascript

// define the extension interface
let extension = {
        stuff: () => { return 'stuff' }
}

// register the extension
controller.addPluginExtension('foo', extension);

// call extension
controller.plugins.foo.stuff();


```

<a name="afterDialog"></a>
### afterDialog()
Bind a handler to the end of a dialog.
NOTE: bot worker cannot use bot.reply(), must use bot.send()


[Learn more about handling end-of-conversation](../docs/conversations.md#handling-end-of-conversation)

<a name="completeDep"></a>
### completeDep()
(For use by plugins only) - Mark a bootup dependency as loaded and ready to use
Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.


<a name="getConfig"></a>
### getConfig()
Get a value from the configuration.

**Returns**

The value stored in the configuration (or null if absent)




For example:
```javascript
// get entire config object
let config = controller.getConfig();

// get a specific value from the config
let webhook_uri = controller.getConfig('webhook_uri');
```


<a name="getLocalView"></a>
### getLocalView()
Convert a local path from a plugin folder to a full path relative to the webserver's main views folder.
Allows a plugin to bundle views/layouts and make them available to the webserver's renderer.


<a name="handleTurn"></a>
### handleTurn()
Accepts the result of a BotBuilder adapter's `processActivity()` method and processes it into a Botkit-style message and BotWorker instance
which is then used to test for triggers and emit events.
NOTE: This method should only be used in custom adapters that receive messages through mechanisms other than the main webhook endpoint (such as those received via websocket, for example)


<a name="hears"></a>
### hears()
Instruct your bot to listen for a pattern, and do something when that pattern is heard.
Patterns will be "heard" only if the message is not already handled by an in-progress dialog.
To "hear" patterns _before_ dialogs are processed, use `controller.interrupts()` instead.


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


```javascript
controller.interrupts('help','message', async(bot, message) => {

 await bot.reply(message,'Before anything else, you need some help!')

});
```

<a name="loadModule"></a>
### loadModule()
Load a Botkit feature module


<a name="loadModules"></a>
### loadModules()
Load all Botkit feature modules located in a given folder.


```javascript
controller.ready(() => {

 // load all modules from sub-folder features/
 controller.loadModules('./features');

});
```


<a name="on"></a>
### on()
Bind a handler function to one or more events.


```javascript
controller.on('conversationUpdate', async(bot, message) => {

 await bot.reply(message,'I received a conversationUpdate event.');

});
```


<a name="publicFolder"></a>
### publicFolder()
Expose a folder to the web as a set of static files.
Useful for plugins that need to bundle additional assets!


```javascript
// make content of the local public folder available at http://MYBOTURL/public/myplugin
controller.publicFolder('/public/myplugin', __dirname + '/public);
```

<a name="ready"></a>
### ready()
Use `controller.ready()` to wrap any calls that require components loaded during the bootup process.
This will ensure that the calls will not be made until all of the components have successfully been initialized.


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


<a name="spawn"></a>
### spawn()
Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
for handling platform-specific events or activities.


<a name="trigger"></a>
### trigger()
Trigger an event to be fired.  This will cause any bound handlers to be executed.
Note: This is normally used internally, but can be used to emit custom events.


```javascript
// fire a custom event
controller.trigger('my_custom_event', bot, message);

// handle the custom event
controller.on('my_custom_event', async(bot, message) => {
 //... do something
});
```


<a name="usePlugin"></a>
### usePlugin()
Load a plugin module and bind all included middlewares to their respective endpoints.



<a name="BotkitBotFrameworkAdapter"></a>
## BotkitBotFrameworkAdapter
This class extends the [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest) with a few additional features to support Microsoft Teams.
* Changes userAgent to reflect Botkit instead of BotBuilder
* Adds getChannels() (MS Teams)
* Adds middleware for adjusting location of tenant id field (MS Teams)

To use this class in your application, first install the package:
```bash
npm install --save botkit
```

Then import this and other classes into your code:
```javascript
const { BotkitBotFrameworkAdapter } = require('botkit');
```

This class includes the following methods:
* [getChannels()](#getChannels)



### Create a new BotkitBotFrameworkAdapter()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| options | any | 





## BotkitBotFrameworkAdapter Class Methods
<a name="getChannels"></a>
### getChannels()
Get the list of channels in a MS Teams team.
Can only be called with a TurnContext that originated in a team conversation - 1:1 conversations happen _outside a team_ and thus do not contain the required information to call this API.

**Returns**

an array of channels in the format [{name: string, id: string}]





<a name="BotWorker"></a>
## BotWorker
A base class for a `bot` instance, an object that contains the information and functionality for taking action in response to an incoming message.
Note that adapters are likely to extend this class with additional platform-specific methods - refer to the adapter documentation for these extensions.

To use this class in your application, first install the package:
```bash
npm install --save botkit
```

Then import this and other classes into your code:
```javascript
const { BotWorker } = require('botkit');
```

This class includes the following methods:
* [beginDialog()](#beginDialog)
* [cancelAllDialogs()](#cancelAllDialogs)
* [changeContext()](#changeContext)
* [ensureMessageFormat()](#ensureMessageFormat)
* [getConfig()](#getConfig)
* [httpBody()](#httpBody)
* [httpStatus()](#httpStatus)
* [replaceDialog()](#replaceDialog)
* [reply()](#reply)
* [say()](#say)
* [startConversationWithUser()](#startConversationWithUser)



### Create a new BotWorker()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| controller | [Botkit](#Botkit) | A pointer to the main Botkit controller
| config | any | An object typically containing { dialogContext, reference, context, activity }<br/>

Create a new BotWorker instance. Do not call this directly - instead, use [controller.spawn()](#spawn).


## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| controller |  | Get a reference to the main Botkit controller.

## BotWorker Class Methods
<a name="beginDialog"></a>
### beginDialog()
Begin a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.
[See "Using Dialogs" in the core documentation.](../index.md#using-dialogs)


```javascript
controller.hears('hello', 'message', async(bot, message) => {
     await bot.beginDialog(GREETINGS_DIALOG);
});
```

<a name="cancelAllDialogs"></a>
### cancelAllDialogs()
Cancel any and all active dialogs for the current user/context.


<a name="changeContext"></a>
### changeContext()
Alter the context in which a bot instance will send messages.
Use this method to create or adjust a bot instance so that it can send messages to a predefined user/channel combination.


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

**Returns**

a properly formed Activity object




<a name="getConfig"></a>
### getConfig()
Get a value from the BotWorker's configuration.

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


Example handling of a /slash command from Slack:
```javascript
controller.on('slash_command', async(bot, message) => {
 bot.httpBody('This is a reply to the slash command.');
})
```


<a name="httpStatus"></a>
### httpStatus()
Set the http response status code for this turn


```javascript
controller.on('event', async(bot, message) => {
  // respond with a 500 error code for some reason!
  bot.httpStatus(500);
});
```


<a name="replaceDialog"></a>
### replaceDialog()
Replace any active dialogs with a new a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.
[See "Using Dialogs" in the core documentation.](../index.md#using-dialogs)


```javascript
controller.hears('hello', 'message', async(bot, message) => {
     await bot.replaceDialog(GREETINGS_DIALOG);
});
```

<a name="reply"></a>
### reply()
Reply to an incoming message.
Message will be sent using the context of the source message, which may in some cases be different than the context used to spawn the bot.

**Returns**

Return value will contain the results of the send action, typically &#x60;{id: &lt;id of message&gt;}&#x60;




Note that like [bot.say()](#say), `reply()` can take a string or a message object.

```javascript
controller.on('event', async(bot, message) => {

 await bot.reply(message, 'I received an event and am replying to it.');

});
```


<a name="say"></a>
### say()
Send a message using whatever context the `bot` was spawned in or set using [changeContext()](#changecontext) --
or more likely, one of the platform-specific helpers like
[startPrivateConversation()](../reference/slack.md#startprivateconversation) (Slack),
[startConversationWithUser()](../reference/twilio-sms.md#startconversationwithuser) (Twilio SMS),
and [startConversationWithUser()](../reference/facebook.md#startconversationwithuser) (Facebook Messenger).
Be sure to check the platform documentation for others - most adapters include at least one.

**Returns**

Return value will contain the results of the send action, typically &#x60;{id: &lt;id of message&gt;}&#x60;




Simple use in event handler (acts the same as bot.reply)
```javascript
controller.on('event', async(bot, message) => {

 await bot.say('I received an event!');

});
```

Use with a freshly spawned bot and bot.changeContext:
```javascript
let bot = controller.spawn(OPTIONS);
bot.changeContext(REFERENCE);
bot.say('ALERT! I have some news.');
```

Use with multi-field message object:
```javascript
controller.on('event', async(bot, message) => {
     bot.say({
         text: 'I heard an event',
         attachments: [
             title: message.type,
             text: `The message was of type ${ message.type }`,
             // ...
         ]
     });
});
```


<a name="startConversationWithUser"></a>
### startConversationWithUser()




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


To use this class in your application, first install the package:
```bash
npm install --save botkit
```

Then import this and other classes into your code:
```javascript
const { BotkitConversation } = require('botkit');
```

This class includes the following methods:
* [addAction()](#addAction)
* [addChildDialog()](#addChildDialog)
* [addGotoDialog()](#addGotoDialog)
* [addMessage()](#addMessage)
* [addQuestion()](#addQuestion)
* [after()](#after)
* [ask()](#ask)
* [before()](#before)
* [onChange()](#onChange)
* [say()](#say)



### Create a new BotkitConversation()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| dialogId | string | A unique identifier for this dialog, used to later trigger this dialog
| controller | [Botkit](#Botkit) | A pointer to the main Botkit controller<br/>

Create a new BotkitConversation object


## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| script | any | A map of every message in the dialog, broken into threads

## BotkitConversation Class Methods
<a name="addAction"></a>
### addAction()
An an action to the conversation timeline. This can be used to go to switch threads or end the dialog.


When provided the name of another thread in the conversation, this will cause the bot to go immediately
to that thread.

Otherwise, use one of the following keywords:
* `stop`
* `repeat`
* `complete`
* `timeout`

[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)

```javascript

// go to a thread called "next_thread"
convo.addAction('next_thread');

// end the conversation and mark as successful
convo.addAction('complete');
```

<a name="addChildDialog"></a>
### addChildDialog()
Cause the dialog to call a child dialog, wait for it to complete,
then store the results in a variable and resume the parent dialog.
Use this to [combine multiple dialogs into bigger interactions.](../conversations.md#composing-dialogs)


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
```javascript
// define a profile collection dialog
let profileDialog = new BotkitConversation('PROFILE_DIALOG', controller);
profileDialog.ask('What is your name?', async(res, convo, bot) => {}, {key: 'name'});
profileDialog.ask('What is your age?', async(res, convo, bot) => {}, {key: 'age'});
profileDialog.ask('What is your location?', async(res, convo, bot) => {}, {key: 'location'});
controller.addDialog(profileDialog);

let onboard = new BotkitConversation('ONBOARDING', controller);
onboard.say('Hello! It is time to collect your profile data.');
onboard.addChildDialog('PROFILE_DIALOG', 'profile');
onboard.say('Hello, {{vars.profile.name}}! Onboarding is complete.');
```


<a name="addGotoDialog"></a>
### addGotoDialog()
Cause the current dialog to handoff to another dialog.
The parent dialog will not resume when the child dialog completes. However, the afterDialog event will not fire for the parent dialog until all child dialogs complete.
Use this to [combine multiple dialogs into bigger interactions.](../conversations.md#composing-dialogs)


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
```javascript
let parent = new BotkitConversation('parent', controller);
let child = new BotkitConversation('child', controller);
parent.say('Moving on....');
parent.addGotoDialog('child');
```


<a name="addMessage"></a>
### addMessage()
Add a message template to a specific thread.
Messages added with `say()` and `addMessage()` will be sent one after another without a pause.


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
```javascript
let conversation = new BotkitConversation('welcome', controller);
conversation.say('Hello! Welcome to my app.');
conversation.say('Let us get started...');
// pass in a message with an action that will cause gotoThread to be called...
conversation.addAction('continuation');

conversation.addMessage('This is a different thread completely', 'continuation');
```


<a name="addQuestion"></a>
### addQuestion()
Identical to [ask()](#ask), but accepts the name of a thread to which the question is added.


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)

<a name="after"></a>
### after()
Bind a function to run after the dialog has completed.
The first parameter to the handler will include a hash of all variables set and values collected from the user during the conversation.
The second parameter to the handler is a BotWorker object that can be used to start new dialogs or take other actions.


[Learn more about handling end of conversation](../conversation.md#handling-end-of-conversation)
```javascript
let convo = new BotkitConversation(MY_CONVO, controller);
convo.ask('What is your name?', [], 'name');
convo.ask('What is your age?', [], 'age');
convo.ask('What is your favorite color?', [], 'color');
convo.after(async(results, bot) => {

     // handle results.name, results.age, results.color

});
controller.addDialog(convo);
```


<a name="ask"></a>
### ask()
Add a question to the default thread.
In addition to a message template, receives either a single handler function to call when an answer is provided,
or an array of handlers paired with trigger patterns. When providing multiple conditions to test, developers may also provide a
handler marked as the default choice.


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
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


```javascript
convo.addMessage('This is the foo thread: var == {{vars.foo}}', 'foo');
convo.before('foo', async(convo, bot) => {
 // set a variable here that can be used in the message template
 convo.setVar('foo','THIS IS FOO');

});
```


<a name="onChange"></a>
### onChange()
Bind a function to run whenever a user answers a specific question.  Can be used to validate input and take conditional actions.


```javascript
convo.ask('What is your name?', [], 'name');
convo.onChange('name', async(response, convo, bot) {

 // user changed their name!
 // do something...

});
```

<a name="say"></a>
### say()
Add a non-interactive message to the default thread.
Messages added with `say()` and `addMessage()` will _not_ wait for a response, will be sent one after another without a pause.


[Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)

```javascript
let conversation = new BotkitConversation('welcome', controller);
conversation.say('Hello! Welcome to my app.');
conversation.say('Let us get started...');
```



<a name="BotkitDialogWrapper"></a>
## BotkitDialogWrapper
This class is used to provide easy access to common actions taken on active BotkitConversation instances.
These objects are passed into handlers bound to BotkitConversations using .before .onChange and conditional handler functions passed to .ask and .addQuestion
Grants access to convo.vars convo.gotoThread() convo.setVar() and convo.repeat().

To use this class in your application, first install the package:
```bash
npm install --save botkit
```

Then import this and other classes into your code:
```javascript
const { BotkitDialogWrapper } = require('botkit');
```

This class includes the following methods:
* [gotoThread()](#gotoThread)
* [repeat()](#repeat)
* [setVar()](#setVar)



### Create a new BotkitDialogWrapper()
**Parameters**

| Argument | Type | Description
|--- |--- |---
| dc | DialogContext | 
| step | [BotkitConversationStep](#BotkitConversationStep) | 




## Properties and Accessors

| Name | Type | Description
|--- |--- |---
| vars |  | An object containing variables and user responses from this conversation.

## BotkitDialogWrapper Class Methods
<a name="gotoThread"></a>
### gotoThread()
Jump immediately to the first message in a different thread.


<a name="repeat"></a>
### repeat()
Repeat the last message sent on the next turn.


<a name="setVar"></a>
### setVar()
Set the value of a variable that will be available to messages in the conversation.
Equivalent to convo.vars.key = val;
Results in {{vars.key}} being replaced with the value in val.




<a name="BotkitConfiguration"></a>
## Interface BotkitConfiguration
Defines the options used when instantiating Botkit to create the main app controller with `new Botkit(options)`

**Fields**

| Name | Type | Description
|--- |--- |---
| adapter | any | A fully configured BotBuilder Adapter, such as `botbuilder-adapter-slack` or `botbuilder-adapter-web`<br/>The adapter is responsible for translating platform-specific messages into the format understood by Botkit and BotBuilder.<br/>
| adapterConfig |  | If using the BotFramework service, options included in `adapterConfig` will be passed to the new Adapter when created internally.<br/>See [BotFrameworkAdapterSettings](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=azure-node-latest&viewFallbackFrom=botbuilder-ts-latest).<br/>
| dialogStateProperty | string | Name of the dialogState property in the ConversationState that will be used to automatically track the dialog state. Defaults to `dialogState`.<br/>
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
| value | string | Any value field received from the platform<br/>
<a name="BotkitPlugin"></a>
## Interface BotkitPlugin
An interface for plugins that can contain multiple middlewares as well as an init function.

**Fields**

| Name | Type | Description
|--- |--- |---
| init |  | 
| middlewares |  | 
| name | string | 
