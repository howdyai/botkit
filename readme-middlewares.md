# Botkit middlewares

The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and
the incoming or outgoing message. Anyone can add their own middleware to the Botkit documentation, [for more information please read this.](#have-you-created-middleware)

Currently the following types of middleware are available for Botkit:

### [Natural language processing](#natural-language-processing)

* [Microsoft Luis](#microsoft-luis)
* [Api.ai](#apiai)
* [IBM Watson](#ibm-watson) 


### [Storage Modules](#storage-modules)
* [Mongo](#mongo)
* [Redis](#redis)
* [Datastore](#datastore)
* [Firebase](#firebase)


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
```
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
```
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

# Storage Modules
## Mongo 
### [Project Page](https://github.com/howdyai/botkit-storage-mongo/)
### What it does
A Mongo storage module for Botkit.

### Setup
Just require `botkit-storage-mongo` and pass it a config with a `mongoUri` option.
Then pass the returned storage when creating your Botkit controller. Botkit will do the rest.

Make sure everything you store has an `id` property, that's what you'll use to look it up later.

```
var Botkit = require('botkit'),
    mongoStorage = require('botkit-storage-mongo')({mongoUri: '...'}),
    controller = Botkit.slackbot({
        storage: mongoStorage
    });
```

```
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

```
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

```
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

```
var Botkit = require('botkit'),
    firebaseStorage = require('botkit-storage-firebase')({firebase_uri: '...'}),
    controller = Botkit.slackbot({
        storage: firebaseStorage
    });
```

```
// then you can use the Botkit storage api, make sure you have an id property
var beans = {id: 'cool', beans: ['pinto', 'garbanzo']};
controller.storage.teams.save(beans);
beans = controller.storage.teams.get('cool');

```

#Have you created middleware?
We would love to hear about it! [Contact the Howdy team](https://howdy.ai/) to be included in Botkit documentation, or [submit a PR on this documentation](https://github.com/howdyai/botkit-storage-firebase/blob/master/CONTRIBUTING.md)!
