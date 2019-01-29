# Botkit Next Major Release

This branch is home to the next major release of Botkit, which is based on a complete rewrite of the library.

**This is a not a finished product!** We are publishing it now as a preview so our community of 
developers, users and contributors can get involved. Some features are missing or not working,
and some features currently included may be removed. 

<a href="https://github.com/howdyai/botkit/projects/9">View the roadmap planning board for this release</a>

GOALS:
* Keep as much of the feature set, syntax and special sauce developers know and love
* Solve persistent and hard to solve problems in previous versions of Botkit
* Use modern JavaScript language features like async/await instead of callbacks
* Full Typescript support
* Break platform adapters (and their large dependency trees) into optional packages
* Reorganize some related projects into a monorepo
* Inherit much goodness from [Bot Builder](https://github.com/microsoft/botbuilder-js)
* Provide a way for bots to be extended with plugins and modular features, and for those plugins to provide a consistent interface to administrators

## Packages included in this repo

| Package | Description
|--- |---
| [botkit](packages/botkit) | Botkit Core library
| [botbuilder-slack](packages/botbuilder-slack) | A platform adapter for Slack
| [botbuilder-webex](packages/botbuilder-webex) | A platform adapter for Webex Teams
| [botbuilder-dialogs-botkit-cms](packages/botbuilder-dialogs-botkit-cms) | A library that allows using Botkit CMS content in Bot Builder apps (without Botkit)
| [testbot](packages/testbot) | A simple testing harness for use while this project is being developed


## Try the new version now

This repo contains multiple interlinked packages containing a new version of Botkit Core, new platform adapter packages, and some new and updated plugins. Until they're published on npm,
to use these libraries, they must be built locally using lerna and Typescript. 

Install dependencies globally:

```bash
npm install -g typescript
npm install -g lerna
```

Clone the entire Botkit project from Github.

```bash
git clone git@github.com:howdyai/botkit.git
```

Enter the new folder, and switch to the `next` branch.

```bash
cd botkit
git checkout next
npm install
```

Use lerna to set up the local packages:

```bash
lerna bootstrap --hoist
```

Now, build the libraries:

```bash
lerna run build
```

A [test bot](#using-test-bot) is included can be cloned. Eventually a scaffolding template will be added ([see project plan](https://github.com/howdyai/botkit/projects/9#card-15948794)), but for now use this.


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

Note big differences here from previous versions of Botkit: 

* async/await: the hears handler now takes an async function. We can now `await` the results of bot.reply.
* without a platform, botkit now speaks the generic botframework adapter protocol, making it easy to use the emulator and other tools


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

So far, we've got working (though not complete) adapters for Slack and Webex Teams.  These are now bundled as separate packages which can be optionally included in a project to grant access to platform features.

#### Using the Slack adapter for a single team

Import the Slack adapter.

```javascript
const { SlackAdapter } = require('botbuilder-slack');
```

Instantiate the adapter with a bot token and verification secret as provided in the Slack API dashboard.

```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    botToken: process.env.botToken,
});
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

Messages will arrive as type `message`, while most other events will arrive as `event` types.  This may change to more closely conform to previous Botkit event types (direct_message, etc).  See [Slack event middleware](#slack-event-middleware)

#### Using the Slack adapter for multiple teams

When used with multiple teams, developers must provide a mechanism for storing and retrieving tokens provided during the oauth flow.  See below.

Import the Slack adapter.  

```javascript
const { SlackAdapter } = require('botbuilder-slack');
```

Instantiate the adapter with a `clientId`, `clientSecret`, scopes, redirectUrl and verification secret as provided/configured in the Slack API dashboard.

In addition, pass in a `getTokenForTeam` parameter containing a function in the form `async (teamId) => { return tokenForTeam; }`  This function is responsible for loading an API token from _somewhere_ and providing it to Botkit for use in handling incoming messages.


```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri,
    getTokenForTeam: getTokenForTeam,
});
```

Here is a simple implementation of getTokenForTeam which loads tokens from an in-memory cache. Developers should store their tokens in an encrypted database.

```javascript
const tokenCache = [];
async function getTokenForTeam(teamId) {
    if (tokenCache[teamId]) {
        return tokenCache[teamId];
    } else {
        console.error('Team not found in tokenCache: ', teamId);
    }
}
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

Finally, expose new Oauth-related endpoints by binding new routes to the build in Express webserver accessible at `controller.webserver`.  Below is a simple implementation that stores the token provided by oauth in an in-memory cache.

```javascript
controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        tokenCache[results.team_id] = results.bot.bot_access_token;

        res.send('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});
```

#### Slack event middleware

The slack adapter includes an optional middleware that will modify the `.type` field of incoming events to match their slack event types (rather than being cast into generic "message or "event" types).

NOTE that the technique currently used (changing the type field) can interfere with Microsoft BotBuilder dialogs, and will likely change in upcoming versions.

Import the adapter and the middleware:

```javascript
// load SlackAdapter AND SlackEventMiddleware
const { SlackAdapter, SlackEventMiddleware} = require('botbuilder-slack');
```

Create your adapter (as above), then bind the middleware to the adapter:

```javascript
adapter.use(new SlackEventMiddleware());
```

Now, Botkit will emit events with their original Slack names:

```
controller.on('channel_join', async(bot, message) => {
    // do stuff
});
```

### Using the Webex Teams Adapter


Import the Webex adapter.

```javascript
const { WebexAdapter } = require('botbuilder-webex');
```

Instantiate the adapter with a bot token and the url public url of your bot:

```javascript
const adapter = new WebexAdapter({
    access_token: process.env.access_token,
    public_address: process.env.public_address
});
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

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

## Using Test Bot

This repo contains a [sample bot](packages/testbot) that can be used to test the SDK and adapters. 

In its included form, it will work with the Bot Framework Emulator to provide a testing interface.  Also included (But commented out) are sample Slack and Webex adapter configurations which can be enabled to test the bot on those platforms.

To start the test bot:
```bash
cd packages/testbot
node .
```

Then, open the Bot Framework Emulator and find then load [testbot.bot](packages/testbot/testbot.bot) to connect.

## Building & Using Plugins

... COMING SOON ...

## Enable Conversation Persistence

... COMING SOON ...
