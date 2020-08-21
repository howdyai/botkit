# Botkit Core 

Table of Contents

* [The Botkit Controller](#the-botkit-controller)
* [Botkit Basics](#botkit-basics)
* [Receiving Messages](#receiving-messages-and-events)
* [Sending Messages](#sending-messages)
* [Using Dialogs](#using-dialogs)
* [Organize Your Bot Code](#organize-your-bot-code)
* [Using Bot Framework Channels](#using-bot-framework-channels)
* [Building & Using Plugins](#building--using-plugins)
* [Middlewares](#middlewares)

## The Botkit Controller

The robot brain inside every Botkit applications is the `controller`, an interface that is used to define all the features and functionality of an app. Botkit's core library provides a platform-independent interface for sending and receiving messages so that bots on any platform can be created using the same set of tools.

By attaching event handlers to the controller object, developers can specify what type of messages and events their bot should look for and respond to, including keywords, patterns and status events. These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human says THIS the bot does THAT."

Once created, the controller will handle incoming messages, [spawn bot instances](reference/core.md#spawn) and [trigger handlers](#receiving-messages-and-events).

For each platform, there is a specialized version of the controller object. These specialized controllers customize Botkit's core features to work with the platform, and add additional features above and beyond core that offer developers access platform-specific features.

Botkit can connect to multiple messaging channels through the [Microsoft Bot Framework Service](https://dev.botframework.com).
No plugins are necessary to use the Bot Framework service, and bots can be developed locally using the [Bot Framework Emulator](https://aka.ms/botemulator). [Read more about using the Bot Framework](#using-bot-framework-channels).

The Botkit project includes several official adapters. Using these plugins, your bot can communicate directly with the messaging platforms. Each platform has its own set of configuration options - refer to the platform connector docs for details:

* [Web and Apps](platforms/web.md)
* [Slack](platforms/slack.md)
* [Webex Teams](platforms/webex.md)
* [Google Hangouts](platforms/hangouts.md)
* [Facebook Messenger](platforms/facebook.md)
* [Twilio SMS](platforms/twilio-sms.md)
* [Microsoft Teams](#ms-teams-extensions)

In addition, the open source community has created a variety of plugins and extensions to Bot Framework.  Check out the [Bot Builder Community Repo](https://github.com/BotBuilderCommunity/botbuilder-community-js) for additional adapters, storage connectors and middlewares.

## Botkit Basics

In this simple example below, Botkit creates a webhook endpoint for communicating with the [Bot Framework Emulator](https://aka.ms/botemulator), and is configured with a single "hears" handler that instructs Botkit to listen for a wildcard pattern, and to respond to any incoming message.

```javascript
const { Botkit } = require('botkit');

const controller = new Botkit({
    webhook_uri: '/api/messages',
});

controller.hears('.*','message', async(bot, message) => {

    await bot.reply(message, 'I heard: ' + message.text);

});

controller.on('event', async(bot, message) => {
    await bot.reply(message,'I received an event of type ' + message.type);
});
```

## Receiving Messages and Events

Once connected to a messaging platform, bots receive a constant stream of events - everything from the normal messages you would expect to typing notifications and presence change events. The set of events your bot will receive will depend on what messaging platform it is connected to.

To respond to events, use [controller.on()](reference/core.md#on) to define a handler function that receives the event details and takes actions.

Incoming events will be in [this format](reference/core.md#botkitmessage).

Note that Botkit leaves all the native fields intact, so any fields that come in from the platform are still present in the object.
However, our recommendation for accessing any platform-native fields is to use the `message.incoming_message` field
which contains an unmodified version of the [BotBuilder Activity](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest), or reach even further into `message.incoming_message.channelData` which contains an unmodified copy of the raw source webhook payload.

### Matching Patterns and Keywords with `hears()`

In addition to traditional event handlers, Botkit also provides the [controller.hears()](reference/core.md#hears) function, which configures event handlers that look for specific keywords or phrases in the message.

Each call to `controller.hears()` sets up a separate set of patterns to listen for.
Developers may specify a single pattern to match, or an array of patterns.
By default, Botkit treats these patterns as regular expressions to be evaluated against the `message.text` field in incoming messages.

In addition to the array of patterns, `hears()` also receives as an argument one or more event types.
Only events of the type listed will be evaluated.

It is important to note that Botkit will *stop processing handlers* when the first `hears()` trigger is matched.
Triggers are evaluated in the order in which they are defined in the code.
This is a major difference in the way most event handling systems work, which will fire all matching handlers, and differs from handlers
configured with [controller.on()](reference/core.md#on), which behave as expected.

```javascript
controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'],['message'], async (bot,message) => {

  // do something to respond to message
  await bot.reply(message,'Oh hai!');

});
```

### Interruptions

Some bots have certain operations that should take precidence, even if that means stopping or interupting an ongoing conversation. Near universal examples of this are providing a "help" command, and providing a "quit" mechanism.

For this type of trigger, Botkit provides a version of "hearing" that occurs _before_ any other processing of the message: [interrupts()](reference/core.md#interrupts). Botkit will look for interruptions before passing the message through the dialog system, and before looking for any other triggers. `interrupts()` works just like `hears()` - it takes the same parameters, and functions the same way: if a trigger is matched, further processing of the message is halted.

[Learn more about ways to combine multiple dialogs into bigger experiences](conversations.md#composing-dialogs)


```javascript
controller.interrupts('help', 'message', async(bot, message) => {
    // start a help dialog, then eventually resume any ongoing dialog
    await bot.beginDialog(HELP_DIALOG);
});

controller.interrupts('quit', 'message', async(bot, message) => {
    await bot.reply(message, 'Quitting!');

    // cancel any active dialogs
    await bot.cancelAllDialogs();
});
```

### Matching regular expressions

In addition to simple keyword matches, `hears()` can also accept one or more [regular expressions](https://regex101.com/) that will match against the `message.text` with more control. 

When using regular expressions, any capture groups will resulting from the test can be found in `message.matches`.

```javascript
controller.hears(new RegExp(/^reboot (.*?)$/i), 'message', async(bot, message) => {

    // message.matches is the result of message.text.match(regexp) so in this case the parameter is in message.matches[1]
    let param = message.matches[1];
    await bot.reply(message, `I will reboot ${ param }`);

});
```

### Matching with a function

For more sophisticated matches, `hears()` can also accept one or more test functions.  These test functions must be in the form:

```javascript
async (message) => {
    // some test
    if (some_test) {
        return true;
    } else {
        return false;
    }
}
```

Using async functions to match triggers allows nearly limitless mechanisms to be put in play to evaluate a message. Functions can be used to test fields other than `message.text,` for example, or can test for fields added by middleware plugins such as possible `intents` added by an NLP middleware.

Here are a few examples:
```javascript
// "listen" for the message.intent field to be set to "help"
controller.hears(async(message) => { return message.intent==="help" }, 'message', async(bot, message) => { 
    // do something
});

// listen for extremely long messages
controller.hears(async(message) => { return (message.text.length > 100) }, 'message', async(bot, message) => { 
    // do something
});

// compare a value in the message against a database
// (only hear a message if user is already in the database)
controller.hears(async(message) => {
    return new Promise((resolve, reject) => {
        myDatabase.get(message.user).then(function(user) {
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).catch(reject);
    });
},  'message', async(bot, message) => {
    // handle trigger
});

// listen for a facebook sticker
controller.hears(async(message) => { return message.sticker_id; }, 'message', async(bot, message) => {
    await bot.reply(message,'cool sticker.');
});
```

## Sending Messages

Sending messages is a bots primary way of communicating with users and presenting its interface to the world.
There are three primary scenarios in which bots send messages:

* [Sending replies to incoming messages](#replying-to-incoming-messages)
* [Sending alerts and scheduled messages](#sending-alerts-and-scheduled-messages)
* [Conducting multi-message dialog scripts](#using-dialogs)

## Replying to Incoming Messages

Once a bot has received a message using a [controller.on()](reference/core.md#on) or [controller.hears()](reference/core.md#hears) event handler, a response can be sent using [bot.reply()](reference/core.md#reply).

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive one after another with no delay.

A simple echo response:
```javascript
controller.on('message', async(bot, message) => {
    await bot.reply(message, 'I heard you say something!');
});
```

Reply messages can contain additional fields - what features are available depends on the messaging platform in use.
Botkit will automatically map message fields to the appropriate, platform-specific location.

```javascript
controller.on('message', async(bot, message) => { 

    await bot.reply(message, {
        text: 'Here is a menu!',
        quick_replies: [
            {
                title: "Main",
                payload: "main-menu",
            },
            {
                title: "Help",
                payload: "help"
            }
        ]
    });
});
```

## Sending alerts and scheduled messages

There are some cases when a bot will send a message to a user that is not in direct response to an incoming message.

* In response to an external event such as a webhook from a third party integration
* Based on a cronjob or some other scheduling mechanism
* Sending timed or scheduled broadcast messages

To do this requires a few pieces of information - credentials necessary to make API calls, and a complicated set of fields that comprise a "conversation reference" that points to a specific user in a specific channel on a specific platform. Botkit provides a few helper functions that make this a bit easier to manage.

To send this type of "proactive" message, you must first [spawn](reference/core.md#spawn) a [bot](reference/core.md#botworker), then give it a context (usually a user id, or a user id + channel) for it to do stuff like send messages and [start dialogs](#using-dialogs).

It looks _something_ like the code below, though it should be noted that there are variations in how `controller.spawn()` works from platform to platform -- notably [Slack](reference/slack.md#create-a-new-slackbotworker) and [Facebook](reference/facebook.md#create-a-new-facebookbotworker) -- and also some variation in the availability of helper functions like `startConversationWithUser()` used below.  Check [platform docs](platforms/index.md) for these details!

```javascript
async (trigger) => {

    // there's a user id somewhere in this trigger
    let user = trigger.userid;

    // spawn a bot
    let bot = await controller.spawn();

    await bot.startConversationWithUser(user);

    await bot.say('ALERT! A trigger was detected');
    await bot.beginDialog(ALERT_DIALOG);

}
```

### Capture a reference from an incoming message

Each incoming message received by Botkit contains a conversation reference in the `message.reference` field.
Capture this reference value and store it for later use with [bot.changeContext()](reference/core.md#changecontext) 
to continue sending messages _in that same context_.

Imagine a bot that, hearing the keyword "subscribe" captures the reference for use to later send a push notification:

```javascript
controller.hears('subscribe', 'message', async(bot, message) => {

    let reference = message.reference;
    let user = message.user;

    // store reference associated with user
    await mydatabase.subscribeUser(user, reference);

    await bot.reply(message, 'You are subscribed to alerts in this channel.');

});
```

Later, an alert is to be generated for the user based on an trigger of some sort:
```javascript
async(trigger) => {

    let user = trigger.userid;
    let reference = mydatabase.getSubscription(user);
    
    let bot = await controller.spawn();
    await bot.changeContext(reference);

    await bot.say('Breaking news!');

}
```

### Use a platform-specific `startConversation*` method

Most of the platform adapters provide convenience methods that can use used to begin or resume a conversation with a user based on their user id, as well as other relevant factors such as channel id. These can be used in lieu of capturing a pre-existing reference from an incoming message.

* [Slack](platforms/slack.md#start-or-resume-conversations-with-people)
* [Facebook](reference/facebook.md#startconversationwithuser)
* [Webex Teams](reference/webex.md#startconversationinroom)
* [Twilio SMS](reference/twilio-sms.md#startconversationwithuser)
* [Google Hangouts](reference/hangouts.md#startconversationinthread)


## Using Dialogs

Botkit's multi-turn conversation system is built on top of [BotBuilder's dialog system](https://www.npmjs.com/package/botbuilder-dialogs) that provides many built-in niceties like [conversation state persistence](#enable-conversation-persistence), [typed prompts with validators](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0#prompts), and other advanced features. All of these features may now be used alongside Botkit!

Dialogs contain pre-defined "maps" for conversations that can be triggered in various ways. Think of a dialog as a the script for an interactive, potentially branching conversation the bot can conduct. Dialogs can contain conditional tests, branching patterns, and dynamic content. There are a variety of ways to create dialogs, including one that [uses Botkit's familar syntax](conversations.md), as well as BotBuilder's own [WaterfallDialogs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-dialogs/waterfalldialog?view=botbuilder-ts-latest).

In order to use a dialog, it must first be defined and added to the bot's dialog stack. Below is an example showing the use of the `BotkitConversation` dialog type.

```javascript
// Import the BotkitConversation dialog class
const { BotkitConversation } = require('botkit');

// Create a very simple dialog with 2 messages.
let DIALOG_ID = 'my_dialog_1';
let myDialog = new BotkitConversation(DIALOG_ID, controller);
myDialog.say('Hello!');
myDialog.say('Welcome to the world of bots!');

// Add the dialog to the bot
controller.addDialog(myDialog);

// Later, trigger the dialog
controller.on('channel_join', async(bot, message) => {
    await bot.beginDialog(DIALOG_ID);
});
```

Dialog objects, once defined, are added to the bot using [controller.addDialog()](reference/core.md#adddialog) and
then triggered with [bot.beginDialog()](reference/core.md#begindialog).

### Botkit Conversations

[BotkitConversation](reference/core.md#botkitconversation) provides an interface for creating dialogs that is based on the
original Botkit "convo" syntax: Dialogs are created using functions like [convo.ask()](reference/cms.md#ask) and [convo.say()](reference/cms.md#say), and dynamic actions can be implemented using a hook system ([convo.before()](reference/cms.md#before), [convo.after()](reference/cms.md#after) and [convo.onChange()](reference/cms.md#onchange)) that provides conversation context and a `bot` worker object at key points in the dialog's execution.

[Read all about Botkit Conversations &rarr;](conversations.md)

A simple example:
```javascript
const { BotkitConversation } = require('botkit');

// define the conversation
const onboarding = new BotkitConversation('onboarding', controller);

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
controller.addDialog(onboarding);

// launch the dialog in response to a message or event
controller.hears(['hello'], 'message', async(bot, message) => {
    bot.beginDialog('onboarding');
});
```


### Botkit CMS

[Botkit CMS](https://github.com/howdyai/botkit-cms) is an external content management system for dialogs systems. Botkit can automatically attach to a CMS instance and import content into [BotkitConversation](reference/core.md#botkitconversation) objects automatically.

In order to enable this functionality, add the [botkit-plugin-cms](plugins/cms.md) plugin to your application, and
load it into your Botkit controller at bootup using [controller.usePlugin()](reference/core.md#useplugin) as seen below:

```javascript
const { BotkitCMSHelper } = require('botkit-plugin-cms');

const controller = new Botkit(OPTIONS);
controller.usePlugin(new BotkitCMSHelper({
    uri: process.env.CMS_URI,
    token: process.env.CMS_TOKEN
}));
```

Loading the plugin this way will extend the controller with new object at `controller.plugins.cms` with [these helpful methods](reference/cms.md#botkitcmshelper-class-methods).

To use the Botkit CMS trigger API to automatically evaluate messages and fire the appropriate dialog, use `controller.plugins.cms.testTrigger()` as below:

```javascript
controller.on('message', async (bot, message) => {
    let results = await controller.plugins.cms.testTrigger(bot, message);
});
```

Developers may hook into the dialogs as they execute using 
[controller.plugins.cms.before()](reference/cms.md#before),
[controller.plugins.cms.after()](reference/cms.md#after),
and [controller.plugins.cms.onChange()](reference/cms.md#onchange).
These methods operate identically to the [BotkitConversation analogs of these methods](reference/core.md#botkitconversation-class-methods), but take an additional parameter of the dialog's _name_, allowing handlers to be bound to the externally loaded content.

NOTE: Before handlers can be bound to a dialog, it must exist in the dialogSet.  To make sure this has happened, place any handler definitions inside a call to `controller.ready()`, which will fire only after all dependent subsystems have fully booted.

```javascript
controller.ready(() => {    
    // fire a function before the `default` thread begins
    // and set a variable available to the template system
    controller.plugins.cms.before('onboarding','default', async (bot, convo) => {
        convo.vars.foo = 'foo';
    });

    controller.plugins.cms.onChange('onboarding','name', async(value, convo, bot) => {
        if (value === 'quit') {
            convo.gotoThread('quit');
        }
    });

    controller.plugins.cms.after('onboarding', async(results, bot) => {
        // do something with results
    });
});
```

### Native Bot Builder Dialogs

[BotBuilder dialogs](https://npmjs.com/package/botbuilder-dialogs) can live alongside Botkit!  Define dialogs using `WaterfallDialogs`, `ComponentDialogs`, or your own derived dialog class.  Then, make them available for your bot to use by calling `controller.addDialog()`:

[Read about BotBuilder dialogs in Microsoft's official documentation &rarr;](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)

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

controller.addDialog(myWelcomeDialog);
```

In order to trigger the dialog from within a Botkit handler function, call `await bot.beginDialog('dialog_id');` as below:

```javascript
botkit.hears(['hello'], 'message', async(bot, message) => {
    await bot.beginDialog('welcome');
});
```

### Enable Conversation Persistence

Bots that [use dialogs](#using-dialogs) for complex interactions require the ability to store and retrieve the conversation state from an external source such as a database. Without a storage mechanism in place, the bot will "forget" the state of conversations when the application is restarted.

Botkit relies on [BotBuilder's storage protocol](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/storage?view=botbuilder-ts-latest) and a wide array of open source storage implementations to provide these features. Conversation state is managed automatically once enabled.

Once implemented, the state of a conversation will be persisted between restarts. In addition, when using a storage mechanism, bot applications can be deployed in multi-node, load balanced scenarios.

Below is an example of configuring Botkit to use MongoDB to store conversation state using [botbuilder-storage-mongodb](https://npmjs.com/package/botbuilder-storage-mongodb)

```javascript
const { MongoDbStorage } = require('botbuilder-storage-mongodb');
let storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
});
const controller = new Botkit({
    storage: storage
});
```

[More storage implementations can be found by searching NPM for "botbuilder-storage" &rarr;](https://www.npmjs.com/search?q=botbuilder-storage)



## Organize Your Bot Code

The [recommended application structure](advanced.md#anatomy-of-a-botkit-app) can created quickly by using the [Yeoman Generator](index.md#install-botkit)
or one of the remixable starter kits.

A Botkit application usually has 2 main components: a main app file called `bot.js` where Botkit is configured, and a folder of modules that get automatically loaded into the application.

The bot's features - all of the stuff involved in defining trigger patterns, dialogs, custom middlewares and handlers - are organized into JavaScript modules, and then loaded into the app using [controller.loadModules()](reference/core.md#loadmodules). If you are using Typescript, make sure to include `ts` extension into the second parameter as a string array (default is `['.js']`, and you probably want it to be `['.js', '.ts']`). Each feature file should contain only the code required for a specific feature. This will help to keep the project code well organized and modular.

The feature modules follow the form below:

```javascript
module.exports = function(controller) {

    // define your dialogs, as well as your hears() or on() handlers
    // ...
}
```

## Using Bot Framework Channels

Bot Framework provides a unified interface to many different platforms, including Microsoft products like Microsoft Teams, Skype, Cortana, but also including platforms like Slack, and email. 

To use Botkit with the Bot Framework channel service, pass in an `adapterConfig` parameter [matching this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=botbuilder-ts-latest), and configure the channel service with the appropriate endpoint URL.

```javascript
const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapterConfig: {
        appId: process.env.appId,
        appPassword: process.env.appPassword
    }
});
```

## MS Teams Extensions

Several helper extensions are included for using Botkit with Microsoft Teams. Connecting to Teams does not require a customized adapter - Botkit's default adapter does the job. However, to ease the use of advanced features in Teams, Botkit includes several extensions.

* The [TeamsInvokeMiddleware](reference/core.md#teamsinvokemiddleware) is an optional adapter middleware which will cause Botkit to emit specially named events related to Teams "invoke" events. With this middleware enabled, Botkit will emit "task/fetch" and "task/submit" events, rather than plain "invoke" events.
* The BotWorker returned by this adapter includes `bot.teams`, which is an instance of the TeamsInfo helper. Using this, bots can access additional information about Teams. [See Docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder/teamsinfo?view=botbuilder-ts-latest).
* The BotWorker also includes a helper method, `bot.replyWithTaskInfo()` that can be used to respond to Task Module related events. [See Docs](reference/core.md#replywithtaskinfo)

Set up adapter with middleware:

```javascript
const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapterConfig: {
        appId: process.env.appId,
        appPassword: process.env.appPassword
    }
});
controller.adapter.use(new TeamsInvokeMiddleware());
```

Access Teams specific APIs:
```javascript
controller.hears('getTeamDetails', 'message', async(bot, message) => {
    try {
    await bot.reply(message, JSON.stringify(await bot.teams.getTeamDetails(bot.getConfig('context'))));
    } catch(err) {
    await bot.reply(message, err.message);
    }
});
```

Respond to Task Modules:
```javascript
controller.on('task/fetch', async(bot, message) => {
    await bot.replyWithTaskInfo(message, {type: 'continue', value: { ... }});
});
```

## Building & Using Plugins

Botkit includes a plugin loader that allows external packages to plugin to and modify the Botkit application.

Plugins can:
* Include middleware that is automatically applied
* Make additional extension methods available for the bot to use
* Add web routes to the application
* Expose static assets to the web server
* Define dialogs, triggers and handlers
* Be packaged and published as self-contained JavaScript modules

To use a plugin, use `usePlugin()`:
```javascript
let plugin = require('botkit-plugin-whatever');
controller.usePlugin(plugin);
``` 

A plugin module should contain an object (or a function that returns an object) in the form:
```javascript
module.exports = function(botkit) {

    return {
        // The name of the plugin. Used to log messages at boot time.
        name: 'My Plugin',
        // initialize this module. called at load time.
        init: function(controller) {
            // do things like:

            // expose the methods from this plugin as controller.plugins.myplugin.<method>
            // controller.addPluginExtension('myplugin', this);

            // make locally bundled content public on the webservice:
            // controller.publicFolder('/public/myplugin', __dirname + '/public);

            // add a web route
            // controller.webserver.get('/myplugin', async(req, res) => { 
            //      Use a local handlebars view (bundled with plugin) to render a page
            //      (hbs must be installed and initialized by plugin)
            //      res.render(controller.getLocalView(__dirname + '/views/main'));
            // });

            // can also define normal handlers
            // controller.on('event', async(bot, message) => { ... });
        },
        // Any middlewares that should be automatically bound
        // Can include more than 1 of each kind.
        middlewares: {
            ingest: [
                (bot, message, next) => { next(); }
            ],
            receive: [
                (bot, message, next) => { next(); }
            ],
            send: [
                (bot, message, next) => { next(); }
            ]
        },
        // this method will live at controller.plugins.myplugin.customMethod()
        customMethod: async() => {}
    }
}
```

Plugin related methods:
* [controller.usePlugin()](reference/core.md#useplugin)
* [controller.addPluginExtension()](reference/core.md#addpluginextension)
* [controller.getLocalView()](reference/core.md#getlocalview)
* [controller.publicFolder()](reference/core.md#publicfolder)
* [controller.plugins](reference/core.md#properties-and-accessors)

## Middlewares

Botkit middleware functions can be used to inspect and modify messages as they pass through.
There are a few types of middleware in the Botkit universe: 

* Botkit middleware - change the way Botkit itself handles messages
* BotBuilder adapter middleware - change the way the platform translation layer handles messages
* Webserver middleware - change the way the web server handles requests

### Botkit Middleware

Middleware can do things like:
* Log information about incoming and outgoing activity for debugging, analytics or other services
* Amend messages with additional information - for example, call an NLP service and add an "intent" field
* Intercept messages and prevent them from being processed
* Change the type of the resulting event that will be emitted

There are three endpoints available to register middleware functions:

| Name | Description
|--- |---
| ingest | occurs immediately after the message has been received, before any other processing
| receive | occurs after the message has been evaluated for interruptions and for inclusion in an ongoing dialog. signals the receipt of a message that needs to be handled.
| send | occurs just before a message is sent out of the bot to the messaging platform

Middleware functions are in the form:

```javascript
function myBotkitMiddleware(bot, message, next) { 
    // do stuff

    // call next, or else the message will be intercepted
    next();
}
```

To enable a middleware, register it at the appropriate endpoint:

```javascript
controller.middleware.ingest.use(myBotkitMiddleware);
```

### BotBuilder Adapter Middleware

BotBuilder adapters like those used by Botkit also support middleware.  Some of the adapters included in the Botkit project use these middleware to modify the "native" BotBuilder activity objects along the way so that they play nicer with Botkit -- for example, see [SlackEventMiddleware](reference/slack.md#slackeventmiddleware).

Middleware for BotBuilder works on a similar principle as Botkit, but comes in a different form.
In addition, BotBuilder middleware work on Activity objects, not Botkit messages.  [Read more about BotBuilder middleware here &rarr;](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-middleware?view=azure-bot-service-4.0)

BotBuilder middleware functions are in the form:
```javascript
async function myBotBuilderMiddleware(turnContext, next) {

    // do stuff with the turnContext BEFORE it is processed here

    // call next, make sure to use await
    // inside this next is where your whole bot does its thing!
    await next();

    // do stuff AFTER the message has been processed.
}
```

To enable a BotBuilder adapter middleware, register it on the adapter object:

```javascript
const adapter = new WebAdapter();
adapter.use(myBotBuilderMiddleware);
```

### Webserver Middleware

Webserver middleware - specifically [Express middleware](https://expressjs.com/en/guide/using-middleware.html) - can be used for a variety of purposes including logging, authentication, and adding functionality that is automatically called when urls are requested from your webserver.

Express middleware look like this:

```javascript
function myExpressMiddleware(req, res, next) {
    // do something useful.
    // for example, you can modify req and res

    // log the requested url. handy for debugging!
    console.log('REQ: ', req.url);

    // call next or else the request will be intercepted
    next();
}
```

To enable an Express middleware, register it using `controller.webserver.use()`:

```javascript
controller.webserver.use(myExpressMiddleware);
```
