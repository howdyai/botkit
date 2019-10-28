# Advanced topics

## What causes the error: `UnhandledPromiseRejectionWarning: TypeError: Cannot perform 'get' on a proxy that has been revoked`

This happens when a call to bot.say, bot.reply, or bot.beginDialog has been used without the `await` keyword.

Make sure you `await` all calls to these and similar functions! These functions return promises that have to be resolved
properly, otherwise you'll get the above error!

## Botkit 4.0 Goals:

These were the goals we set out to achieve in creating the new version of Botkit.

* Keep as much of the feature set, syntax and special sauce developers know and love
* Solve persistent and hard to solve problems in previous versions of Botkit
* Use modern JavaScript language features like async/await instead of callbacks
* Full Typescript support
* Break platform adapters (and their large dependency trees) into optional packages
* Reorganize some related projects into a monorepo
* Inherit much goodness from [Bot Framework SDK](https://github.com/microsoft/botbuilder-js)
* Provide a way for bots to be extended with plugins and modular features, and for those plugins to provide a consistent interface to administrators


## What's different between 0.7 and 4.0?

The [changelog](https://github.com/howdyai/botkit/blob/master/changelog.md#401) has lots of details on the new features.

In addition, here are some notes on the major changes:

* All of the major features now uses promises and the async/await pattern. Goodbye, nested callbacks!
* Everything has been rebuilt using Typescript classes. If you want types, you got 'em!
* The dialog system has been rearchitected to solve some long term issues - but much of the familiar syntax has been retained.
* The core Botkit library now contains just the platform-independent APIs for building bot features. Platform adapters are now separate modules.
* Botkit is now inherits core classes from [Bot Framework SDK](https://github.com/microsoft/botframework-sdk#readme) and as a result gains compatibility with all of the tools from Bot Framework - in particular [dialogs](https://npmjs.com/package/botbuilder-dialogs) and [Bot Framework Emulator](https://aka.ms/botframework-emulator)
* Botkit no longer provides a generic "storage" layer. Developers will need to build their own or use a hybrid approach (see below.)


## How to upgrade from 0.7 to 4.0

Though many things have changed in the latest version of Botkit, and it is not directly backwards compatible with previous versions,
many elements of the previous Botkit syntax are still present and the vast majority of features from the previous versions.
Experienced Botkit developers will recognize the familiar syntax of features like `hears()` and `ask()`.

The overall structure of the Botkit application is roughly the same, though the shape of some components have shifted.
Before upgrading your bot, use the yeoman generator to create a sample app -- if only to understand its structure.
In most cases, the best approach will be to create a new bot using the generator, then port existing "skill" files to the new syntax.

You may need to update your Node version because v4 of Botkit uses modern Javascript syntax. We suggest using the LTS version.

### Changes to how Botkit is installed and configured:

* Previous versions of Botkit contained all the adapters. Now the adapters are separate packages.
* Now have to separately configure Botkit and the adapter.
* If you previously used a starter kit,  the easiest way is to start with a new yeoman generator template, then copy over skill files, then make some syntax updates.

FROM:
```
var Botkit = require('botkit');

var controller = new Botkit.slackbot(options);
```

TO:
```
const { Botkit } = require('botkit');
const { SlackAdapter } = require('botbuilder-adapter-slack');

let adapter = new SlackAdapter(options);
let controller = new Botkit({
    adapter: adapter
});
```

### Syntax changes in your bot code:

* Everything has been promisified! Before all your "hears" or "on" handlers, add the "async" keyword to the function.
* Add "await" keyword in front of all calls to bot.reply or bot.say or similar functions.
* The name of the event for normal messages has changed.  Change any instance of 'message_received' to 'message'

FROM:
```
bot.hears('foo', 'message_received', function(bot, message) { 
    bot.reply(message,'bar');
});
```

TO:
```
bot.hears('foo', 'message', async(bot, message) => { 
    await bot.reply(message,'bar');
});
```

### Conversation changes:

* All conversations have to be constructed using `new BotkitConversation()` added using `controller.addDialog()` at startup (not inside handler or dynamically)
* Any call to startConversation (and related functions) has to be updated - these functions still exist but work differently, and must be paired with a call to `bot.beginDialog()`
* The new system no longer has support for modifying the conversation structure on the fly by doing additional calls to convo.say or convo.ask from inside callbacks. If your dialog requires sending ad hoc messages, it is still possible to do that using use `bot.say()` rather than `convo.say()`
* The syntax for convo.ask and convo.say remains mostly the same
* convo.ask handlers are now in the format `async(response, convo, bot)=>{}`. as a result of these being promises, it is no longer necessary to call convo.next
* Hook functions have changed a bit: convo.before takes a thread name, to fire before anything, set that to default.

FROM:
```
bot.hears('tacos', 'direct_message', function(bot, message) {
    bot.startConversation(function(err, convo) { 

        convo.say('SOMEONE SAID TACOS!');
        convo.ask('Do you want to eat a taco?', [
            {
                pattern: 'yes',
                default: true,
                callback: function(response, convo) {
                    convo.gotoThread('yes_tacos');
                }
            },
            {
                pattern: 'no',
                callback: function(response, convo) {
                    convo.gotoThread('no_tacos');
                }
            }
        ], {key: 'wants_taco'});

        convo.addMessage('Hooray for tacos!', 'yes_tacos');
        convo.addMessage('ERROR: Tacos missing!!', 'no_tacos');

        convo.on('end', function(convo) {
            var responses = convo.extractResponses();
            // responses.wants_tacos
        });
    });
});
```

TO:
```
const { BotkitConversation } = require('botkit');

let convo = new BotkitConversation('tacos', controller);
convo.say('SOMEONE SAID TACOS!');
convo.ask('Do you want to eat a taco?', [
    {
        pattern: 'yes',
        default: true,
        handler: async(response, convo, bot) => {
            await convo.gotoThread('yes_tacos');
        }
    },
    {
        pattern: 'no',
        handler: async(response, convo, bot) => {
            await convo.gotoThread('no_tacos');
        }
    }
], 'wants_taco');

convo.addMessage('Hooray for tacos!', 'yes_tacos');
convo.addMessage('ERROR: Tacos missing!!', 'no_tacos');

convo.after(async(results, bot) => {

    // results.wants_taco

})

// add to the controller to make it available for later.
controller.addDialog(convo);

controller.hears('tacos', 'direct_message', async(bot, message) => {
    await bot.beginDialog('tacos');
});
```

### Botkit Studio / Botkit CMS changes:

The functionality previously associated with Botkit Studio and now associated with Botkit CMS has been now been moved out of the core SDK
and into a plugin module.

To access dialog content build in Botkit CMS, install `botkit-plugin-cms`, and adjust calls to the CMS from `controller.studio.*` to `controller.plugins.cms.*`:

* `controller.studio.before('script', ...)` becomes `controller.plugins.cms.before('script', 'default', ...)`
* `controller.studio.beforeThread('script', 'thread')` becomes `controller.plugins.cms.before('script', 'thread', ...)`
* `controller.studio.after('script', ...)` becomes `controller.plugins.cms.after('script', ...)`
* `controller.studio.validate('script', 'variable', ...')` becomes `controller.plugins.cms.onChange('script', 'variable', ...)`

Read [more about using botkit-plugin-cms here](plugins/cms.html)

### Storage changes

In v4 of Botkit, the storage system is currently only used to store and retrieve the conversation state between turns.
Other than this, Botkit will no longer be providing an interface for connecting to or using databases. Developers
should build their own database abstractions.

However to reduce the complexity of the upgrade process, existing bots can continue to use storage adapters from 
previous versions of Botkit using [the technique discussed here](https://github.com/howdyai/botkit-storage-mongo/issues/42#issuecomment-489654424).


## Anatomy of a Botkit App

File structure:

* main app file (normally bot.js)
* features/ folder
* .env file
* package.json file

in bot.js:

* create adapter
* create botkit
* load any middlewares or plugins
* use `controller.loadModules()` to load features/ folder

in features/ folder:

modules in the form:

```javascript
module.exports = function(controller) {
    // some code here.
}
```
## Flow of activity as a message is processed

* Adapter receives incoming http request
* Activity object is created, passed off to Botkit
* Botkit turns the Activity object into a BotkitMessage
* Botkit runs ingest middleware
* Botkit evaluates for interrupts -> end if triggered
* Botkit passes to dialog stack -> end if active dialog 
* Botkit evaluates for hears -> end if triggered
* Botkit runs receive middleware
* Botkit emits an event based on the `type` field of the message
* Any handlers bound to event fire
* Adapter sends http response

When a message is sent:

* Botkit receives message from code
* Botkit runs send middleware
* Activity object is created, passed off to BotBuilder
* BotBuilder sends the message to the platform API

## How to use "Bot Inspector" mode

With Bot Inspector mode enabled, you can use [Bot Framework Emulator](https://aka.ms/botframework-emulator) to
connect to your bot _while it also sends and receives messages to the live platform of your choice._ Once activated,
you'll be able to inspect the JSON payloads of incoming and outgoing messages, as well as inspect your bot's state variables.

It is TRULY COOL AND USEFUL, like opening an access panel into your bot's brain and being able to poke around like they did with Data on Star Trek: The Next Generation.

To enable this in a Botkit app:

* Add [this module](https://gist.github.com/benbrown/d6fbf2c8aac37b60c746abc08b9b96e7) to your app.
* Download the latest [Bot Framework Emulator](https://aka.ms/botframework-emulator)
* Launch your bot app and make sure it is connected to the outside world with a tool like ngrok
* Launch Bot Framework emulator and enable inspector mode "View > Bot Inspector Mode" in the menu
* Connect to "http://localhost:3000/api/sidecar"
* Bot Framework emulator will display a command like "/INSPECT attach XYZ".  Copy paste this into the channel with your bot that you want to inspect.
* If successful, your bot should respond automatically.
* Watch the emulator for future messages between your bot and the channel being inspected.


## Typescript

coming 

## How to build a new adapter

coming
