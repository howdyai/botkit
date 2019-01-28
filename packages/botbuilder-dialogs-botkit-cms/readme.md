# Use Botkit CMS with Microsoft Bot Builder Dialogs

This plugin module for [Microsoft Bot Builder](https://github.com/microsoft/botbuilder-js)
adds support for creating and managing the content and structure of [dialogs](https://github.com/Microsoft/botbuilder-js/blob/master/libraries/botbuilder-dialogs/README.md)
with the web-based dialog editor provided by [Botkit CMS](https://github.com/howdyai/botkit-cms/blob/master/readme.md).

Once enabled, a bot can dynamically load dialog content from a Botkit CMS instance and create
"native" Bot Builder dialogs that can be be used alongside `WaterfallDialogs` or custom dialog classes.

This module also provides a mechanism for using the remote trigger API provided by Botkit CMS,
which allows incoming messages to be interpreted for trigger patterns externally from the application code.

Note that this plugin requires a properly configured `DialogSet` provided by the [botbuilder-dialogs](https://www.npmjs.com/package/botbuilder-dialogs) module. A boilerplate example of this can be found [in this and other sample apps](https://github.com/Microsoft/BotBuilder-Samples/tree/master/samples/javascript_nodejs/04.simple-prompt) from the [Bot Builder Samples repo](https://github.com/Microsoft/BotBuilder-Samples).

## Install

Add the module to your project using npm:

```bash
npm install --save botbuilder-dialogs-botkit-cms
```

Import the module into your project by adding this line towards the top of your code:

```javascript
const { BotkitHelper } = require('botbuilder-dialogs-botkit-cms');
```

## Dynamically Load Dialogs from Botkit CMS

First, create an instance of the `BotkitHelper` class by configuring it with the URI of a Botkit CMS instance
and a valid access token, as seen below:

```javascript
const cms = new BotkitHelper({
    cms_uri: 'https://my-botkit-cms.com',
    token: 'my-secret-token'
});
```

Using the resulting `cms` object, load all content from the API and create dialogs within a specified `DialogSet`. This happens once per execution - if dialog content changes, or new dialogs are added, the application must be restarted.

This helper method will create a new Dialog object for each script that exists within Botkit CMS, using the name of the script as the dialog id. The resulting Dialog object will then be added to the `DialogSet` and made available to the bot application.

```javascript
cms.loadAllScripts(dialogSet).then(function() {
    // add botkit dialog handler functions here (see below)
});
```

Once loaded, Botkit Dialogs are triggered in the same manner as any other BotBuilder dialog, using [beginDialog()](https://docs.microsoft.com/en-us/javascript/api/botbuilder-dialogs/dialogcontext?view=botbuilder-ts-latest#begindialog) For example:

```javascript
const dialogContext = await dialogSet.createContext(turnContext);
// ... other logic
await dialogContext.beginDialog('my_botkit_dialog');
```


## Use Botkit CMS Trigger API

Keywords, regular expressions, and [intents from LUIS.ai](https://luis.ai) can be configured as triggers within the Botkit CMS user interface.
To evaluate incoming BotBuilder activities against the external API and automatically start the appropriate dialog within the bot, use the
`testTriggerDC()` method.

If a trigger is matched, the appropriate dialog will begin automatically. Otherwise, no action will be taken. Note that the dialogs must first
be loaded into the DialogSet usign `loadAllScripts()` as seen above.


```javascript
const dialogContext = await dialogSet.createContext(turnContext);
// ... other logic
await cms.testTriggerDC(dialogContext);
```

## Interact with Botkit Dialogs as they run

In order to inject dynamic functionality into the scripted dialogs managed by Botkit CMS, Dialog objects created with the `BotkitHelper` offer several methods not available in standard BotBuilder dialogs.  These hook methods allow developers to tie into various parts of the dialog flow and call custom code.

Note that these methods can only be called after the dialogs are defined, using `loadAllScripts()`.
Since this is an asynchronous operation that may take several seconds, any calls to these functions should occur _after_ the loadAllScripts promise resolves, as below:

```javascript
cms.loadAllSCripts(dialogSet).then(function() {
    dialogSet.find('my_dialog').before('default', async (dc, step) => {
        // my before thread logic
    });
});
```

### Passing values to a dialog

Initialization values can be passed to a dialog when calling `beginDialog()`. These values will be present in step.values, and can be referenced from within the dialog content using Mustache template tokens like `{{vars.field_name}}`:

Pass in values:
```javascript
dialogContext.beginDialog('my_dialog', { foo: true, bar: false });
```

These values can then be referenced from within content from Botkit CMS as `{{vars.foo}}` and `{{vars.bar}}`. Variable substitution happens automatically when the message is sent to the end user, and will be applied to the message text as well as all fields within any associated attachments.

Any values passed in will be available in `step.values`, and will persist through to the end of the dialog where they will be available as part of the `results` object passed to handlers bound with `after()`.

### Run code before a thread starts:

Botkit CMS scripts contain 1 or more "threads" which represent messages sent in sequence.

To run code before anything else happens, bind a function to the `default` thread. Handlers may also be bound to any other thread. Multiple handlers can be bound to the same thread - they will run in the order in which they are added.

```javascript
function before(thread_name, async handler(dialogContext, stepContext));
```

| Parameter | Type | Description
|--- |--- |---
| thread_name | string | The thread name as defined in the Botkit CMS ui
| handler | async function | Receives a dialogContext and a stepContext

This example code creates a timestamp variable for use in the `my_dialog` dialog before the `default` thread runs:

```javascript
dialogSet.find('my_dialog').before('default', async (dc, step) => {
    // make changes to step values, or take other actions using the dialog context
    step.values.timestamp = new Date();
});
```

### Run code when a prompt is answered:

Prompts defined in Botkit CMS will automatically have their answers stored in `step.values`
using the variable name specified in the CMS user interface. When a user responds to a prompt, 
the bot may run an `onChange` handler and access the new value, as well as the related dialogContext
and step object.

```javascript
function onChange(variable_name, async handler(new_value, dialogContext, stepContext));
```

| Parameter | Type | Description
|--- |--- |---
| variable_name | string | The variable name as defined in the Botkit CMS ui
| handler | async function | Receives the new value, a dialogContext and a stepContext

This example listens for a change to a variable named `variable_name`, then performs
a validation action:

```javascript
dialogSet.find('my_dialog').onChange('variable_name', async (new_value, dc, step) => {
    // validate the input or take conditional actions based on `new_value`
    if (new_value != 'yes') {
        this.gotoThread('error');
        // modify captured response
        step.values.variable_name = false;
    }
});
```

### Run code when a dialog completes:

Bind a method to the end of a dialog to collect the results and take a final action.


```javascript
function after(async handler(turnContext, results));
```

| Parameter | Type | Description
|--- |--- |---
| handler | async function | receives a turnContext and the aggregated results of the dialog

This example listens for a change to a variable named `variable_name`, then performs
a validation action:


```javascript
dialogSet.find('my_dialog').after(async (context, results) => {
    // results is an object that contains all the prompt answers and anything else stored in step.values
    const my_variable = results.variable_name;
});
```

A `_status` field will be added to `results` object that indicates the ending status
of the dialog. The status is defined in the Botkit user interface.

```javascript
if (results._status !== 'completed') {
    // something occured that caused the dialog to fail
}
```

### Switching Threads

From within a `before` or `onChange` handler, call `this.gotoThread()` to switch
to a new thread within the same dialog. This can be used to create conditional behaviors that change the flow of the dialog, such as displaying error messages or additional instructions in response to invalid input, or routing users past prompts if the required information has already been provided.

Within these handlers, the `this` object has been bound to the dialog object itself.

```javascript
function gotoThread(thread_name)
```

| Parameter | Type | Description
|--- |--- |---
| thread_name | string | Name of an existing thread within the dialog

Note that any `before()` handler bound to the destination thread will fire _after_ the handler
in which `gotoThread()` is called.

## Additional Resources

* [Bot Builder Docs](https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0)
* [Bot Builder Dialogs Documentation](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
* [Botkit Community Chat](https://community.botkit.ai/), an active community of bot enthusiasts
* [Botkit Core](https://botkit.ai), an alternative open source SDK to Bot Builder
