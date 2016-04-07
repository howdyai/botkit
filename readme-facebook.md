# Botkit and Facebook

Botkit designed to ease the process of designing and running useful, creative or just plain weird bots (and other types of applications) that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com) and other messaging platforms.

Botkit features a comprehensive set of tools
to deal with [Facebooks's Messenger platform](https://developers.facebook.com/docs/messenger-platform/implementation), and allows
developers to build interactive bots and applications that send and receive messages just like real humans. Facebook bots can be connected to Facebook Pages, and can be triggered using a variety of [useful web plugins](https://developers.facebook.com/docs/messenger-platform/plugin-reference).

This document covers the Facebook-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Connecting Your Bot To Slack](#connecting-your-bot-to-slack)
* [Slack-specific Events](#slack-specific-events)
* [Working with Slack Custom Integrations](#working-with-slack-integrations)
* [Using the Slack Button](#use-the-slack-button)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Create a [Facebook App for Web](https://developers.facebook.com/quickstarts/?platform=web) and note down or [create a new Facebook Page](https://www.facebook.com/pages/create/).  Your Facebook page will be used for the app's identity.

3) [Get a page access token for your app](https://developers.facebook.com/docs/messenger-platform/implementation#page_access_token)

Copy this token, you'll need it!

4) Define your own "verify token" - this a string that you control that Facebook will use to verify your web hook endpoint.

5) Run the example bot app, using the two tokens you just created:

```
page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js
```

6) If you are _not_ running your bot at a public, SSL-enabled internet address, use [localtunnel.me](http://localtunnel.me) to make it available to Facebook. Note the URL it gives you.

7) [Set up a webhook endpoint for your app](https://developers.facebook.com/docs/messenger-platform/implementation#setting_webhooks) that uses your public URL, or the URL that localtunnel gave you. Use the verify token you defined in step 4!

8) Your bot should be online! Within Facebook, find your page, and click the "Message" button in the header.

Try:
  * who are you?
  * call me Bob
  * shutdown
​
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
