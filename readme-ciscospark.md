# Botkit and Cisco Spark

Botkit is designed to ease the process of designing and running useful, creative bots that live inside Cisco Spark.

Botkit features a comprehensive set of tools
to deal with [Cisco's Spark platform](https://developer.ciscospark.com/), and allows
developers to build interactive bots and applications that send and receive messages just like real humans.

This document covers the Cisco Spark-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Spark-specific Events](#spark-specific-events)
* [Message Formatting](#message-formatting)

## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) [Create a bot in the Spark for Developers site](https://developer.ciscospark.com/add-bot.html). You'll receive an `access token`.

Copy this token, you'll need it!

3) If you are _not_ running your bot at a public, SSL-enabled internet address, use a tool like [ngrok](http://ngrok.io) or [localtunnel](http://localtunnel.me) to create a secure route to your development application.

```
ngrok http 3000
```

4) Run your bot application using the access token you received, the base url of your bot application, and a secret which is used to validate the origin of incoming webhooks:

```
access_token=<MY ACCESS TOKEN> public_address=<https://my_bot_url> secret=<my_secret_phrase> node spark_bot.js
```

5) Your bot should now come online and respond to requests! Find it in Cisco Spark by searching for it's name.

## Working with Cisco Spark

Botkit receives messages from Cisco Spark using webhooks, and sends messages using their APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Cisco Spark, [get an access token here](https://developer.ciscospark.com/add-bot.html). In addition to the access token,
Cisco Spark bots require a user-defined `secret` which is used to validate incoming webhooks, as well as a `public_address` which is the URL at which the bot application can be accessed via the internet.

Each time the bot application starts, Botkit will register a webhook subscription.
Botkit will automatically manage your bot's webhook subscriptions, but if you plan on having multiple instances of your bot application with different URLs (such as a development instance and a production instance), use the `webhook_name` field with a different value for each instance.

Bots in Cisco Spark are identified by their email address, and can be added to any room in any team or organization. If your bot should only be available to users within a specific organization, use the `limit_to_org` or `limit_to_domain` options.
This will configure your bot to respond only to messages from members of the specific organization, or whose email addresses match one of the specified domains.

The full code for a simple Cisco Spark bot is below:

```
var Botkit = require('./lib/Botkit.js');

var controller = Botkit.sparkbot({
    debug: true,
    log: true,
    public_address: process.env.public_address,
    ciscospark_access_token: process.env.access_token,
    secret: process.env.secret
});


var bot = controller.spawn({
});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log("SPARK: Webhooks set up!");
    });
});

controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});
```

## Controller Options

When creating the Botkit controller, there are several platform-specific options available.

### Botkit.sparkbot
| Argument | Description
|--- |---
| public_address | _required_ the root url of your application (https://mybot.com)
| ciscospark_access_token | _required_ token provided by Cisco Spark for your bot
| secret | _required_ secret for validating webhooks originate from Cisco Spark
| webhook_name | _optional_ name for webhook configuration on Cisco Spark side. Providing a name here allows for multiple bot instances to receive the same messages. Defaults to 'Botkit Firehose'
| limit_to_org | _optional_ organization id in which the bot should exist. If user from outside org sends message, it is ignored
| limit_to_domain | _optional_ email domain (@howdy.ai) or array of domains [@howdy.ai, @botkit.ai] from which messages can be received

```
var controller = Botkit.sparkbot({
    debug: true,
    log: true,
    public_address: 'https://mybot.ngrok.io',
    ciscospark_access_token: process.env.access_token,
    secret: 'randomstringofnumbersandcharacters12345',
    webhook_name: 'dev',
    limit_to_org: 'my_spark_org_id',
    limit_to_domain: ['@howdy.ai','@cisco.com'],
});
```


## Spark Specific Events

 All events [listed here](https://developer.ciscospark.com/webhooks-explained.html#resources-events) should be expected, in the format `resource`.`event` - for example, `rooms.created`.  

 In addition, the following custom Botkit-specific events are fired:

| Event | Description
|--- |---
| direct_message | Bot has received a message as a DM
| direct_mention | Bot has been mentioned in a public room
| self_message | Bot has received a message it sent
| user_room_join | a user has joined a room in which the bot is present
| bot_room_join | the bot has joined a new room
| user_room_leave | a user has left a room in which the bot is present
| bot_room_leave | the bot has left a room


## Message Formatting

Cisco Spark supports both a `text` field and a `markdown` field for outbound messages. [Read here for details on Cisco Spark's markdown support.](https://developer.ciscospark.com/formatting-messages.html)

To specify a markdown version, add it to your message object:

```
bot.reply(message,{text: 'Hello', markdown: '*Hello!*'});
```
