# Botkit middlewares

Table of Contents

* [Microsoft LUIS](#use-luiss-natural-language-tools-in-your-botkit-powered-bot-)


# Use Luis's natural language tools in your Botkit-powered Bot !

This middleware plugin for Botkit allows you to seamlessly integrate [Luis](http://luis.ai) natural language intent APIs into your Botkit bot.

One of the key problems in human-computer interactions is the ability of the computer to understand what a person wants, and to find the pieces of information that are relevant to their intent. For example, in a news-browsing app, you might say "Get news about virtual reality companies," in which case there is the intention to FindNews, and "virtual reality companies" is the topic. LUIS is designed to enable you to very quickly deploy an http endpoint that will take the sentences you send it, and interpret them in terms of the intention they convey, and the key entities like "virtual reality companies" that are present. LUIS lets you custom design the set of intentions and entities that are relevant to the application, and then guides you through the process of building a language understanding system.

Once your application is deployed and traffic starts to flow into the system, LUIS uses active learning to improve itself. In the active learning process, LUIS identifies the interactions that it is relatively unsure of, and asks you to label them according to intent and entities. This has tremendous advantages: LUIS knows what it is unsure of, and asks you to help where you will provide the maximum improvement in system performance. Secondly, by focusing on the important cases, LUIS learns as quickly as possible, and takes the minimum amount of your time.

## Setup

### Logging In
 
Go to [Luis.ai](http://luis.ai) and log in with your microsoft account :

<p align="center">
    <img src="https://s26.postimg.org/l05l56qgp/home.png"/>
</p>

### Creating an Application

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

## What it does

Using the [Luis](http://luis.ai) middleware with Botkit causes every message sent to your bot to be first sent through Luis.ai's NLP services for processing. The response from [Luis](http://luis.ai) is then returned in the incoming messages as seen below:

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
