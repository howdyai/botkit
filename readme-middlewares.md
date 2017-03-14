# Botkit middlewares

The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and
the incoming or outgoing message. Anyone can add their own middleware to the Botkit documentation, [for more information please read this.](#have-you-created-middleware)

Currently the following types of middleware are available for Botkit:

### [Natural language processing](#natural-language-processing)


* [Microsoft Luis](#microsoft-luis)
* [Api.ai](#apiai)
* [IBM Watson](#ibm-watson)
* [Recast.ai](#recastai) 


### [Storage Modules](#storage-modules)
Storage middleware can be used for storing attributes about a user or channel or team. It is currently available for the following services:

* [Mongo](#mongo)
* [Redis](#redis)
* [Datastore](#datastore)
* [Firebase](#firebase)
* [Postgres](#postgres)
* [CouchDB](#couchdb)

### [Statistics](#statistics)
* [Keen](#keen)


### [CRM](#crm-modules)
* [bCRM](#bcrm)
* [Dashbot](#dashbot)
* [Wordhop](#wordhop)




#Natural Language Processing
## Microsoft Luis
### [Project Page](https://github.com/Stevenic/botkit-middleware-luis)
### What it does

The [Luis](http://luis.ai) middleware with Botkit causes every message sent to your bot to be first sent through Luis.ai's NLP services for processing. The response from [Luis](http://luis.ai) is then returned in the incoming messages as seen below:

    {
      "query": "start tracking a run",
      "intents": [
        {
          "intent": "startActivity",
          "score": 0.9999981
        },
        {
          "intent": "None",
          "score": 0.144195557
        },
        {
          "intent": "stopActivity",
          "score": 1.54796021E-06
        }
      ],
      "entities": [
        {
          "entity": "run",
          "type": "activityType",
          "startIndex": 17,
          "endIndex": 19,
          "score": 0.9391843
        }
      ]
    }

Using the Wit hears middleware tells Botkit to look for [Luis](http://luis.ai) intents information, and match using this information instead of the built in pattern matching function.



### Setup

Go to [Luis.ai](http://luis.ai) and log in with your microsoft account :

<p align="center">
    <img src="https://s26.postimg.org/l05l56qgp/home.png"/>
</p>

### Setup

The first step to using [Luis](http://luis.ai) is to create an application. In the application, you will bundle together the intents and entities that are important to your task.

<p align="center">
    <img src="https://s26.postimg.org/el6k8ijqx/createApp.png"/>
</p>

From your app's settings page, snag the service url. You will need this to use Luis's API.

Next you will need to add botkit-middleware-luis as a dependency to your Botkit bot:

```
npm install --save botkit-middleware-luis
```

Enable the middleware:
```javascript
var luis = require('./lib/luis-middleware.js');

var luisOptions = {serviceUri: process.env.serviceUri};

controller.middleware.receive.use(luis.middleware.receive(luisOptions));

controller.hears(['hello','hi'],['direct_message','direct_mention','mention'], luis.middleware.hereIntent, function(bot,message) {
    bot.reply(message,"Hello.");
});
```
## Api.ai
### [Project Page](https://github.com/abeai/botkit-middleware-apiai)
This middleware plugin for Botkit allows you to utilize Api.ai, a natural language classifier service directly into the Botkit corebot.

The Api.ai platform lets developers seamlessly integrate intelligent voice and text based command systems into their products to create consumer-friendly voice/text-enabled user interfaces.

### What it does

Using the Api.ai middleware with Botkit causes every message sent to your bot to be first sent through Api.ai's NLP services for processing. The response from Api.ai is then returned in the incoming messages as `message.intent`, `message.entities` for any language entities (dates, places, etc), `message.fulfillment` for Api.ai specific speech fulfillment, `message.confidence` for the confidence interval, and finally the `message.nlpResponse` which represents the raw request as seen below:

    {
      "id": "XXXX",
      "timestamp": "2016-05-31T18:20:38.992Z",
      "result": {
        "source": "agent",
        "resolvedQuery": "hello",
        "action": "",
        "actionIncomplete": false,
        "parameters": {},
        "contexts": [],
        "metadata": {
          "intentId": "XXX",
          "webhookUsed": "false",
          "intentName": "hello"
        },
        "fulfillment": {
          "speech": ""
        },
        "score": 1
      },
      "status": {
        "code": 200,
        "errorType": "success"
      }
    }


### Setup
In order to utilize api.ai's service you will need to create an account and an agent. An agent will represent your Bot's comprehension skills. Head over to their [sign up page](https://console.api.ai/api-client/#/signup) to get started. After creating an account you will be able to create your first agent and start creating intents. Grab the *developer access token* for your local dev and a *client access token* for production as seen below

![Api.ai Tokens](http://s33.postimg.org/6areug03j/apiai.jpg)

Next you will need to add botkit-middleware-apiai as a dependency to your Botkit bot:

```
npm install --save botkit-middleware-apiai
```

Enable the middleware:
```javascript
var apiai = require('botkit-middleware-apiai')({
    token: <my_apiai_token>
});

controller.middleware.receive.use(apiai.receive);

controller.hears(['hello'],'direct_message',apiai.hears,function(bot, message) {
    // ...
});
```

## IBM Watson
### [Project Page](https://github.com/watson-developer-cloud/botkit-middleware)

### What it does
This middleware plugin for Botkit allows developers to easily integrate a Watson Conversation workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

### Setup

#### Acquire Watson Conversation credentials
The middleware needs you to provide the `username`, `password`, and `workspace_id` of your Watson Conversation chat bot. If you have an existing Conversation service instance, follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#configuring-the-application-environmnet) to get your credentials.

If you do not have a Conversation service instance,  follow [these steps](https://github.com/watson-developer-cloud/conversation-simple/blob/master/README.md#before-you-begin) to get started.

For more information on adding Watson to your bot check [this projects documentation](https://github.com/watson-developer-cloud/botkit-middleware/blob/master/README.md)


## Recast.ai

### [Project Page](https://github.com/ouadie-lahdioui/botkit-middleware-recastai)

You can use the Recast.AI API to analyse your text or your audio file, and extract useful informations from it, to personalize your IoT, classify your data or create bots.

The middleware needs you to provide the `request_token` of your Recast bot project and an optional `confidence`.

## Set up

- Add botkit-middleware-recastai as a dependency to your Botkit bot :

```npm install --save botkit-middleware-recastai```

- Enable the middleware :
 
```
var RecastaiMiddleware = require('botkit-middleware-recastai')({
        request_token: '322e96b09ef75ad32bfc8b6f22b857ef',
        confidence: 0.4
});

controller.middleware.receive.use(RecastaiMiddleware.receive);

controller.hears(['news'],'message_received', RecastaiMiddleware.hears,function(bot, message) {

 // ...
});
```

For more information on adding Recast to your bot check [this projects documentation](https://github.com/ouadie-lahdioui/botkit-middleware-recastai)

# Storage Modules
## Mongo
### [Project Page](https://github.com/howdyai/botkit-storage-mongo/)
### What it does
A Mongo storage module for Botkit.

### Setup
Just require `botkit-storage-mongo` and pass it a config with a `mongoUri` option.
Then pass the returned storage when creating your Botkit controller. Botkit will do the rest.

Make sure everything you store has an `id` property, that's what you'll use to look it up later.

```javascript
var Botkit = require('botkit'),
    mongoStorage = require('botkit-storage-mongo')({mongoUri: '...'}),
    controller = Botkit.slackbot({
        storage: mongoStorage
    });
```

```javascript
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};
controller.storage.teams.save(beans);
beans = controller.storage.teams.get('cool');

```

## Redis
### [Project Page](https://github.com/howdyai/botkit-storage-redis)
### What it does
A redis storage module for Botkit

### Setup
Just require `botkit-storage-redis` and pass it your config options (or none if your cool with defaults).
Then pass the returned storage when creating your Botkit controller. Botkit will do the rest!

Make sure everything you store has an `id` property, that's what you'll use to look it up later.

```javascript
var Botkit = require('botkit'),
    redisConfig = {...}
    redisStorage = require('botkit-storage-redis')(redisConfig),
    controller = Botkit.slackbot({
        storage: redisStorage
    });
```

```
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};
controller.storage.teams.save(beans);
beans = controller.storage.teams.get('cool');

```

#### Options

You can pass any options that are allowed by [node-redis](https://github.com/NodeRedis/node_redis).

Additionally you can pass a `namespace` property which is used to namespace keys in Redis. `namespace` defaults to `botkit:store`.

You can also pass a `methods` property which is an array of additional custom methods you want to add. The default methods are `teams`, `users`, and `channels`.

## Datastore
### [Project Page](https://github.com/fabito/botkit-storage-datastore)
### What it does
A Google Cloud Datastore storage module for Botkit

### Setup

Just require `botkit-storage-datastore` and pass it a config with a `projectId` option.
Then pass the returned storage when creating your Botkit controller. Botkit will do the rest.

Make sure everything you store has an `id` property, that's what you'll use to look it up later.

```javascript
var Botkit = require('botkit'),
    datastoreStorage = require('botkit-storage-datastore')({projectId: '...'}),
    controller = Botkit.slackbot({
        storage: datastoreStorage
    });
```

```
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};
controller.storage.teams.save(beans);
beans = controller.storage.teams.get('cool');
```

## Firebase
### [Project Page](https://github.com/howdyai/botkit-storage-firebase)
### What it does
A Firebase storage module for Botkit.

### Setup
Just require `botkit-storage-firebase` and pass it a config with a `firebase_uri` option.
Then pass the returned storage when creating your Botkit controller. Botkit will do the rest.

Make sure everything you store has an `id` property, that's what you'll use to look it up later.

```javascript
var Botkit = require('botkit'),
    firebaseStorage = require('botkit-storage-firebase')({firebase_uri: '...'}),
    controller = Botkit.slackbot({
        storage: firebaseStorage
    });
```

```javascript
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};
controller.storage.teams.save(beans);
beans = controller.storage.teams.get('cool');

```

## Postgres
### [Project Page](https://github.com/lixhq/botkit-storage-postgres)
### What it does
Postgres storage module for Botkit

### Usage
Install with npm

```
npm install botkit-storage-postgres --save
```

and require it and use it:

```javascript
var botkitStoragePostgres = require('botkit-storage-postgres');
var Botkit = require('botkit');

var controller = Botkit.slackbot({
  storage: botkitStoragePostgres({
    host: 'localhost',
    user: 'botkit',
    password: 'botkit',
    database: 'botkit'
  })
});
```
## CouchDB 
### [Project Page](https://github.com/mbarlock/botkit-storage-couchdb/)
### What it does
A Couchdb storage module for botkit

## Setup
```bash
$ npm install botkit-storage-couchdb --save
```

## Usage
Require `botkit-storage-couchdb` and pass your config options. Then pass the returned storage when creating your Botkit controller. Botkit will do the rest!


```js
const Botkit = require('botkit'),
    couchDbStorage = require('botkit-storage-couchdb')("localhost:5984/botkit"),
    controller = Botkit.slackbot({
        storage: couchDbStorage
    });
    
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};

controller.storage.teams.save(beans);

controller.storage.teams.get('cool', (error, team) => {
    console.log(team);
});
```

### Options
You can pass any options that are allowed by [nano](https://github.com/dscape/nano#configuration).

The url you pass should contain your database.

```js
couchDbStorage = require('botkit-storage-couchdb')("localhost:5984/botkit")
```

To specify further configuration options you can pass an object literal instead:

```js
// The url is parsed and knows this is a database
couchDbStorage = require('botkit-storage-couchdb')({ 
    "url": "http://localhost:5984/botkit", 
    "requestDefaults" : { "proxy" : "http://someproxy" },
    "log": function (id, args) {
        console.log(id, args);
    }
});
```


# Statistics
## Keen
### [Project Page](https://github.com/keen/keen-botkit)
### What it does
This middleware allows you to to understand how many messages are going through your system, run cohorts to measure retention, set up funnels to measure task completion, and any key metric unique to your bot. More information about the Keen platform [can be found on their website](https://keen.github.io/keen-botkit/)
### Setup
Keen IO Botkit is available via NPM.

```bash
npm install keen-botkit --save
```

If you want to use the example code, you can also clone it directly from Git.

```bash
git clone git@github.com:nemo/keen-botkit.git
```

Note that after cloning, you'll have to install the dependencies (which is just [keen-js](https://github.com/keen/keen-js):

```bash
npm install
```

# CRM Modules
## bCRM
### [Project Page](https://github.com/howdyai/botkit-middleware-bcrm)
### What it does
This Botkit plugin enables support for bCRM, a customer CRM tool that enables bot developers to send broadcast messages to users of their bot.

This plugin currently works with Slack and Facebook bots.


### Setup

```
npm install --save botkit-middleware-bcrm
```

## Enable Your Bot

1) [Create a bCRM account](https://bcrm.com?ref=botkit-middleware-bcrm) and get your bCRM `token` and bCRM `bot id`.

2) Add the following lines to your Botkit application:

```javascript
require('botkit-middleware-bcrm')({
    bcrm_token: 'my_bcrm_token',
    bcrm_bot: 'my_bcrm_bot',
    controller: controller
});
```

3) To register new users with bCRM:

> If using Slack, register a new team with your bot's application via the oauth flow.
Note, this assumes you are using the built-in oauth support.

> If using Facebook, click the "Get Started" or any other button that fires a [facebook_postback](https://github.com/howdyai/botkit/blob/master/readme-facebook.md#using-structured-messages-and-postbacks) or `facebook_optin` event.
Note, your app must be set to subscribe to the postback and/or optin events inside Facebook's developer tool.

## Security Note

In order to provide its service, this plugin sends information to bCRM that allows
the bCRM software to access information and send messages on behalf of your bot.
Before using this plugin, [read bCRM's privacy policy](https://bcrm.com/privacy),
and make sure your own policies reflect the fact that you share information with them.

## Dashbot
### [Project Page Facebook](https://www.dashbot.io/sdk/facebook/botkit)
### [Project Page Slack](https://www.dashbot.io/sdk/slack/botkit)
### What it does
Increase user engagement, acquisition, and monetization through actionable bots analytics.
### Setup
Full install instructions [can be found here](https://www.dashbot.io/sdk)


## Wordhop
### [Project Page](https://github.com/wordhop-io/wordhop-npm)
### What it does
Wordhop monitors your Chatbot and alerts you on Slack in real-time when it detects conversational problems. You can watch your bot conversations with users in real-time without leaving Slack and take-over your bot to engage your customers directly.  Simply add Wordhop to Slack and then drop in code into your Chatbot (You can use our examples as a starting point for a bot too). Wordhop integrates in minutes, and begins working immediately.

This module has been tested with Messenger, Slack, Skype, and Microsoft Webchat. Please see our [examples](https://github.com/wordhop-io/wordhop-npm/tree/master/examples).

### Setup
[Installation Guide](https://github.com/wordhop-io/wordhop-npm/blob/master/README.md#installation)


#Have you created middleware?
We would love to hear about it! [Contact the Howdy team](https://howdy.ai/) to be included in Botkit documentation, or [submit a PR on this documentation](https://github.com/howdyai/botkit-storage-firebase/blob/master/CONTRIBUTING.md)!
