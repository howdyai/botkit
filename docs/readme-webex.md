# Botkit and Webex Teams

Botkit is designed to ease the process of designing and running useful, creative bots that live inside the Cisco Webex platform and the Webex Teams applications.

Botkit features a comprehensive set of tools
to deal with [Webex's platform](https://developer.webex.com/), and allows
developers to build interactive bots and applications that send and receive messages just like real humans.

This document covers the Webex-specific implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Webex-specific Events](#webex-specific-events)
* [Message Formatting](#message-formatting)
* [Attaching Files](#attaching-files)
* [Receiving Files](#receiving-files)
* [Starting Direct Messages](#starting-direct-messages)


## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) [Create a bot in the Webex for Developers site](https://developer.webex.com/add-bot.html). You'll receive an `access token`.

Copy this token, you'll need it!

3) If you are _not_ running your bot at a public, SSL-enabled internet address, use a tool like [ngrok](http://ngrok.io) or [localtunnel](http://localtunnel.me) to create a secure route to your development application.

```
ngrok http 3000
```

4) Run your bot application using the access token you received, the base url of your bot application, and a secret which is used to validate the origin of incoming webhooks:

```
access_token=<MY ACCESS TOKEN> public_address=<https://my_bot_url> secret=<my_secret_phrase> node examples/webex_bot.js
```

5) Your bot should now come online and respond to requests! Find it in your Webex Teams app by searching for it's name.

## Working with Webex

Botkit receives messages from the Cisco Webex cloud platform using webhooks, and sends messages using their APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Webex, [get an access token here](https://developer.webex.com/add-bot.html). In addition to the access token,
Webex bots require a user-defined `secret` which is used to validate incoming webhooks, as well as a `public_address` which is the URL at which the bot application can be accessed via the internet.

Each time the bot application starts, Botkit will register a webhook subscription.
Botkit will automatically manage your bot's webhook subscriptions, but if you plan on having multiple instances of your bot application with different URLs (such as a development instance and a production instance), use the `webhook_name` field with a different value for each instance.

Bots in Webex are identified by their email address, and can be added to any space in any team or organization. If your bot should only be available to users within a specific organization, use the `limit_to_org` or `limit_to_domain` options.
This will configure your bot to respond only to messages from members of the specific organization, or whose email addresses match one of the specified domains.

The full code for a simple Webex bot is below:

~~~ javascript
var Botkit = require('./lib/Botkit.js');

var controller = Botkit.webexbot({
    debug: true,
    log: true,
    public_address: process.env.public_address,
    access_token: process.env.access_token,
    secret: process.env.secret
});


var bot = controller.spawn({
});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log("Webhooks set up!");
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
~~~

## Controller Options

When creating the Botkit controller, there are several platform-specific options available.

### Botkit.webex
| Argument | Description
|--- |---
| public_address | _required_ the root url of your application (https://mybot.com)
| `access_token` | _required_ token provided by Webex for your bot
| secret | _required_ secret for validating webhooks originate from Webex
| webhook_name | _optional_ name for webhook configuration on Webex side. Providing a name here allows for multiple bot instances to receive the same messages. Defaults to 'Botkit Firehose'
| `limit_to_org` | _optional_ organization id in which the bot should exist. If user from outside org sends message, it is ignored
| `limit_to_domain` | _optional_ email domain (@howdy.ai) or array of domains [@howdy.ai, @botkit.ai] from which messages can be received

~~~ javascript
var controller = Botkit.webex({
    debug: true,
    log: true,
    public_address: 'https://mybot.ngrok.io',
    access_token: process.env.access_token,
    secret: 'randomstringofnumbersandcharacters12345',
    webhook_name: 'dev',
    limit_to_org: 'my_webex_org_id',
    limit_to_domain: ['@howdy.ai','@cisco.com'],
});
~~~

### Webex rebrand

Back in April 2018, Cisco announced a [rebrand from Cisco Spark to Webex]().
In May 2018, starting with version **TODO**, Botkit reflected this rebrand by updated 'Spark' mentions from the framework API.

**For backward compatibility purposes**, several references are now marked as deprecated, but still supported (except for Typescript code). Please migrate your code if your find references to:
- Botkit.sparkbot() => Botkit.webexbot()
- controller.config.ciscospark_access_token => controller.config.access_token: a warning shows up in the console if your code is still using this option.

**Breaking changes**
- bot.type now equals 'webex' instead of 'ciscospark': there should not be any impact in your code.
- the webhook HTTP endpoint automatically created and exposed by Botkit has been changed from '/ciscospark/receive' to '/webex/receive'. Note that this change can have an impact for the Webex Cloud platform to reach your bot if the traffic to your bot is routed by a reverse proxy. _To avoid any bot to break, the Botkit Webex connector will expose an HTTP endpoint with the deprecated '/ciscospark/receive' path if the 'ciscospark_access_token' configuration property is detected._


## Webex Specific Events

 All events [listed here](https://developer.webex.com/webhooks-explained.html#resources-events) should be expected, in the format `resource`.`event` - for example, `rooms.created`.  

 In addition, the following custom Botkit-specific events are fired:

| Event | Description
|--- |---
| direct_message | Bot has received a message as a DM
| direct_mention | Bot has been mentioned in a public space
| self_message | Bot has received a message it sent
| user_space_join | a user has joined a space in which the bot is present
| bot_space_join | the bot has joined a new space
| user_space_leave | a user has left a space in which the bot is present
| bot_space_leave | the bot has left a space


## Message Formatting

Webex supports both a `text` field and a `markdown` field for outbound messages. [Read here for details on Webex's markdown support.](https://developer.webex.com/formatting-messages.html)

To specify a markdown version, add it to your message object:

~~~ javascript
bot.reply(message,{text: 'Hello', markdown: '*Hello!*'});
~~~

## Attaching Files

Files can be attached to outgoing messages in one of two ways.

*Specify URL*

If the file you wish to attach is already available online, simply specify the URL in the `files` field of the outgoing message:

~~~ javascript
bot.reply(message,{text:'Here is your file!', files:['http://myserver.com/file.pdf']});
~~~

*Send Local File*

If the file you wish to attach is present only on the local server, attach it to the message as a readable stream:

~~~ javascript
var fs = require('fs');
bot.reply(message,{text: 'I made this file for you.', files:[fs.createReadStream('./newfile.txt')]});
~~~

## Receiving files

Your bot may receive messages with files attached. Attached files will appear in an array called `message.data.files`.

Botkit provides 2 methods for retrieving information about the file.

### bot.retrieveFileInfo(url, cb)
| Parameter | Description
|--- |---
| url | url of file from message.data.files
| cb | callback function in the form function(err, file_info)

The callback function will receive an object with fields like `filename`, `content-type`, and `content-length`.

~~~ javascript
controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
    if (message.data.files) {
        bot.retrieveFileInfo(message.data.files[0], function(err, file_info) {
            bot.reply(message,'I also got an attached file called ' + file_info.filename);
        });
    }
});
~~~

### bot.retrieveFile(url, cb)
| Parameter | Description
|--- |---
| url | url of file from message.data.files
| cb | callback function in the form function(err, file_content)

The callback function will receive the full content of the file.

~~~ javascript
controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
    if (message.data.files) {
        bot.retrieveFileInfo(message.data.files[0], function(err, file_info) {
            if (file_info['content-type'] == 'text/plain') {
                bot.retrieveFile(message.data.files[0], function(err, file) {
                    bot.reply(message,'I got a text file with the following content: ' + file);
                });
            }
        });
    }
});
~~~

## Starting Direct Messages

Webex's API provides several ways to send private messages to users -
by the user's email address, or by their user id. These may be used in the case where the
user's email address is unknown or unavailable, or when the bot should respond to the `actor`
instead of the `sender` of a message.

For example, a bot may use these methods when handling a `bot_space_join` event
in order to send a message to the _user who invited the bot_ (the actor) instead of
the bot itself (the sender).

NOTE: Core functions like [bot.startPrivateConversation()](readme.md#botstartprivateconversation) work as expected,
and will create a direct message thread with the sender of the incoming_message.

### bot.startPrivateConversationWithPersonId()
| Parameter | Description
|--- |---
| personId | the personId of the user to whom the bot should send a message
| cb | callback function in the form function(err, file_content)

Use this function to send a direct message to a user by their personId, which
can be found in message and event payloads at the following location:

~~~ javascript
var personId = message.original_message.actorId;
~~~

### bot.startPrivateConversationWithActor())
| Parameter | Description
|--- |---
| incoming_message | a message or event that has an actorId defined in message.original_message.actorId
| cb | callback function in the form function(err, file_content)

~~~ javascript
controller.on('bot_space_join', function(bot, message) {
  bot.startPrivateConversationWithActor(message, function(err, convo) {
    convo.say('The bot you invited has joined the channel.');
  });
});
~~~

## Documentation

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Starter Kits](readme-starterkits.md)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [Message Pipeline](readme-pipeline.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Web and Apps](readme-web.md)
  * [Slack](readme-slack.md)
  * [Webex](readme-webex.md)
  * [Microsoft Teams](readme-teams.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
