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
which contains an unmodified version of the BotBuilder Activity, or even further into `message.incoming_message.channelData` which contains the raw incoming event from the platform.

## Matching Patterns and Keywords with `hears()`

In addition to traditional event handlers, Botkit also provides the [controller.hears()](reference/core.md#hears) function,
which configures event handlers that look for specific keywords or phrases in the message.

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
controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'],['message_received'],async (bot,message) => {

  // do something to respond to message
  await bot.reply(message,'Oh hai!');

});
```

### Matching regular expressions

// TODO

### Matching with a function

// TODO

## Sending Messages

Botkit bots can send messages in several different ways, depending on the type and number of messages that will be sent.

Simple replies requiring only one message in response to an incoming event can be sent using the [bot.reply()](reference/core.md#reply) function.

Bots can originate messages - that is, send a message based on some internal logic or external stimulus -
using [bot.say()](reference/core.md#say) method. Each platform adapter provides helper mechanisms for setting the context for calling `bot.say()` in the appropriate channel or with the appropriate user.

For sequences of messages, including multi-message conversations, branching dialogs and other types of conversational experience, use [dialogs](#using-dialogs)

## Single Message Replies to Incoming Messages

Once a bot has received a message using a [controller.on()](reference/core.md#on) or [controller.hears()](reference/core.md#hears) event handler, a response
can be sent using [bot.reply()](reference/core.md#reply).

Messages sent using `bot.reply()` are sent immediately. If multiple messages are sent via
`bot.reply()` in a single event handler, they will arrive in the  client very quickly
and may be difficult for the user to process.

You may pass either a string, or a message object to the function.

Message objects may also contain any additional fields supported by the messaging platform in use. Refer to the platform-specific docs for more information.

## Using Dialogs

Botkit's new multi-turn conversation system is built on top of [Bot Builder's dialog stack](https://www.npmjs.com/package/botbuilder-dialogs) that provides many built-in niceties like conversation persistence, typed prompts with validators, and other advanced features. All of these features may now be used alongside Botkit!

#### Botkit Conversations

Much of the original `convo` syntax from previous versions of Botkit is still available in this new version. However, in order to provide conversation persistence and other features, some syntax and capabilities have been changed.

The biggest change is that conversations must now be created and made available to Botkit at runtime, rather than being constructed dynamically inside handler functions.  

[Read all about Botkit Conversations &rarr;](conversations.md)

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

### Organize Your Bot Code

// TODO: talk about the yeoman template and starter kits

We recommend bundling your bot's features into simple JavaScript modules, and then loading them into your app using `controller.loadModules('path/to/modules')`.

Make sure your modules follow the form below:

```javascript
module.exports = function(controller) {

    // define your dialogs, as well as your hears() or on() handlers
    // ...
}
```

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

## Enable Conversation Persistence

... COMING SOON ...



## Building & Using Plugins

... COMING SOON ...

