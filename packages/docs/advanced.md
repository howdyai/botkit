# Advanced topics

## What causes the error: `UnhandledPromiseRejectionWarning: TypeError: Cannot perform 'get' on a proxy that has been revoked`

This happens when a call to bot.say, bot.reply, or bot.beginDialog has been used without the `await` keyword.

Make sure you `await` all calls to these and similar functions! These functions return promises that have to be resolved
properly, otherwise you'll get the above error!

## what's different between 0.7 and 4.0?

GOALS:
* Keep as much of the feature set, syntax and special sauce developers know and love
* Solve persistent and hard to solve problems in previous versions of Botkit
* Use modern JavaScript language features like async/await instead of callbacks
* Full Typescript support
* Break platform adapters (and their large dependency trees) into optional packages
* Reorganize some related projects into a monorepo
* Inherit much goodness from [Bot Framework SDK](https://github.com/microsoft/botbuilder-js)
* Provide a way for bots to be extended with plugins and modular features, and for those plugins to provide a consistent interface to administrators



## How to upgrade from 0.7 to 4.0

You may need to update your Node version because v4 of Botkit uses modern Javascript syntax. We suggest using the LTS version.

Changes to how Botkit is installed and configured:

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

Syntax changes in your bot code:

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

Conversation changes:

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
    await bot.beginDialog(convo);
});
```

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



## Typescript

## Hearing other types of things
    * lambda
    * regexps

## How to build a new adapter