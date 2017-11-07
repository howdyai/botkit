# Botkit and Twilio IP Messaging

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.

Built in to [Botkit](https://howdy.ai/botkit/) are a comprehensive set of features and tools to deal with [Twilio IP Messaging platform](https://www.twilio.com/docs/api/ip-messaging), allowing
developers to build interactive bots and applications that send and receive messages just like real humans.

This document covers the Twilio-IPM implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Twilio IPM Events](#twilio-ipm-specific-events)
* [Working with Twilio IPM](#working-with-twilio-ip-messaging)
* [System Bots vs User Bots](#system-bots-vs-user-bots)
* [Using Twilio's API](#using-the-twilio-api)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Register a developer account with Twilio. Once you've got it, navigate your way to the [Get Started with IP Messaging](https://www.twilio.com/user/account/ip-messaging/getting-started) documentation on Twilio's site. Read up!!

3) To get your bot running, you need to collect *5 different API credentials*. You will need to acquire your Twilio Account SID, Auth Token, Service SID, API Key, and your API Secret to integrate with your Botkit.  This is a multi-step process!

##### Twilio Account SID and Auth Token

These values are available on your [Twilio Account page](https://www.twilio.com/user/account/settings). Copy both the SID and token values.

##### API Key and API Secret

To get an API key and secret [go here](https://www.twilio.com/user/account/ip-messaging/dev-tools/api-keys) and click 'Create an API Key'. Provide a friendly name for the API service and click 'Create API Key'.  Be sure to copy your Twilio API key and API Secret keys to a safe location - this is the last time Twilio will show you your secret!  Click the checkbox for 'Got it! I have saved my API Key Sid and Secret in a safe place to use in my application.'

##### Service SID

To generate a Twilio service SID, [go here](https://www.twilio.com/user/account/ip-messaging/services) and click 'Create an IP Messaging Service'.

Provide a friendly name and click 'create'. At the top under 'Properties' you should see Service SID.  Copy this to a safe place. You now have all 5 values!

*Keep this tab open!* You'll come back here in step 7 to specify your bot's webhook endpoint URL.

4) Now that you've got all the credentials, you need to set up an actual IP Messaging client. If you don't already have a native app built, the quickest way to get started is to clone the Twilio IPM client demo, which is available at [https://github.com/twilio/ip-messaging-demo-js](https://github.com/twilio/ip-messaging-demo-js)

Follow the instructions to get your IP Messaging Demo client up and running using the credentials you collected above.

5) Start up the sample Twilio IPM Bot. From inside your cloned Botkit repo, run:
```
TWILIO_ACCOUNT_SID=<your account sid> TWILIO_AUTH_TOKEN=<your auth token> TWILIO_IPM_SERVICE_SID=<your service sid> TWILIO_API_KEY=<your twilio API key> TWILIO_API_SECRET=<your twilio API secret> node examples/twilio_ipm_bot.js
```

6) If you are _not_ running your bot at a public, SSL-enabled internet address, use [localtunnel.me](http://localtunnel.me) to make it available to Twilio. Note the URL it gives you. For example, it may say your url is `https://xyx.localtunnel.me/` In this case, the webhook URL for use in step 7 would be `https://xyx.localtunnel.me/twilio/receive`

7) Set up a webhook endpoint for your app that uses your public URL, or the URL that localtunnel gave you. This is done on [settings page for your IP Messaging service](https://www.twilio.com/user/account/ip-messaging/services). Enable *all of the POST-event* webhooks events!

6) Load your IP Messaging client, and talk to your bot!

Try:

* hello
* who am i?
* call me Bob
* shutdown

### Things to note

Since Twilio delivers messages via web hook, your application must be available at a public internet address.  Additionally, Twilio requires this address to use SSL.  Luckily, you can use [LocalTunnel](https://localtunnel.me/) to make a process running locally or in your dev environment available in a Twilio-friendly way.

Additionally, you need to enable your Twilio IPM instance's webhook callback events. This can be done via the Twilio dashboard, but can also be done automatically using a Bash script. You can use the sample script below to enable all of the post-event webhook callbacks:

```
#!/bin/bash
echo 'please enter the service uri'
read servuri

echo 'please enter the service sid'
read servsid

echo 'please enter the account sid'
read accsid

echo 'please enter the auth token'
read authtok

onChannelDestroyedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnChannelDestroyed.Url=$servuri/twilio/receive' -d 'Webhooks.OnChannelDestroyed.Method=POST' -d 'Webhooks.OnChannelDestroyed.Format=XML' -u '$accsid:$authtok'"
eval $onChannelDestroyedCurl

onChannelAddedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnChannelAdded.Url=$servuri/twilio/receive' -d 'Webhooks.OnChannelAdded.Method=POST' -d 'Webhooks.OnChannelAdded.Format=XML' -u '$accsid:$authtok'"
eval $onChannelAddedCurl

onMemberRemovedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnMemberRemoved.Url=$servuri/twilio/receive' -d 'Webhooks.OnMemberRemoved.Method=POST' -d 'Webhooks.OnMemberRemoved.Format=XML' -u '$accsid:$authtok'"
eval $onMemberRemovedCurl
onMessageRemovedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnMessageRemoved.Url=$servuri/twilio/receive' -d 'Webhooks.OnMessageRemoved.Method=POST' -d 'Webhooks.OnMessageRemoved.Format=XML' -u '$accsid:$authtok'"
eval $onMessageRemovedCurl

onMessageUpdatedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnMessageUpdated.Url=$servuri/twilio/receive' -d 'Webhooks.OnMessageUpdated.Method=POST' -d 'Webhooks.OnMessageUpdated.Format=XML' -u '$accsid:$authtok'"
eval $onMessageUpdatedCurl

onChannelUpdatedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnChannelUpdated.Url=$servuri/twilio/receive' -d 'Webhooks.OnChannelUpdated.Method=POST' -d 'Webhooks.OnChannelUpdated.Format=XML' -u '$accsid:$authtok'"
eval $onChannelUpdatedCurl

onMemberAddedCurl="curl -X POST https://ip-messaging.twilio.com/v1/Services/$servsid -d 'Webhooks.OnMemberAdded.Url=$servuri/twilio/receive' -d 'Webhooks.OnMemberAdded.Method=POST' -d 'Webhooks.OnMemberAdded.Format=XML' -u '$accsid:$authtok'"
eval $onMemberAddedCurl
```

When you are ready to go live, consider [LetsEncrypt.org](http://letsencrypt.org), a _free_ SSL Certificate Signing Authority which can be used to secure your website very quickly. It is fabulous and we love it.

## Twilio IPM Specific Events

Once connected to your Twilio IPM service, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, Botkit will trigger these Botkit-specific events:

| Event | Description
|--- |---
| bot_channel_join| The bot has joined a channel
| bot_channel_leave | The bot has left a channel
| user_channel_join | A user (not the bot) has joined a channel
| user_channel_leave | A user (not the bot) has left a channel

Botkit will handle and distribute [all of the Twilio IPM API webhooks events](https://www.twilio.com/docs/api/ip-messaging/webhooks).  Your Bot can act on any of these events, and will receive the complete payload from Twilio.  Below, is a list of the IPM API callback events that can be subscribed to in your Bot:

| Event | Description
|--- |---
| onMessageSent | Message sent
| onMessageRemoved | Message removed/deleted
| onMessageUpdated | Message edited
| onChannelAdded | 	Channel created
| onChannelUpdated | Channel FriendlyName or Attributes updated
| onChannelDestroyed | Channel Deleted/Destroyed
| onMemberAdded | Channel Member Joined or Added
| onMemberRemoved | Channel Member Removed or Left


## Working with Twilio IP Messaging

Botkit receives messages from Twilio IPM using Webhooks, and sends messages using Twilio's REST APIs. This means that your Bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Twilio, [follow the instructions here](https://www.twilio.com/user/account/ip-messaging/getting-started). You will need to collect 5 separate pieces of your API credentials. A step by step guide [can be found here](#getting-started). Since you must *already be running* your Botkit app to fully configure your Twilio app, there is a bit of back-and-forth. It's ok! You can do it.

Here is the complete code for a basic Twilio bot:

```javascript
var Botkit = require('botkit');
var controller = Botkit.twilioipmbot({
    debug: false
})

var bot = controller.spawn({
    TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY: process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
    identity: 'Botkit',
    autojoin: true
});

// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
      console.log('This bot is online!!!');
  });
});

// user said hello
controller.hears(['hello'], 'message_received', function(bot, message) {

    bot.reply(message, 'Hey there.');

});

controller.hears(['cookies'], 'message_received', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.say('Did someone say cookies!?!!');
        convo.ask('What is your favorite type of cookie?', function(response, convo) {
            convo.say('Golly, I love ' + response.text + ' too!!!');
            convo.next();
        });
    });
});
```


#### controller.setupWebserver()
| Argument | Description
|---  |---
| port | port for webserver
| callback | callback function

Setup an [Express webserver](http://expressjs.com/en/index.html) for
use with `createWebhookEndpoints()`

If you need more than a simple webserver to receive webhooks,
you should by all means create your own Express webserver!

The callback function receives the Express object as a parameter,
which may be used to add further web server routes.

#### controller.createWebhookEndpoints()

This function configures the route `https://_your_server_/twilio/receive`
to receive webhooks from twilio.

This url should be used when configuring Twilio.

## System Bots vs User Bots

Bots inside a Twilio IPM environment can run in one of two ways: as the "system" user,
ever present and automatically available in all channels, OR, as a specific "bot" user
who must be added to channels in order to interact.

By default, bots are "system" users, and can be configured as below:

```javascript
var bot = controller.spawn({
    TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY: process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
});
```

To connect as a "bot" user, pass in an `identity` field:

```javascript
var bot = controller.spawn({
    TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY: process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
    identity: 'My Bot Name',
});
```

To have your bot automatically join every channel as they are created and removed,
pass in `autojoin`:

```javascript
var bot = controller.spawn({
    TWILIO_IPM_SERVICE_SID: process.env.TWILIO_IPM_SERVICE_SID,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY: process.env.TWILIO_API_KEY,
    TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
    identity: 'Botkit',
    autojoin: true
});
```

## Using the Twilio API

You can use the Twilio API directly in your Bot via Botkit's bot.api object. Botkit's bot.api provides a thin wrapper on the [Twilio official module](http://twilio.github.io/twilio-node/).

For example, to [retrieve a member from a channel](https://www.twilio.com/docs/api/ip-messaging/rest/members#action-get) using the un-wrapped Twilio API client, you would use the following code:

```javascript
service.channels('CHANNEL_SID').members('MEMBER_SID').get().then(function(response) {
    console.log(response);
}).fail(function(error) {
    console.log(error);
});
```

In Botkit, this can be accomplished by simply replacing the reference to a `service` object, with the `bot.api` object, as shown here:

```javascript
bot.api.channels('CHANNEL_SID').members('MEMBER_SID').get().then(function(response) {
    console.log(response);
}).fail(function(error) {
    console.log(error);
});
```
This gives you full access to all of the Twilio API methods so that you can use them in your Bot.

Here is an example showing how to join a channel using Botkit's bot.api object, which creates a member to the channel, by wrapping the IPM API.

```javascript
controller.on('onChannelAdded', function(bot, message){
   // whenever a channel gets added, join it!
   bot.api.channels(message.channel).members.create({
       identity: bot.identity
   }).then(function(response) {

   }).fail(function(error) {
       console.log(error);
   });
});
```

## Botkit Documentation Index

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [Message Pipeline](readme-pipeline.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Slack](readme-slack.md)
  * [Cisco Spark](readme-ciscospark.md)
  * [Microsoft Teams](readme-teams.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
