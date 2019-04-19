# Botkit Core 

Table of Contents

* [The Botkit Controller](#the-botkit-controller)
* [Receiving Messages](#receiving-messages-and-events)
* [Sending Messages](#sending-messages)
* [Using Dialogs](#using-dialogs)


## The Botkit Controller

The robot brain inside every Botkit applications is the `controller`, an interface that is used to define all the features and functionality of an app. Botkit's core library provides a platform-independent interface for sending and receiving messages so that bots on any platform can be created using the same set of tools.

By attaching event handlers to the controller object, developers can specify what type of messages and events their bot should look for and respond to, including keywords, patterns and status events. These event handlers can be thought of metaphorically as skills or features the robot brain has -- each event handler defines a new "When a human says THIS the bot does THAT."

Once created, the controller will handle incoming messages, [spawn bot instances](reference/core.md#spawn) and [trigger handlers](#receiving-messages-and-events).

For each platform, there is a specialized version of the controller object. These specialized controllers customize Botkit's core features to work with the platform, and add additional features above and beyond core that offer developers access platform-specific features.

Botkit can connect to multiple messaging channels through the [Microsoft Bot Framework Service](https://dev.botframework.com).
No plugins are necessary to use the Bot Framework service, and bots can be developed locally using the [Bot Framework Emulator](https://aka.ms/botemulator). [Read more about using the Bot Framework](#using-bot-framework-channels).

The Botkit project includes several official adapters. Using these plugins, your bot can communicate directly with the messaging platforms. Each platform has its own set of configuration options - refer to the platform connector docs for details:

* [Web and Apps](platforms/websocket.md)
* [Slack](platforms/slack.md)
* [Webex Teams](platforms/webex.md)
* [Google Hangouts](platforms/hangouts.md)
* [Facebook Messenger](platforms/facebook.md)
* [Twilio SMS](platforms/twilio-sms.md)

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
controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'],['message'],async (bot,message) => {

  // do something to respond to message
  await bot.reply(message,'Oh hai!');

});
```

**Interruptions**

// TODO: write about interruptions!

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
// (onloy hear a message if user is already in the database)
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
original Botkit "convo" syntax: Dialogs are created using functions like [convo.ask()](reference/core.md#ask) and [convo.say()](reference/core.md#say-1), and dynamic actions can be implemented using a hook system ([convo.before()](reference/core.md#before), [convo.after()](reference/core.md#after) and [convo.onChange()](reference/core.md#onchange)) that provides conversation context and a `bot` worker object at key points in the dialog's execution.

[Read all about Botkit Conversations &rarr;](conversations.md)

A simple example:
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


### Botkit CMS

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

### Native Bot Builder Dialogs

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

## Enable Conversation Persistence

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

// TODO: talk about the yeoman template and starter kits

We recommend bundling your bot's features into simple JavaScript modules, and then loading them into your app using `controller.loadModules('path/to/modules')`.

Make sure your modules follow the form below:

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
    debug: true,
    webhook_uri: '/api/messages',
    adapterConfig: {
        appId: process.env.appId,
        appPassword: process.env.appPassword
    }
});
```


## Building & Using Plugins

... COMING SOON ...
* controller.usePlugin()
* controller.getLocalView()
* controller.publicFolder()


