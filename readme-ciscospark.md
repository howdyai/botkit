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
access_token=<MY PAGE TOKEN> public_address=<https://my_bot_url> secret=<my_secret_phrase> node spark_bot.js
```

5) Your bot should now come online and respond to requests! Find it in Cisco Spark by searching for it's name.


## Controller Options

| Argument | Description
| public_address | required the root url of your application (https://mybot.com)
| ciscospark_access_token | required token provided by Cisco Spark for your bot
| secret | required secret for validating webhooks originate from Cisco Spark
| webhook_name | optional name for webhook configuration on Cisco Spark side. Providing a name here allows for multiple bot instances to receive the same messages. Defaults to 'Botkit Firehose'
| limit_to_org | optional organization id in which the bot should exist. If user from outside org sends message, it is ignored
| limit_to_domain | optional email domain (@howdy.ai) or array of domains [@howdy.ai, @botkit.ai] from which messages can be received

## Spark Specific Events

All events [listed here](https://developer.ciscospark.com/webhooks-explained.html#resources-events) should be expected, in the format `resoure.event`.  In addition, the following custom Botkit-specific events are fired.

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
