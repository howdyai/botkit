# Botkit and Microsoft Bot Framework

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), [Microsoft Bot Framework](https://botframework.com), 
and other messaging platforms.

The [Microsoft Bot Framework](https://botframework.com) makes it easy to create a single bot that can run across a variety of messaging channels including [Skype](https://skype.com), [Group.me](https://groupme.com), [Facebook Messenger](https://messenger.com), [Slack](https://slack.com), 
[Telegram](https://telegram.org/), [Kik](https://www.kik.com/), [SMS](https://www.twilio.com/), and [email](https://microsoft.office.com).

Built in to [Botkit](https://howdy.ai/botkit/) are a comprehensive set of features and tools to deal with any of the platforms supported by the [Microsoft Bot Framework](https://botframework.com), allowing developers to build interactive bots and applications that send and receive messages 
just like real humans.

This document covers the Bot Framework implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Bot Framework Specific Events](#bot-framework-specific-events)
* [Working with the Bot Framework](#working-with-the-bot-framework)
* [Sending Cards and Attachments](#sending-cards-and-attachments)
* [Typing Indicator](#typing-indicator)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Register a developer account with the Bot Framework [Developer Portal](https://dev.botframework.com/) and follow [this guide](https://docs.botframework.com/en-us/csharp/builder/sdkreference/gettingstarted.html#registering) to register your first bot with the Bot Framework. 

* You'll be asked to provide an endpoint for your bot during the registration process which you should set to "https://<HOST>/botframework/receive". If your using a service like [ngrok](https://ngrok.com/) to run your bot locally you should set the "<HOST>" portion of your endpoint to 
  be the hostname assigned by ngrok.
* Write down the *App ID* and *App Password* assigned to your new bot as you'll need them when you run your bot.

3) By default your bot will be configured to support the Skype channel but you'll need to add it as a contact on Skype in order to test it. You can do that from the developer portal by clicking the "Add to Skype" button in your bots profile page.

4) Run the example bot using the App ID & Password you were assigned. If you are _not_ running your bot at a public, SSL-enabled internet address, use the --lt option and update your bots endpoint in the developer portal to use the URL assigned to your bot.

```
app_id=<MY_APP_ID> app_password=<MY_APP_PASSWORD> node botframework_bot.js [--lt [--ltsubdomain CUSTOM_SUBDOMAIN]]
```    

5) Your bot should be online! Within Skype, find the bot in your contacts list, and send it a message.

Try:
  * who are you?
  * call me Bob
  * shutdown

### Things to note

Since the Bot Framework delivers messages via web hook, your application must be available at a public internet address.  Additionally, the Bot Framework requires this address to use SSL.  Luckily, you can use [LocalTunnel](https://localtunnel.me/) to make a process running locally or in your dev environment available in a Bot Framework friendly way.

When you are ready to go live, consider [LetsEncrypt.org](http://letsencrypt.org), a _free_ SSL Certificate Signing Authority which can be used to secure your website very quickly.

## Bot Framework Specific Events

Once connected to the Bot Framework, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, several other events may fire, depending on the channel your bot is configured to support.

| Event | Description
|--- |---
| message_received | A message was received by the bot. Passed an [IMessage](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.imessage.html) object.
| conversationUpdate | Your bot was added to a conversation or other conversation metadata changed. Passed an [IConversationUpdate](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.iconversationupdate.html) object.
| contactRelationUpdate | The bot was added to or removed from a user's contact list. Passed an [IContactRelationUpdate](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.icontactrelationupdate.html) object.
| typing | The user or bot on the other end of the conversation is typing. Passed an [IEvent](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.ievent.html) object.

In addition to the event specific fields, all incoming events will contain both `user` and `channel` fields which can be used for things like storage keys. Every event also has an [address](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.ievent.html#address) field. The `user` field is just a copy of the events `address.user.id` field and the `channel` field is a copy of the events `address.conversationId.id` field.

Other notable fields for incoming messages are the [text](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.imessage.html#text) field which contains the text of the incoming message, the [attachments](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.imessage.html#attachments) field which would contain an array of any images sent to the bot by the user, the [source](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.imessage.html#source) field which identifies the type of chat platform (facebook, skype, sms, etc.) that the bot is communicating over, and the [sourceEvent](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.imessage.html#sourceevent) field containing the original event/message received from the chat platform.

## Working with the Bot Framework

Botkit receives messages from the Bot Framework using webhooks, and sends messages to the Bot Framework using APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to the Bot Framework follow the step by step guide outlined in [Getting Started](#getting-started).

Here is the complete code for a basic Bot Framework bot:

```javascript
var Botkit = require('botkit');
var controller = Botkit.botframeworkbot({
});

var bot = controller.spawn({
        appId: process.env.app_id,
        appPassword: process.env.app_password
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
#### Botkit.botframeworkbot()
| Argument | Description
|---  |---
| settings | Options used to configure the bot.  Supports fields from [IChatConnectorSettings](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.ichatconnectorsettings.html).

Creates a new instance of the bots controller.  The controller will create a new [ChatConnector](https://docs.botframework.com/en-us/node/builder/chat-reference/classes/_botbuilder_d_.chatconnector.html) so any options needed to configure the chat connector should be passed in via the `settings` argument.

Generally speaking your bot needs to be configured with both an [appId](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.ichatconnectorsettings.html#appid) and [appPassword](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.ichatconnectorsettings.html#apppassword). You can leave these blank but then your bot can only be called by the [Bot Framework Emulator](https://docs.botframework.com/en-us/tools/bot-framework-emulator/#navtitle).

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

This function configures the route `https://_your_server_/botframework/receive`
to receive webhooks from the Bot Framework.

This url should be used when configuring Facebook.

## Sending Cards and Attachments

One of the more complicated aspects of building a bot that supports multiple chat platforms is dealing with all the various schemes these platforms support.  To help ease this development burden, the Bot Framework supports a cross platform card & attachment schema which lets you use a single JSON schema to express cards and attachments for any platform.  The Bot Frameworks channel adapters will do their best to render a card on a given platform which sometimes result in a card being broken up into multiple messages.

#### Sending Images & Files

The frameworks [attachment schema](https://docs.botframework.com/en-us/node/builder/chat-reference/interfaces/_botbuilder_d_.iattachment.html) lets you send a single image/file using `contentType` and `contentUrl` fields:
 
```javascript
    bot.reply(message, {
        attachments: [
            {
                contentType: 'image/png',
                contentUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Bender_Rodriguez.png',
                name: 'Bender_Rodriguez.png'
            }
        ]
    });
```

#### Sending Cards

Rich cards can be expressed as attachments by changing the `contentType` and using the `content` field to pass a JSON object defining the card:

```javascript
    bot.reply(message, {
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.hero',
                content: {
                    title: "I'm a hero card",
                    subtitle: "Pig Latin Wikipedia Page",
                    images: [
                        { url: "https://<ImageUrl1>" },
                        { url: "https://<ImageUrl2>" }
                    ],
                    buttons: [
                        {
                            type: "openUrl",
                            title: "WikiPedia Page",
                            value: "https://en.wikipedia.org/wiki/Pig_Latin"
                        }
                    ]
                }
            }
        ]
    });
```

The full list of supported card types and relevant schema can be found [here](https://docs.botframework.com/en-us/csharp/builder/sdkreference/attachments.html)

#### Using the Platforms Native Schema

There may be times where the Bot Frameworks cross platform attachment schema doesn’t cover your needs. For instance, you may be trying to send a card type not directly supported by the framework.  In those cases you can pass a message using the platforms native schema to the `sourceEvent` field on the message.  Examples of this can be found [here](https://docs.botframework.com/en-us/csharp/builder/sdkreference/channels.html) (note: you should use `sourceEvent` instead of `channelData` and you don’t need to worry about the from & to fields, these will be populated for you when you call `bot.reply()`.) 

## Typing Indicator

You can easily turn on the typing indicator on platforms that support that behaviour by sending an empty message of type "typing":

```javascript
    bot.reply(message, { type: "typing" });
```
