# Botkit and Facebook

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.


Botkit features a comprehensive set of tools
to deal with [Facebooks's Messenger platform](https://developers.facebook.com/docs/messenger-platform/implementation), and allows
developers to build interactive bots and applications that send and receive messages just like real humans. Facebook bots can be connected to Facebook Pages, and can be triggered using a variety of [useful web plugins](https://developers.facebook.com/docs/messenger-platform/plugin-reference).

This document covers the Facebook-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Facebook-specific Events](#facebook-specific-events)
* [Working with Facebook Webhooks](#working-with-facebook-messenger)
* [Using Structured Messages and Postbacks](#using-structured-messages-and-postbacks)
* [Running Botkit with an Express server](#use-botkit-for-facebook-messenger-with-an-express-web-server)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Create a [Facebook App for Web](https://developers.facebook.com/quickstarts/?platform=web) and note down or [create a new Facebook Page](https://www.facebook.com/pages/create/).  Your Facebook page will be used for the app's identity.

3) [Get a page access token for your app](https://developers.facebook.com/docs/messenger-platform/implementation#page_access_token)

Copy this token, you'll need it!

4) Define your own "verify token" - this a string that you control that Facebook will use to verify your web hook endpoint.

5) Run the example bot app, using the two tokens you just created. If you are _not_ running your bot at a public, SSL-enabled internet address, use the --lt option and note the URL it gives you.

```
page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js [--lt [--ltsubdomain CUSTOM_SUBDOMAIN]]
```

6) [Set up a webhook endpoint for your app](https://developers.facebook.com/docs/messenger-platform/implementation#setting_webhooks) that uses your public URL. Use the verify token you defined in step 4!

7) Your bot should be online! Within Facebook, find your page, and click the "Message" button in the header.

Try:
  * who are you?
  * call me Bob
  * shutdown


### Things to note

Since Facebook delivers messages via web hook, your application must be available at a public internet address.  Additionally, Facebook requires this address to use SSL.  Luckily, you can use [LocalTunnel](https://localtunnel.me/) to make a process running locally or in your dev environment available in a Facebook-friendly way.

When you are ready to go live, consider [LetsEncrypt.org](http://letsencrypt.org), a _free_ SSL Certificate Signing Authority which can be used to secure your website very quickly. It is fabulous and we love it.

## Facebook-specific Events

Once connected to Facebook, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, several other events may fire, depending on your implementation and the webhooks you subscribed to within your app's Facebook configuration.

| Event | Description
|--- |---
| message_received | a message was received by the bot
| facebook_postback | user clicked a button in an attachment and triggered a webhook postback
| message_delivered | a confirmation from Facebook that a message has been received
| facebook_optin | a user has clicked the [Send-to-Messenger plugin](https://developers.facebook.com/docs/messenger-platform/implementation#send_to_messenger_plugin)

All incoming events will contain the fields `user` and `channel`, both of which represent the Facebook user's ID, and a `timestamp` field.

`message_received` events will also contain either a `text` field or an `attachment` field.

`facebook_postback` events will contain a `payload` field.

More information about the data found in these fields can be found [here](https://developers.facebook.com/docs/messenger-platform/webhook-reference).

## Working with Facebook Messenger

Botkit receives messages from Facebook using webhooks, and sends messages using Facebook's APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Facebook, [follow the instructions here](https://developers.facebook.com/docs/messenger-platform/implementation). You will need to collect your `page token` as well as a `verify token` that you define yourself and configure inside Facebook's app settings. A step by step guide [can be found here](#getting-started). Since you must *already be running* your Botkit app to configure your Facebook app, there is a bit of back-and-forth. It's ok! You can do it.

Here is the complete code for a basic Facebook bot:

```javascript
var Botkit = require('botkit');
var controller = Botkit.facebookbot({
        access_token: process.env.access_token,
        verify_token: process.env.verify_token,
})

var bot = controller.spawn({
});

// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
      console.log('This bot is online!!!');
  });
});

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function(bot, message) {

    bot.reply(message, 'Welcome to my app!');

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
you should by all means create your own Express webserver! Here is a [boilerplate demo](https://github.com/mvaragnat/botkit-messenger-express-demo).

The callback function receives the Express object as a parameter,
which may be used to add further web server routes.

#### controller.createWebhookEndpoints()

This function configures the route `https://_your_server_/facebook/receive`
to receive webhooks from Facebook.

This url should be used when configuring Facebook.

## Using Structured Messages and Postbacks

You can attach little bubbles

And in those bubbles can be buttons
and when a user clicks the button, it sends a postback with the value.

```javascript
controller.hears('test', 'message_received', function(bot, message) {

    var attachment = {
        'type':'template',
        'payload':{
            'template_type':'generic',
            'elements':[
                {
                    'title':'Chocolate Cookie',
                    'image_url':'http://cookies.com/cookie.png',
                    'subtitle':'A delicious chocolate cookie',
                    'buttons':[
                        {
                        'type':'postback',
                        'title':'Eat Cookie',
                        'payload':'chocolate'
                        }
                    ]
                },
            ]
        }
    };

    bot.reply(message, {
        attachment: attachment,
    });

});

controller.on('facebook_postback', function(bot, message) {

    if (message.payload == 'chocolate') {
        bot.reply(message, 'You ate the chocolate cookie!')
    }

});
```

## Typing indicator

Use a message with a sender_action field with "typing_on" to create a typing indicator. The typing indicator lasts 20 seconds, unless you send another message with "typing_off"

```
var reply_message = {
  sender_action: "typing_on"
}

bot.reply(message, reply_message)
```

## Use BotKit for Facebook Messenger with an Express web server
Instead of the web server generated with setupWebserver(), it is possible to use a different web server to receive webhooks, as well as serving web pages.

Here is an example of [using an Express web server alongside BotKit for Facebook Messenger](https://github.com/mvaragnat/botkit-messenger-express-demo).

