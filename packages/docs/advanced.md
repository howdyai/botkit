# Advanced topics

## What causes the error: `UnhandledPromiseRejectionWarning: TypeError: Cannot perform 'get' on a proxy that has been revoked`

## what's different between 0.7 and 4.0?

## How to upgrade from 0.7 to 4.0

    * you may need to update your node version. we suggest using the lts version.

changes to how botkit is installed and configured:

* previous botkit contained all the adapters. now the adapters are separate packages.
* now have to separately configure Botkit and the adapter.
* if you previously used a starter kit,  the easiest way is to start with a new yeoman generator template, then copy over skill files, then make some syntax updates.

syntax changes in your bot code:
* before all your "hears" or "on" handlers, add "async" keyword to the function
* change any instance of 'message_received' to 'message'
* add "await" keyword in front of all calls to bot.reply or bot.say or similar functions

convo changes:
* any call to startConversation or the like has to be updated to use BotkitConversation
* no longer has support for doing additional calls to convo.say or convo.ask from inside callbacks. this type of thing now has to be done using threads.
* must be created and added to dialogset at startup (not inside handler or dynamically)
* convo.ask and convo.say remain the same
* convo.ask handlers now get (response, convo, bot)
* can use bot.say to send adhoc messages
* convo.before takes a thread name, to fire before anything, set that to default.

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


## Typescript

## Hearing other types of things
    * lambda
    * regexps

## How to build a new adapter