# Botkit middlewares

The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and the incoming or outgoing message. Anyone can add their own middleware to the Botkit documentation, [for more information please read this.](#have-you-created-middleware)

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
* [bCRM](#bcrm)
* [Botmetrics](#botmetrics)
* [Keen](#keen)

### [CRM](#crm-modules)
* [bCRM](#bcrm)
* [Dashbot](#dashbot)
* [Wordhop](#wordhop)


# Natural Language Processing

## Microsoft Luis
### [Project Page](https://github.com/Stevenic/botkit-middleware-luis)
The [Luis](http://luis.ai) middleware with Botkit causes every message sent to your bot to be first sent through Luis.ai's NLP services for processing.

## Api.ai
### [Project Page](https://github.com/abeai/botkit-middleware-apiai)
This middleware plugin for Botkit allows you to utilize Api.ai, a natural language classifier service directly into the Botkit corebot.

The Api.ai platform lets developers seamlessly integrate intelligent voice and text based command systems into their products to create consumer-friendly voice/text-enabled user interfaces.

## IBM Watson
### [Project Page](https://github.com/watson-developer-cloud/botkit-middleware)
This middleware plugin for Botkit allows developers to easily integrate a Watson Conversation workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.

## Recast.ai
### [Project Page](https://github.com/ouadie-lahdioui/botkit-middleware-recastai)
You can use the Recast.AI API to analyse your text or your audio file, and extract useful informations from it, to personalize your IoT, classify your data or create bots.

# Storage Modules

## Mongo
### [Project Page](https://github.com/howdyai/botkit-storage-mongo)
A Mongo storage module for Botkit

## Redis
### [Project Page](https://github.com/howdyai/botkit-storage-redis)
A redis storage module for Botkit

## Datastore
### [Project Page](https://github.com/fabito/botkit-storage-datastore)
A Google Cloud Datastore storage module for Botkit

## Firebase
### [Project Page](https://github.com/howdyai/botkit-storage-firebase)
A Firebase storage module for Botkit.

## Postgres
### [Project Page](https://github.com/lixhq/botkit-storage-postgres)
Postgres storage module for Botkit

## CouchDB
### [Project Page](https://github.com/mbarlock/botkit-storage-couchdb/)
A Couchdb storage module for botkit


# Statistics

## Botmetrics
### [Project Page](https://github.com/botmetrics/botkit-middleware-botmetrics)
[Botmetrics](https://www.getbotmetrics.com) is an analytics and engagement platform for chatbots.

## Keen
### [Project Page](https://github.com/keen/keen-botkit)
This middleware allows you to to understand how many messages are going through your system, run cohorts to measure retention, set up funnels to measure task completion, and any key metric unique to your bot. More information about the Keen platform [can be found on their website](https://keen.github.io/keen-botkit/)

# CRM Modules
## bCRM
### [Project Page](https://github.com/howdyai/botkit-middleware-bcrm)
This Botkit plugin enables support for bCRM, a customer CRM tool that enables bot developers to send broadcast messages to users of their bot. This plugin currently works with Slack and Facebook bots.

## Dashbot
### [Project Page Facebook](https://www.dashbot.io/sdk/facebook/botkit)
### [Project Page Slack](https://www.dashbot.io/sdk/slack/botkit)
Increase user engagement, acquisition, and monetization through actionable bots analytics.

## Wordhop
### [Project Page](https://github.com/wordhop-io/wordhop-npm)
Wordhop monitors your Chatbot and alerts you on Slack in real-time when it detects conversational problems. You can watch your bot conversations with users in real-time without leaving Slack and take-over your bot to engage your customers directly.  Simply add Wordhop to Slack and then drop in code into your Chatbot (You can use our examples as a starting point for a bot too). Wordhop integrates in minutes, and begins working immediately.

This module has been tested with Messenger, Slack, Skype, and Microsoft Webchat.

# Have you created middleware?
We would love to hear about it! [Contact the Howdy team](https://howdy.ai/) to be included in Botkit documentation, or [submit a PR on this documentation](https://github.com/howdyai/botkit-storage-firebase/blob/master/CONTRIBUTING.md)!


## Documentation

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Slack](readme-slack.md)
  * [Cisco Spark](readme-ciscospark.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
