# botbuilder-adapter-facebook
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Facebook Messenger.

This package contains an adapter that communicates directly with the Facebook Messenger API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Facebook Messenger.

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](https://botkit.ai/getstarted.html)

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-facebook
```

Import the adapter class into your code:

```javascript
const { FacebookAdapter } = require('botbuilder-adapter-facebook');
```

## Use FacebookAdapter in your App

FacebookAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can easily work with the Facebook Messenger API while taking advantage of all the extensions provided by these powerful and specialized SDKs.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Facebook.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

```javascript
const { FacebookAdapter } = require('botbuilder-adapter-facebook');
const { Botkit } = require('botkit');

const adapter = new FacebookAdapter({
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
    app_secret: process.env.FACEBOOK_APP_SECRET,
    access_token: process.env.FACEBOOK_ACCESS_TOKEN 
});

const controller = new Botkit({
    adapter,
    // ...other options
});

controller.on('message', async(bot, message) => {
    await bot.reply(message, 'I heard a message!');
});
```

### BotBuilder Basics

Alternately, developers may choose to use `FacebookAdapter` with BotBuilder. With BotBuilder, the adapter is used more directly with a webserver, and all incoming events are handled as [Activities](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest).

```javascript
const { FacebookAdapter } = require('botbuilder-adapter-facebook');
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         await context.sendActivity('I heard a message!');
     });
});
```

### Multi-page Support

In the examples above, the `FacebookAdapter` constructor received a single `access_token` parameters. This binds the adapter and all API calls it makes to a single Facebook page.

To use `FacebookAdapter` with multiple Facebook pages, the constructor must receive a function as a paramter named `getAccessTokenForPage` that is responsible for returning a token value when provided a Facebook page ID. The application must implement its own mechanism for securely storing and retrieving the token.

```javascript
const adapter = new FacebookAdapter({
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
    app_secret: process.env.FACEBOOK_APP_SECRET,
    getAccessTokenForPage: async(pageId) => { 
        // do something to fetch the page access token for pageId.
        return token;
    })
});
```

### Class Reference

* [FacebookAdapter](../docs/reference/facebook.md#facebookadapter)
* [BotWorker Extensions](../docs/reference/facebook.md#facebookbotworker)
* [Facebook API Client](../docs/reference/facebook.md#facebookapi)

## Event List

[Botkit event types are controlled by the FacebookEventMiddleware](../docs/reference/facebook.md#facebookeventtypemiddleware)

## Calling Facebook APIs

This package also includes [a minimal Facebook API client](../docs/reference/facebook.md#facebookapi) for developers who want to use one of the many available API endpoints.

In Botkit handlers, the `bot` worker object will contain a `bot.api` that is preconfigured and read to go.

To use with a BotBuilder application, the adapter provides the [getAPI() method](../docs/reference/facebook.md#getapi).

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](../../CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](LICENSE.md)