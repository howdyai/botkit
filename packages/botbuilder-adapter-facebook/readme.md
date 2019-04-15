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

**Botkit Basics**
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
});

controller.on('message', async(bot, message) => {
    await bot.reply(message, 'I heard a message!');
});
```

**BotBuilder Basics**

Alternately, developers may choose to use FacebookAdapter with BotBuilder.


## Event List

## Calling Facebook APIs


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