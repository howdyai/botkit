# Botkit Core Docs


## New Botkit Basics

In this simple example below, Botkit creates a webhook endpoint for communicating with the [Bot Framework Emulator](https://aka.ms/botemulator), and is configured with a single "hears" handler that instructs Botkit to listen for a wildcard pattern, and to respond to any incoming message.

```javascript
const { Botkit } = require('botkit');

const controller = new Botkit({
    debug: true,
    webhook_uri: '/api/messages',
});

controller.hears('.*','message', async(bot, message) => {

    await bot.reply(message, 'I heard: ' + message.text);

});

controller.on('event', async(bot, message) => {
    await bot.reply(message,' I received an event of type ' + message.type);
});
```

### Building Features



### Using Bot Framework Channels

Bot Framework provides a unified interface to many different platforms, including Microsoft products like Microsoft Teams, Skype, Cortana, but also including platforms like Slack, and email. 

To use Botkit with the Bot Framework channel service, pass in an `adapterConfig` parameter [matching this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=botbuilder-ts-latest), and configure the channel service with the appropriate endpoint URL.

```javascript
const controller = new Botkit({
    debug: true,
    webhook_uri: '/api/messages',
    adapterConfig: {
        appId: process.env.appId,
        appPassword: process.env.appPassword
    }
});
```

### Using Platform Adapters

....



### Multi-turn Conversations

Botkit's new multi-turn conversation system is built on top of [Bot Builder's dialog stack](https://www.npmjs.com/package/botbuilder-dialogs) that provides many built-in niceties like conversation persistence, typed prompts with validators, and other advanced features. All of these features may now be used alongside Botkit!

#### Botkit Conversations

Much of the original `convo` syntax from previous versions of Botkit is still available in this new version. However, in order to provide conversation persistence and other features, some syntax and capabilities have been changed.

The biggest change is that conversations must now be created and made available to Botkit at runtime, rather than being constructed dynamically inside handler functions.  

**NOTE: these functions are heavily in flux! The syntax and features below WILL CHANGE!**

For example:

```javascript
const { BotkitConversation } = require('botkit');

// define the conversation
const onboarding = new BotkitConversation('onboarding');

onboarding.say('Hello human!');
// collect a value with no conditions
onboarding.ask('What is your name?', async(answer) => { 
    // do nothing.
}, {key: 'name'});

// collect a value with conditional actions
onboarding.ask('Do you like tacos?', [
    {
        pattern: 'yes',
        handler: async function(answer, convo, bot) {
            await convo.gotoThread('likes_tacos');
        }
    },
    {
        pattern: 'no',
        handler: async function(answer, convo, bot) {
            await convo.gotoThread('hates_life');
        }
    }
],{key: 'tacos'});

// define a 'likes_tacos' thread
onboarding.addMessage('HOORAY TACOS', 'likes_tacos');

// define a 'hates_life' thread
onboarding.addMessage('TOO BAD!', 'hates_life');

// handle the end of the conversation
onboarding.after(async(results, bot) => {
    const name = results.name;
});

// add the conversation to the dialogset
controller.dialogSet.add(onboarding);

// launch the dialog in response to a message or event
controller.hears(['hello'], 'message', async(bot, message) => {
    bot.beginDialog('onboarding');
});
```

#### Botkit CMS

[Botkit CMS](https://github.com/howdyai/botkit-cms) is an external content management system for dialogs systems. Botkit can automatically attach to a CMS instance and import content into dialogs automatically.

In order to enable this functionality, configure the botkit controller with information about your CMS instance:

```javascript
const controller = new Botkit({
    cms: {
        cms_uri: process.env.cms_uri,
        token: process.env.cms_token,
    }
})
```

To use the Botkit CMS trigger API to automatically evaluate messages and fire the appropriate dialog, use `controller.cms.testTrigger()` as below:

```javascript
controller.on('message', async (bot, message) => {
    let results = await controller.cms.testTrigger(bot, message);
});
```

Developers may hook into the dialogs as they execute using `controller.cms.before`, `controller.cms.after`, and `controller.cms.onChange`.

NOTE: Before handlers can be bound to a dialog, it must exist in the dialogSet.  To make sure this has happened, place any handler definitions inside a call to `controller.ready()`, which will fire only after all dependent subsystems have fully booted.

```javascript
controller.ready(() => {    
    // fire a function before the `default` thread begins
    // and set a variable available to the template system
    controller.cms.before('onboarding','default', async (bot, convo) => {
        convo.vars.foo = 'foo';
    });

    controller.cms.onChange('onboarding','name', async(value, convo, bot) => {
        if (value === 'quit') {
            convo.gotoThread('quit');
        }
    });

    controller.cms.after('onboarding', async(results, bot) => {
        // do something with results
    });
});
```

#### Native Bot Builder Dialogs

Bot Builder dialogs can live alongside Botkit!  Define dialogs using `WaterfallDialogs`, `ComponentDialogs`, or your own derived dialog class.  Then, make them available for your bot to use by calling `controller.dialogSet.add()`:

```javascript
const { WaterfallDialog } = require('botbuilder-dialogs');

const myWelcomeDialog = new WaterfallDialog('welcome', [
    async (step) => {
        await step.context.sendActivity('Welcome!');
        return await step.next();
    },
    async (step) => {
        await step.context.sendActivity('Other do other stuff!');
        return await step.next();
    }
]);

controller.dialogSet.add(myWelcomeDialog);
```

In order to trigger the dialog from within a Botkit handler function, call `await bot.beginDialog('dialog_id');` as below:

```javascript
botkit.hears(['hello'], 'message', async(bot, message) => {
    await bot.beginDialog('welcome');
});
```

## Building & Using Plugins

... COMING SOON ...

## Enable Conversation Persistence

... COMING SOON ...
