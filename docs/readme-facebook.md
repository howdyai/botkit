# Botkit and Facebook

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms.


Botkit features a comprehensive set of tools
to deal with [Facebooks's Messenger platform](https://developers.facebook.com/docs/messenger-platform/implementation) as well as [Facebook @Workplace](https://facebook.com/workplace), and allows
developers to build interactive bots and applications that send and receive messages just like real humans. Facebook bots can be connected to Facebook Pages, and can be triggered using a variety of [useful web plugins](https://developers.facebook.com/docs/messenger-platform/plugin-reference).

This document covers the Facebook-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Facebook-specific Events](#facebook-specific-events)
* [Working with Facebook Webhooks](#working-with-facebook-messenger)
* [Using Structured Messages and Postbacks](#using-structured-messages-and-postbacks)
* [Thread Settings](#thread-settings-api)
* [Messenger Profile API](#messenger-profile-api)
* [Simulate typing](#simulate-typing)
* [Silent and No Notifications](#silent-and-no-notifications)
* [Messenger code API](#messenger-code-api)
* [Attachment upload API](#attachment-upload-api)
* [Running Botkit with an Express server](#use-botkit-for-facebook-messenger-with-an-express-web-server)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Create a [Facebook App for Web](https://developers.facebook.com/quickstarts/?platform=web) and note down or [create a new Facebook Page](https://www.facebook.com/pages/create/).  Your Facebook page will be used for the app's identity.


3) [Get a page access token for your app](https://developers.facebook.com/docs/messenger-platform/guides/setup#page_access_token)

Copy this token, you'll need it!

4) Define your own "verify token" - this is a string that you control that Facebook will use to verify your web hook endpoint.

5) Run the example bot app, using the two tokens you just created. If you are _not_ running your bot at a public, SSL-enabled internet address, use the --lt option and note the URL it gives you.

```
page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node examples/facebook_bot.js [--lt [--ltsubdomain CUSTOM_SUBDOMAIN]]
```

6) [Set up a webhook endpoint for your app](https://developers.facebook.com/docs/messenger-platform/guides/setup#webhook_setup) that uses your public URL. Use the verify token you defined in step 4!

* *Note* - You will need to provide Facebook a callback endpoint to receive requests from Facebook. By default Botkit will serve content from "https://YOURSERVER/facebook/receive". You can use a tool like [ngrok.io](http://ngrok.io) or [localtunnel.me](http://localtunnel.me) to expose your local development enviroment to the outside world for the purposes of testing your Messenger bot.

7) Your bot should be online! Within Facebook, find your page, and click the "Message" button in the header.

Try:
  * who are you?
  * call me Bob
  * shutdown


### Things to note

Since Facebook delivers messages via web hook, your application must be available at a public internet address.  Additionally, Facebook requires this address to use SSL.  Luckily, you can use [LocalTunnel](https://localtunnel.me/) to make a process running locally or in your dev environment available in a Facebook-friendly way.

When you are ready to go live, consider [LetsEncrypt.org](http://letsencrypt.org), a _free_ SSL Certificate Signing Authority which can be used to secure your website very quickly. It is fabulous and we love it.

## Validate Requests - Secure your webhook!
Facebook sends an X-HUB signature header with requests to your webhook. You can verify the requests are coming from Facebook by enabling `validate_requests: true` when creating your bot controller. This checks the sha1 signature of the incoming payload against your Facebook App Secret (which is seperate from your webhook's verify_token), preventing unauthorized access to your webhook. You must also pass your `app_secret` into your environment variables when running your bot.

The Facebook App secret is available on the Overview page of your Facebook App's admin page. Click show to reveal it.

```
app_secret=abcdefg12345 page_token=123455abcd verify_token=VerIfY-tOkEn node examples/facebook_bot.js
```

## Facebook-specific Events

Once connected to Facebook, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, several other events may fire, depending on your implementation and the webhooks you subscribed to within your app's Facebook configuration.

| Event | Description
|--- |---
| message_received | a message was received by the bot
| facebook_postback | user clicked a button in an attachment and triggered a webhook postback
| message_delivered | a confirmation from Facebook that a message has been received
| message_read | a confirmation from Facebook that a message has been read
| facebook_account_linking | a user has started the account linking
| facebook_optin | a user has clicked the [Send-to-Messenger plugin](https://developers.facebook.com/docs/messenger-platform/implementation#send_to_messenger_plugin)
| facebook_referral | a user has clicked on a [m.me URL with a referral param](https://developers.facebook.com/docs/messenger-platform/referral-params)

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

### Receive Postback Button Clicks as "Typed" Messages

Facebook Messenger supports including "postback" buttons, which, when clicked,
send a specialized `facebook_postback` event.

Developers may find it useful if button clicks are treated as "typed" messages.
In order to "hear" these events, add the `facebook_postback` event to the list of events specified in the second parameter to the `hears()` function.
This enables buttons to be used as part of a conversation flow, with the button's
`payload` field being used for the message text.

When used in conjunction with `convo.ask`, Botkit will treat the button's `payload` field as if were a message typed by the user.

```
// receive a message whether it is typed or part of a button click
controller.hears('hello','message_received,facebook_postback', function(bot,message) {

  bot.reply(message, 'Got it!');

});
```

### Require Delivery Confirmation

In order to guarantee the order in which your messages arrive, Botkit supports an optional
delivery confirmation requirement. This will force Botkit to wait for a `message_delivered` events
for each outgoing message before continuing to the next message in a conversation.

Developers who send many messages in a row, particularly with payloads containing images or attachments,
should consider enabling this option. Facebook's API sometimes experiences a delay delivering messages with large files attached, and this delay can cause messages to appear out of order.

To enable this option, pass in `{require_delivery: true}` to your Botkit Facebook controller, as below:

```javascript
var controller = Botkit.facebookbot({
        access_token: process.env.access_token,
        verify_token: process.env.verify_token,
        require_delivery: true,
})
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

```javascript
var reply_message = {
  sender_action: "typing_on"
}

bot.reply(message, reply_message)
```

## Simulate typing
To make it a bit more realistic, you can trigger a "user is typing" signal (shown in Messenger as a bubble with 3 animated dots) by using the following convenience methods.

```javascript
bot.startTyping(message, function () {
  // do something here, the "is typing" animation is visible
});

bot.stopTyping(message, function () {
  // do something here, the "is typing" animation is not visible
});

bot.replyWithTyping(message, 'Hello there, my friend!');
```

## Silent and No Notifications
When sending a user a message you can make the message have either no notification or have a notification that doesn't play a sound. Both of these features are unique to the mobile application messenger. To do this add the `notification_type` field to message. Notification type must be one of the following:
- REGULAR will emit a sound/vibration and a phone notification
- SILENT_PUSH will just emit a phone notification
- NO_PUSH will not emit either

`notification_type` is optional. By default, messages will be REGULAR push notification type

```javascript
reply_message = {
    text: "Message text here",
    notification_type: NOTIFICATION_TYPE
}
bot.reply(message, reply_message)
```

## Messenger code API

Messenger Codes can be scanned in Messenger to instantly link the user to your bot, no typing needed. They're great for sticking on fliers, ads, or anywhere in the real world where you want people to try your bot.

- Get Static Codes :
```javascript
controller.api.messenger_profile.get_messenger_code(2000, function (err, url) {
    if(err) {
        // Error
    } else {
        // url
    }
});
```

- Get Parametric Codes :
```javascript
controller.api.messenger_profile.get_messenger_code(2000, function (err, url) {
    if(err) {
        // Error
    } else {
        // url
    }
}, 'billboard-ad');
```

## Thread Settings API

Thread settings API is now messenger profile API, it's highly recommended to use profile API instead of thread settings one, however, Botkit thread settings interface still available :


```js
controller.api.messenger_profile.YOUR_METHOD_NAME();
controller.api.thread_settings.YOUR_METHOD_NAME();

```


## Messenger Profile API

Facebook offers a Messenger Profile API to customize special bot features
such as a persistent menu and a welcome screen. We highly recommend you use all of these features, which will make your bot easier for users to work with. [Read Facebook's docs here](https://developers.facebook.com/docs/messenger-platform/messenger-profile).

#### controller.api.messenger_profile.greeting()
| Argument | Description
|---  |---
| message | greeting message to display on welcome screen

#### controller.api.messenger_profile.delete_greeting()

Remove the greeting message.

#### controller.api.messenger_profile.get_greeting()

Get the greeting setting.

#### controller.api.messenger_profile.get_started()
| Argument | Description
|---  |---
| payload | value for the postback payload sent when the button is clicked

Set the payload value of the 'Get Started' button

#### controller.api.messenger_profile.delete_get_started()

Clear the payload value of the 'Get Started' button and remove it.

#### controller.api.messenger_profile.get_get_started()

Get the get started setting.

#### controller.api.messenger_profile.menu()
| Argument | Description
|---  |---
| menu_items | an array of menu_item objects

Create a [persistent menu](https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu) for your Bot

#### controller.api.messenger_profile.delete_menu()

Clear the persistent menu setting

#### controller.api.messenger_profile.get_menu()

Get the menu setting.

#### controller.api.messenger_profile.account_linking()
| Argument | Description
|---  |---
| payload | the account link.

#### controller.api.messenger_profile.delete_account_linking()

Remove the account link

#### controller.api.messenger_profile.get_account_linking()

Get the account link

#### controller.api.messenger_profile.domain_whitelist()
| Argument | Description
|---  |---
| payload | A single or a list of domains to add to the whitelist, All domains must be valid and use https. Up to 10 domains allowed.

#### controller.api.messenger_profile.delete_domain_whitelist()

Remove all domains

#### controller.api.messenger_profile.get_domain_whitelist()

Get a list of the whitelisted domains.

### controller.api.messenger_profile.home_url()
| Argument | Description
|---  |---
| payload | A home_url object with the properties `url`, `webview_height_ratio`, `in_test`

View the facebook documentation for details of the [home_url](https://developers.facebook.com/docs/messenger-platform/messenger-profile/home-url) payload object.

*NB.* The value of the `url` property must be present in the domain_whitelist array

### controller.api.messenger_profile.delete_home_url()

Remove the home_url setting

### controller.api.messenger_profile.get_home_url()

Get the home_url

#### Using the The Messenger Profile API

```js
controller.api.messenger_profile.greeting('Hello! I\'m a Botkit bot!');
controller.api.messenger_profile.get_started('sample_get_started_payload');
controller.api.messenger_profile.menu([{
        "locale":"default",
        "composer_input_disabled":true,
        "call_to_actions":[
            {
                "title":"My Skills",
                "type":"nested",
                "call_to_actions":[
                    {
                        "title":"Hello",
                        "type":"postback",
                        "payload":"Hello"
                    },
                    {
                        "title":"Hi",
                        "type":"postback",
                        "payload":"Hi"
                    }
                ]
            },
            {
                "type":"web_url",
                "title":"Botkit Docs",
                "url":"https://github.com/howdyai/botkit/blob/master/readme-facebook.md",
                "webview_height_ratio":"full"
            }
        ]
    },
    {
        "locale":"zh_CN",
        "composer_input_disabled":false
    }
]);
controller.api.messenger_profile.account_linking('https://www.yourAwesomSite.com/oauth?response_type=code&client_id=1234567890&scope=basic');
controller.api.messenger_profile.get_account_linking(function (err, accountLinkingUrl)  {
    console.log('****** Account linkink URL :', accountLinkingUrl);
});
controller.api.messenger_profile.delete_account_linking();
controller.api.messenger_profile.domain_whitelist('https://localhost');
controller.api.messenger_profile.domain_whitelist(['https://127.0.0.1', 'https://0.0.0.0']);
controller.api.messenger_profile.delete_domain_whitelist();
controller.api.messenger_profile.get_domain_whitelist(function (err, data)  {
    console.log('****** Whitelisted domains :', data);
});

controller.api.messenger_profile.home_url({
    "url": 'https://mydomain.com',
    "webview_height_ratio": 'tall',
    "in_test": false
})

controller.api.messenger_profile.get_home_url(function (err, data)  {
    console.log('****** Home url :', data);
});

controller.api.messenger_profile.delete_home_url();

// Target Audience
controller.api.messenger_profile.target_audience({
    "audience_type":"custom",
    "countries":{
        "whitelist":["US", "CA"]
    }
});
controller.api.messenger_profile.delete_target_audience();
controller.api.messenger_profile.get_target_audience(function (err, data)  {
    console.log('****** Target Audience :', data);
});


```

## Attachment upload API

Attachment upload API allows you to upload an attachment that you may later send out to many users, without having to repeatedly upload the same data each time it is sent :


```js
var attachment = {
        "type":"image",
        "payload":{
            "url":"https://pbs.twimg.com/profile_images/803642201653858305/IAW1DBPw_400x400.png",
            "is_reusable": true
        }
    };

    controller.api.attachment_upload.upload(attachment, function (err, attachmentId) {
        if(err) {
            // Error
        } else {
            var image = {
                "attachment":{
                    "type":"image",
                    "payload": {
                        "attachment_id": attachmentId
                    }
                }
            };
            bot.reply(message, image);
        }
    });

```

## Built-in NLP

Facebook offers some built-in natural language processing tools. Once enabled, messages may contain a `message.nlp.` object with the results of the Facebook NLP.
More information can be found [in Facebook's official documentation of this feature](https://developers.facebook.com/docs/messenger-platform/built-in-nlp).

If specified, `message.nlp.entities` will include a list of entities and intents extracted by Facebook.

Facebook's NLP option can be enabled by calling `controller.api.nlp.enable()` in your Botkit app.

Facebook's NLP option can be disabled by calling `controller.api.nlp.enable()` in your Botkit app.


## Message Tags

Adding a tag to a message allows you to send it outside the 24+1 window.

View the facebook [documentation](https://developers.facebook.com/docs/messenger-platform/messenger-profile/home-url) for more details.

- Get all tags :
```javascript
controller.api.tags.get_all(function (tags) {
   // use tags.data
});
```

- Send a tagged message :
```javascript
var taggedMessage = {
        "text": "Hello Botkit !",
        "tag": "RESERVATION_UPDATE"
};
bot.reply(message, taggedMessage);
```


## Use BotKit for Facebook Messenger with an Express web server
Instead of the web server generated with setupWebserver(), it is possible to use a different web server to receive webhooks, as well as serving web pages.

Here is an example of [using an Express web server alongside BotKit for Facebook Messenger](https://github.com/mvaragnat/botkit-messenger-express-demo).


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
