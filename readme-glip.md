# Botkit and Glip

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), [Microsoft Bot Framework](https://botframework.com), [Glip](https://glip.com)
and other messaging platforms.

Built in to [Botkit](https://howdy.ai/botkit/) are a comprehensive set of features and tools to deal with [Glip](https://botframework.com), allowing developers to build interactive bots and applications that send and receive messages 
just like real humans.

This document covers the glip implementation details only. [Start here](readme.md) if you want to learn about to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Bot Framework Specific Events](#bot-framework-specific-events)
* [Working with the Bot Framework](#working-with-the-bot-framework)


## Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Register for a free developer account with RingCentral [Developer Portal](https://developers.ringcentral.com/login.html#/) and follow [this guide](https://developers.ringcentral.com/library/getting-started.html) to create your first bot application. 

* Write down the *BOTKIT_GLIP_SERVER*, *BOTKIT_GLIP_APPKEY*, *BOTKIT_GLIP_APPSECRET* , *BOTKIT_GLIP_USERNAME*, *BOTKIT_GLIP_PASSWORD*, *BOTKIT_GLIP_EXTENSION*  assigned to your new bot as you'll need them when you run your bot.

3) By default your bot will be configured to support the Glip channel but you'll need to add it as a user in Glip in order to test it. You can do that from the developer portal by clicking the "Add to Glip" button in your bots profile page.

4) Run the example bot using the parameters mentioned above. 


```
server=<MY_APP_SERVER> appKey=<MY_APP_KEY> appSecret=<MY_APP_SECRET> username=<MY_USERNAME> password=<MY_PASSWORD> extension=<MY_EXTENSION>  node glip_bot.js 
```    

5) Go to glip.devtest.ringcentral.com and signin with ringcentral account. 
   
6) Enter the *username*, *password* and *extension* to login to glip.
     
7) Invite the bot using the email address and add bot as a company user.

8) Your bot should be online! Within GLIP. Now you could use /invite to add the bot into any group or team to send and receive message.

Try:
  * uptime
  * pizzatime
  * shutdown

## Glip Specific Events

Once connected to the Bot Framework, bots receive a constant stream of events.

Normal messages will be sent to your bot using the `message_received` event.  In addition, several other events may fire, depending on the channel your bot is configured to support.

| Event | Description
|--- |---
| message_received | A message was received by the bot. 

All incoming events will contain the fields `user` and `channel`, both of which represent the glip user's ID, and a `groupid` field.

`message_received` events will also contain either a `text` field or an `attachment` field.


## Working with Glip

Botkit receives messages from the glip adapters using pubnub subscriptions, and posts messages to glip using APIs. This means that your bot application must present a web server that is publicly addressable. Everything you need to get started is already included in Botkit.

To connect your bot to Glip follow the step by step guide outlined in [Getting Started](#getting-started).

Here is the complete code for a basic Glip bot:

```javascript
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var http = require('http');
var request = require('request');


var controller = Botkit.glipbot({
    debug: false,
});

var bot = controller.spawn({
    server: process.env.BOTKIT_GLIP_SERVER,
    appKey: process.env.BOTKIT_GLIP_APPKEY,
    appSecret: process.env.BOTKIT_GLIP_APPSECRET,
    appName: 'GlipDemo',
    appVersion: '1.0.0',
    username: process.env.BOTKIT_GLIP_USERNAME,
    password: process.env.BOTKIT_GLIP_PASSWORD,
    extension: process.env.BOTKIT_GLIP_EXTENSION,
}).startRTM();

// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(process.env.port || 3000, function(err, webserver){
    webserver.get('/', function (req ,res) {
        res.send(':)');
    });
    controller.createWebhookEndpoints(webserver, bot);
});

// Usage: uptime
controller.hears(['uptime'],'message_received',function(bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message,'I am a bot! I have been running for ' + uptime + ' on ' + hostname + '.');
});

//usage: pizzatime
controller.hears(['pizzatime'],'message_received',function(bot,message) {
    bot.startConversation(message, askFlavor);
});

var askFlavor = function(response, convo) {
    convo.ask("What flavor of pizza do you want?", function(response, convo) {
        convo.say("Awesome.");
        askSize(response, convo);
        convo.next();
    });
}
var askSize = function(response, convo) {
    convo.ask("What size do you want?", function(response, convo) {
        convo.say("Ok.")
        askWhereDeliver(response, convo);
        convo.next();
    });
}
var askWhereDeliver = function(response, convo) {
    convo.ask("So where do you want it delivered?", function(response, convo) {
        var message = null;
        message = "Ordered large pizza by pawan"
        message += "\n"
        message += "\n[Ticket ##1001](www.dominos.com) - ordered large pizza"
        message += "\n"
        message += "\n**Description**"
        message += "\nOrdered large cheese pizza & should delivered at home"
        message += "\n"
        message += "\n**Priority**"
        message += "\nasap"
        convo.say(message);
        convo.next();
    });
}
```
#### Botkit.glipbot()
| Argument | Description
|---  |---
| settings | Options used to configure the bot.  

Creates a new instance of the bots controller.  The controller will create a new instance of the GlipConnector. so any options needed to configure the glip should be passed in via the `settings` argument.

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

This function configures the route `https://_your_server_/glip/receive`
to receive webhooks from glip.


