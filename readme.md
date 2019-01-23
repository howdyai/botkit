# Botkit Next Major Release

This branch is home to the next major release of Botkit, which is based on a complete rewrite of the library.

This is a not a finished product! We are publishing it now as a preview so our community of 
developers, users and contributors can get involved. Some features are missing or not working,
and some features currently included may be removed. 

<a href="https://github.com/howdyai/botkit/projects/9">View the roadmap planning board for this release</a>

* Keep as much of the feature set, syntax and special sauce developers know and love
* Solve persistent and hard to solve problems in previous versions of Botkit
* Use modern Javascript language features like async/await instead of callbacks
* Typescript!
* Break platform adapters (and their large dependency trees) into optional packages
* Reorganize some related projects into a monorepo
* Inheret much goodness from [Bot Builder](https://github.com/microsoft/botbuilder-js)

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

## New Botkit Basics

A [test bot](packages/testbot) is included can be cloned. Eventually a scaffolding template will be added (see project plan)[https://github.com/howdyai/botkit/projects/9#card-15948794], but for now use this.

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
```

Note big differences here from previous versions of Botkit: 

* async/await: the hears handler now takes an async function. We can now `await` the results of bot.reply.
* without a platform, botkit now speaks the generic botframework adapter protocol, making it easy to use the emulator and other tools


### Using Bot Framework Channels

Bot Framework provides a unified interface to many different platforms, including Microsoft products like Microsoft Teams, Skype, Cortana, but also including platforms like Slack, and email. 

To use Botkit with the Bot Framework channel service, pass in an `adapterConfig` parameter [matching this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=botbuilder-ts-latest). 

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


