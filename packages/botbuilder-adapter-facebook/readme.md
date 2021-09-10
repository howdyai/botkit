# botbuilder-adapter-facebook
Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Facebook Messenger.

This package contains an adapter that communicates directly with the Facebook Messenger API,
and translates messages to and from a standard format used by your bot. This package can be used alongside your favorite bot development framework to build bots that work with Facebook Messenger.

## Install Package

Add this package to your project using npm:

```bash
npm install --save botbuilder-adapter-facebook
```

Import the adapter class into your code:

```javascript
const { FacebookAdapter } = require('botbuilder-adapter-facebook');
```

## Get Started

If you are starting a brand new project, [follow these instructions to create a customized application template.](../docs/index.md)

## Use FacebookAdapter in your App

FacebookAdapter provides a translation layer for Botkit and BotBuilder so that bot developers can connect to Facebook Messenger and have access to Facebook's API.

### Botkit Basics

When used in concert with Botkit, developers need only pass the configured adapter to the Botkit constructor, as seen below. Botkit will automatically create and configure the webhook endpoints and other options necessary for communicating with Facebook.

Developers can then bind to Botkit's event emitting system using `controller.on` and `controller.hears` to filter and handle incoming events from the messaging platform. [Learn more about Botkit's core feature &rarr;](../docs/index.md).

[A full description of the FacebookAdapter options and example code can be found in the class reference docs.](../docs/reference/facebook.md#create-a-new-facebookadapter)

```javascript
const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});

adapter.use(new FacebookEventTypeMiddleware());

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
const restify = require('restify');

const adapter = new FacebookAdapter({
     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     app_secret: process.env.FACEBOOK_APP_SECRET,
     access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

server.get('/api/messages', (req, res) => {
     if (req.query['hub.mode'] === 'subscribe') {
          if (req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
               const val = req.query['hub.challenge'];
               res.sendRaw(200, val);
          } else {
               console.log('failed to verify endpoint');
               res.send('OK');
          }
     }
});

server.post('/api/messages', (req, res) => {
     adapter.processActivity(req, res, async(context) => {
         await context.sendActivity('I heard a message!');
     });
});

server.listen(process.env.port || process.env.PORT || 3000, () => {
     console.log(`\n${ server.name } listening to ${ server.url }`);
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
    }
});
```

## Class Reference

* [FacebookAdapter](../docs/reference/facebook.md#facebookadapter)
* [BotWorker Extensions](../docs/reference/facebook.md#facebookbotworker)
* [Facebook API Client](../docs/reference/facebook.md#facebookapi)

## Event List

[Botkit event types are controlled by the FacebookEventMiddleware](../docs/reference/facebook.md#facebookeventtypemiddleware).

Without this middleware applied, Botkit bots will receive `message` events when a user types a message or clicks a postback_button, and an `event` event for all other types of event received from Facebook.

Most Botkit developers who plan to use features above and beyond Facebook's send API should enable this middleware.

## Calling Facebook APIs

This package also includes [a minimal Facebook API client](../docs/reference/facebook.md#facebookapi) for developers who want to use one of the many available API endpoints.

In Botkit handlers, the `bot` worker object passed into all handlers will contain a `bot.api` field that contains the client, preconfigured and ready to use.

To use with a BotBuilder application, the adapter provides the [getAPI() method](../docs/reference/facebook.md#getapi).

```javascript
controller.on('message', async(bot, message) {

    // call the facebook API to get the bot's page identity
    let identity = await bot.api.callAPI('/me', 'GET', {});
    await bot.reply(message,`My name is ${ identity.name }`);

});
```

## Botkit Extensions

In Botkit handlers, the `bot` worker for Facebook contains [all of the base methods](../docs/reference/core.md#BotWorker) as well as the following platform-specific extensions:

### Use attachments, quick replies and other rich message features

Botkit will automatically construct your outgoing messages according to Facebook's specifications. To use attachments, quick replies or other features, add them to the message object used to create the reply:

```javascript
await bot.reply(message, {
    text: 'Choose a button', 
    quick_replies: [
        {
            "content_type":"text",
            "title":"Foo",
            "payload":"true"
        },
        {
            "content_type":"text",
            "title":"Bar",
            "payload":"false"
        }
    ]
});
```

### [Spawn a worker for a specific page](../docs/reference/facebook.md#create-a-new-facebookbotworker)

For a bot that works with multiple pages, it is possible to spawn bot workers bound to a specific page by passing the page ID as the primary parameter to `controller.spawn()`:

```javascript
let bot = await controller.spawn(FACEBOOK_PAGE_ID);
```

### [bot.startConversationWithUser()](../docs/reference/facebook.md#startconversationwithuser)

Use this method to initiate a conversation with a user. After calling this method, any further actions carried out by the bot worker will happen with the specified user.

This can be used to create or resume conversations with users that are not in direct response to an incoming message, like those sent on a schedule or in response to external events.

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](https://github.com/howdyai/botkit/blob/master/LICENSE.md)
