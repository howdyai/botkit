# Botkit middlewares

The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and the incoming or outgoing message. Anyone can add their own middleware to the Botkit documentation, [for more information please read this.](#have-you-created-middleware)

Currently the following types of middleware are available for Botkit:
### [Natural language processing](#natural-language-processing)
Natural language processing allows for bots to understand conversational human inputs and interpt your users desires into actionable functions of your application. Once properly trained, these add-ons can dramtiacally improve the UX for your bot application.

### [Storage Modules](#storage-modules-1)
Storage middlewares can be used for storing attributes about a user or channel or team. Botkit supports most major storage methods.

### [Statistics, Metrics, and CRM](#statistics-metrics-and-crm-1)
These plugins help you measure the success of your bots, across a variety of measurable methods.


## Natural Language Processing

  Name | Project Page | Info |
|  ------ | ------ | ------ |
|  Microsoft Luis | https://github.com/Stevenic/botkit-middleware-luis | The Luis middleware with Botkit causes every message sent to your bot to be first sent through Luis.ai's NLP services for processing. This middleware has deep integration with [Botkit Studio](https://botkit.groovehq.com/knowledge_base/topics/microsoft-luis)<br/><br/> |
|  Api.ai | https://github.com/abeai/botkit-middleware-apiai | This middleware plugin for Botkit allows you to utilize Api.ai, a natural language classifier service directly into the Botkit corebot.<br/><br/> |
|  IBM Watson | https://github.com/watson-developer-cloud/botkit-middleware | This middleware plugin for Botkit allows developers to easily integrate a Watson Conversation workspace with multiple social channels like Slack, Facebook, and Twilio. Customers can have simultaneous, independent conversations with a single workspace through different channels.<br/><br/> |
|  Recast.ai | https://github.com/ouadie-lahdioui/botkit-middleware-recastai | You can use the Recast.AI API to analyse your text or your audio file, and extract useful informations from it, to personalize your IoT, classify your data or create bots.<br/><br/> |
|  Wit.ai | https://github.com/howdyai/botkit-middleware-witai | Wit.ai provides a service that uses machine learning to help developers handle natural language input. The Wit API receives input from the user, and translates it into one or more "intents" which map to known actions or choices. The power of Wit is that it can continually be trained to understand more and more responses without changing the underlying bot code!<br/><br/> |
|  Rasa | https://github.com/howdyai/botkit-rasa | This plugin provides Botkit developers a way to use the rasa NLU open source, self hosted natural language API.<br/><br/><br/> |

## Storage Modules
|  Name | Project Page | Info |
|  ------ | ------ | ------ |
|  Mongo | https://github.com/howdyai/botkit-storage-mongo | A Mongo storage module for Botkit |
|  Redis | https://github.com/howdyai/botkit-storage-redis | A redis storage module for Botkit |
|  Datastore | https://github.com/fabito/botkit-storage-datastore | A Google Cloud Datastore storage module for Botkit |
|  Firebase | https://github.com/howdyai/botkit-storage-firebase | A Firebase storage module for Botkit. |
|  Postgres | https://github.com/lixhq/botkit-storage-postgres | Postgres storage module for Botkit<br/> |
|  CouchDB | https://github.com/mbarlock/botkit-storage-couchdb/ | A Couchdb storage module for botkit |


## Statistics, Metrics, and CRM

|  Name | Project Page | Info |
|  ------ | ------ | ------ |
|  Botimize | https://github.com/botimize/botimize-botkit-middleware | Optimize your bot for happier customers, scientifically.|
|  Botkit Studio Metrics | https://github.com/howdyai/botkit-studio-metrics | This module enables the advanced analytics and extended metrics available in [Botkit Studio](http://www.botkit.ai). |
|  Botmetrics | https://github.com/botmetrics/botkit-middleware-botmetrics | Botmetrics is an analytics and engagement platform for chatbots. |
|  Dashbot Facebook | https://www.dashbot.io/sdk/slack/botkit | Increase user engagement, acquisition, and monetization through actionable bots analytics. |
|  Dashbot Slack | https://www.dashbot.io/sdk/facebook/botkit | Increase user engagement, acquisition, and monetization through actionable bots analytics. |
|  Keen | https://github.com/keen/keen-botkit | This middleware allows you to to understand how many messages are going through your system, run cohorts to measure retention, set up funnels to measure task completion, and any key metric unique to your bot. More information about the Keen platform can be found on their website |
|  Wordhop | https://github.com/wordhop-io/wordhop-npm | Wordhop monitors your Chatbot and alerts you on Slack in real-time when it detects conversational problems. You can watch your bot conversations with users in real-time without leaving Slack and take-over your bot to engage your customers directly. Simply add Wordhop to Slack and then drop in code into your Chatbot (You can use our examples as a starting point for a bot too). Wordhop integrates in minutes, and begins working immediately.<br/><br/> |

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
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
