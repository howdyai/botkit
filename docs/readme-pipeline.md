# Introducing the Botkit Message Pipeline

As Botkit has added support for more and more new platforms,
it has become necessary to formalize the process by which
incoming messages are received and prepared for use within
the bot's brain, and also how outgoing messages are formatted
and delivered to the appropriate messaging platform APIs.

The new message pipeline introduced in Botkit 0.6 defines this
formal path by exposing a series of middleware endpoints that occur
throughout the lifetime of a message as it is is transformed
from a "raw" message received from the platform into its normalized
form.  This normalization process allows Botkit and its array of plugins to handle a message without necessarily caring about its origin.

Message normalization like this has always been part of Botkit -
what is being introduced in 0.6 is a formalized process through which
all messages must now flow.

This document should be useful to any developer interested in using Botkit's middleware system. However, the focus of this document is on the application of the available middleware endpoints to the process of message normalization in platform connectors. Developers interested in using middleware for building plugins or for feature development should [check out the main middleware documentation](middleware.md).

## Why do we need a message pipeline?

Each messaging service that works with Botkit sends messages in a different format - some even come in multiple formats! Some of the services send messages via incoming webhook, while others send them via web sockets. Some require decryption or other processing before being used by the bot. This means that
each different type of bot has to treat the messages differently, depending on all these factors.

The message pipeline is a series of steps that Botkit takes for every single message that tries to manage all this chaos. It is a universal process that is applied to all messages from all platforms that results in a simple normalized message format.

We hope that this will simplify the process of learning to use Botkit,
increase the ability of developers to port their bots between platforms or
build multi-platform bot apps, and make it easier for plugin developers to
create extensions to Botkit that work seamlessly with all messaging services.

## How does it work?

Messages that arrive to a Botkit-powered app are now passed into the message
processing pipeline via a function called `ingest()` that receives the raw,
unprocessed payload of the incoming message - a big blob of information in some platform specific format.

Somewhere in that blob of information are a few key pieces of information that Botkit really cares about and needs to know about to work: the text, the user, the channel, and the type of the message.

Once ingested, Botkit passes the message through a series of transformations,
each one with its own middleware plugin endpoint. The result of these transformations is a message object that is guaranteed to have all of those bits of information in the right places. This transformed message is then passed into Botkit to be handled by your application.

As a result, developers writing normal Botkit code can always expect a message to be in the form:

```
{
    user: <unique_id_of_sender>,
    channel: <unique_id_of_channel>,
    text: <text, payload or other value, if any>,
    type: <type of message or event>,
    raw_message: <original unmodified version of the message>
}
```

The same process is reversed when sending a message. Developers can author messages in a generic form, in many cases only specifying the outgoing text.
These messages are then transformed by the outgoing message pipeline into
the platform-specific API payloads necessary.

### Incoming Messages

The incoming message pipeline consists of these steps:

* [Ingest](#ingest) - receive a raw incoming message event
* [Normalize](#normalize) - copy, rename or transform fields in the message so that it matches Botkit's expectations
* [Categorize](#categorize) - adjust the type of the message depending on its content. for example, identifying the difference between a direct message and a direct mention.
* [Receive](#receive) - accepts the normalized and transformed message for processing

After passing through the `receive` step, one of three things will happen:

* the message is recognized as part of an ongoing conversation, and captured by that conversation. This will fire the [capture middleware](#capture) .
* the message matches a 'hears' pattern and passed in to a handler function. This will fire the [heard middleware](#heard) .
* the message will trigger a Botkit event based on value of the `message.type` field. No further middleware will fire in this case.

### Outgoing Messages

The outgoing message pipeline consists of these steps:

* [Send](#send) - accept an outgoing message to be sent to a message platform.
* [Format](#format) - do the necessary transformations from a simplified Botkit message object to the platform specific API payload

# Middleware Definitions

The pipeline middlewares are useful for two primary reasons:

* It allows the development of new platform connectors via a prescribed mechanism
* It gives developers hooks to modify the internal workings of Botkit

Middleware functions can be developed to do all sorts of useful things, and can now be tied the pipeline at any phase, depending on the purpose of the middleware.

As of version 0.6, all Botkit platform connectors include middleware functions
responsible for their platform-specific transformations. These platform middlewares will _always fire first_, before any additional middlewares defined by the developer or included in the application code.

Developers can specify as many middlewares as desired, including multiple middleware functions registered to the same endpoints. These functions will fire in the order they are defined.

Plugin middlewares can do things like:
* Call third party NLP/NLU APIs and enrich the message object
* Load information from databases and enrich the message object
* Verify or authenticate message objects and discard unverified or unwanted messages
* Further categorize messages in order to fire new or different events
* Handle classes of events "in the background" without changing specific handlers
* Log or record messages for debugging or statistics


## Ingest

Ingestion into Botkit is the first step in the message pipeline.

Message objects that pass through the ingest phase will have 2 additional fields:

`message.raw_message` contains the unmodified content of the incoming message payload as received from the messaging service

`message._pipeline` is an object that tracks a message's progress through the pipeline. The subfield `message._pipeline.stage` will contain the name of the current pipeline step.

Functions added to the ingest middleware endpoint need to receive 4 parameters, as below.

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the incoming message object
| response channel | the http response object
| next | function to call to proceed with pipeline

```
controller.middleware.ingest.use(function(bot, message, res, next) {

    // define action
    // perhaps set an http status header
    // res.status(200);
    // you can even send an http response
    // res.send('OK');

    // you can access message.raw_message here

    // call next to proceed
    next();

});
```

The ingest phase is useful for actions like:

* Validating the origin of the incoming payload using a shared secret or encrypted header
* Sending necessary HTTP response to the incoming webhooks. For example, some platforms require a 200 response code!

Note that in the ingest phase, the message object has _not yet been normalized_ and may not contain the fields you expect.  Developers should treat these messages as raw, platform specific messages,
and as a result should check the `bot.type` field, which contains the name of the specific messaging platform, before taking any actions on the message object!

## Normalize

Normalization is the second phase of the message pipeline.

After passing through the normalize phase, the message object is expected to have the following fields:

* `type` will contain either the raw value of the incoming `type` field specified by the platform, OR `message_received` which is the default message type defined by Botkit.
* `user` will contain the unique id of the sending user
* `channel` will include the unique id of the channel in which the message was sent
* `text` will contain the text, if any, of the message.

Note that the entire original unmodified message object will still be available as `message.raw_message`. Though Botkit's normalization process does not remove any fields from the message as it is normalized, those fields are not guaranteed to be present. It is our recommendation that developers who want to access to platform-specific fields _always_ use the `message.raw_message` location.

For example, if the originally ingested payload included a field called `message.my_platform_value`, you should refer to it in your code as `message.raw_message.my_platform_value`.

Functions added to the normalize middleware endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the incoming message object
| next | function to call to proceed with pipeline

```
controller.middleware.normalize.use(function(bot, message, next) {

    // here's an example of what a message normalizer might do!
    // this is a make believe example not specific to any real platform
    // the idea is to copy/rename or tranform fields from raw_message
    // into an object with {user, text, channel, type} while leaving everything else alone

    // translate a "from" field into message.user
    message.user = message.raw_message.from.id;

    // find the text value and set it in message.text
    message.text = message.raw_message.user_text;

    // make sure a channel value is set
    message.channel = message.raw_message.source_channel

    // call next to proceed
    next();

});
```


## Categorize

Categorization is the third phase of the message pipeline.

After passing through the catgorize phase, the message object's `type` field
should represent a the final event type that will be handled by Botkit.

The most obvious example of a categorization action is identifying and transforming a message from a generic `message_received` event into more narrowly defined `direct_mention`, `direct_mention`, `mention` or `ambient` message event.

In addition to changing the message `type` field, the `categorize` middleware may also
change the value of the `message.text` field. For example, it should _remove direct mentions from the text_ so that developers do not have to compensate for its possible presence in the input text.

Categorize middlewares can also catch and delegate complex message types to simpler,
easier to handle events, taking some of the burden off of developers for handling these subtleties. For example, a categorize middleware might identify different types of button click events that all share the same `type` value and create new event names for each.

Functions added to the categorize middleware endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the incoming message object
| next | function to call to proceed with pipeline

```
controller.middleware.categorize.use(function(bot, message, next) {

    // messages in Slack that are sent in a 1:1 channel
    // can be identified by the first letter of the channel ID
    // if it is "D", this is a direct_message!
    if (message.type == 'message_received') {
        if (message.channel[0] == 'D') {
            message.type = 'direct_message';
        }
    }

    // call next to proceed
    next();

});
```


## Receive

Receive is the final step in the incoming message pipeline before the message
actually reaches the bot's internal logic.

By the time a message hits the `receive` stage, it is in its final form,
and is ready to be processed by a Botkit event handler. This middleware endpoint
occurs _just before_ a message is evaluated for trigger matches, and before any
user-defined handler runs. It will fire for every incoming message, regardless of whether or not it matches a trigger or if any event handlers are registered to receive it.

As noted above, after passing through the `receive` step, one of three things will happen:

* the message is recognized as part of an ongoing conversation, and captured by that conversation. This will fire the [capture middleware](#capture) .
* the message matches a 'hears' pattern and passed in to a handler function. This will fire the [heard middleware](#heard) .
* the message will trigger a Botkit event based on value of the `message.type` field. No further middleware will fire in this case, and Botkit will fire any handlers registered with the `controller.on()` function.

Developers seeking to enrich their messages with data from external sources, such as external NLP services, databases or other third party APIs, may wish to tie this functionality to the receive middleware endpoint. This will cause the enrichment to occur for _every single message_ that is received. This may or may not be desirable, depending on the number and type of messages the platforms send, and the types of messages your bot is supposed to handle.

Before calling any external service in a receive middleware, developers should evaluate the message's `type` and `text` field to make sure enrichment is appropriate. For example, you don't want to call an expensive NLP process on messages without text, or messages that represent button clicks.

Alternately, developers may wish to attach their enrichment functionality to the more narrowly defined `heard` and `capture` middlewares, which occur _after_ pattern matching has occured, and as a result will only fire for messages that _are definitely going to be handled_.

Functions added to the categorize middleware endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the incoming message object
| next | function to call to proceed with pipeline

```
controller.middleware.receive.use(function(bot, message, next) {

    // lets call a pretend external NLP system
    // and enrich this message with intent and entity data

    // make sure we have some text, and that this is
    // not a message from the bot itself...
    if (message.text && message.type != 'self_message') {
        callExternalNLP(message.text).then(function(api_results) {
            message.intent = api_results.intent;
            message.entities = api_results.entities;
            next();
        });
    } else {
        next();
    }
});
```

## Heard

The `heard` middleware endpoint occurs after a message has matched a trigger pattern, and is about to be handled. It works just like the `receive` endpoint, but instead of firing for every incoming message, it will only fire for messages that the is explicitly listening for.

This makes the `heard` endpoint useful for firing expensive operations, such as database lookups or calls to external APIs tat take a long time, require a lot of processing, or actually cost money to use. However, it makes it less useful for use with NLP tools, since the pattern matching has already occured.

Note that the heard middleware fires only for messages that match handlers set up with `controller.hears()`, and does not fire with handlers configured with the `controller.on()` method.

Functions added to the categorize heard endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the incoming message object
| next | function to call to proceed with pipeline

```
controller.middleware.heard.use(function(bot, message, next) {

    // load up any user info associated with this sender
    // using Botkit's internal storage system
    // and enrich the message with a new `user_profile` field
    // now, every message will have the user_profile field automatically
    // and you don't need to load the info in each individual handler function
    controller.storage.users.get(message.user, function(err, user_profile) {
        if (!err && user_profile) {
            message.user_profile = user_profile;
        }

        // call next to proceed, now with additional info!
        next();
    });
});
```

## Capture

The `capture` middleware once again works like the `receive` or `heard` endpoints,
but fires only on the condition that the incoming message is part of an existing
conversation. Generally, this means that the message will actually be handled a callback function passed into `convo.ask()`

This endpoint is useful for transforming the value used by the conversation to something
other than the user's raw input text. For example, in a bot that presents a numbered list of options to a user as part of a multiple choice selection, a capture middleware could be created that transforms the user's numeric input into the full text of the selected item.


## Send

When you send a message with `bot.send()` or `bot.reply()`, the outgoing message is first sent
through the send middleware.

The send middleware receives the raw message, as created in your bot's code. It has not yet been formatted for delivery to the messaging service API. This can be used to modify or track the outgoing messages BEFORE they are formatted for delivery to the platform API.

In particular, this middleware is useful for recording stats about outgoing messages. At this point in the pipeline, the message object will contain the outgoing message text and any attachments, as well as a special `message.to` field, which represents the unique user id of the message's recipient. Depending on the platform, this value is not always present in the final outgoing message payload.

Any modifications to the _content_ of the outgoing message should happen in a send middleware function.  For example, developers can use a send middleware to translate the message text into different languages.  Or, developers might pass the message text through a template engine to replace tokens or expand custom shortcodes.

Send middlewares should _not_ make changes to the actual structure or layout of the outgoing message object. Final formatting for delivery to the platform is done by the `format` endpoint.

Functions added to the categorize send endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the outgoing message object
| next | function to call to proceed with pipeline

```
controller.middleware.send.use(function(bot, message, next) {

    // log the outgoing message for debugging purposes
    console.log('SENDING ', message.text,'TO USER', message.text);

    next();

});
```

## Format

This middleware happens immediately before a message is delivered to the platform API.

Each platform as its own special format for incoming message objects. This middleware should exclusively be used for constructing the final API parameters required for delivering the message. The message object that emerges from this function is intended only for use with the messaging service API.

After being formatted, the resulting `platform_message` is passed into the platform-specific `bot.send()` function, which is responsible for the final delivery of the message the appropriate external API endpoint. This allows the `bot.send()` function to be designed to accept only pre-formatted messages.

Unlike all the other pipeline endpoints, this function does NOT modify the original message object. In fact, the final object is constructed by the middleware in the `platform_message` parameter,
allowing the original message to pass through unmolested.

Functions added to the categorize format endpoint need to receive these parameters:

| Field | Description
|--- |---
| bot | an instance of the bot
| message | the outgoing message object
| platform_message | the formatted message, ready for delivery
| next | function to call to proceed with pipeline

```
controller.middleware.format.use(function(bot, message, platform_message, next) {

    // let's construct an outgoign message payload
    // to an imaginary platform that uses some different fieldnames.

    platform_message.message = {
        text: message.text,
        recipient: message.to,
        room: message.channel,
    }

    platform_message.type = 'message';

    next();

});
```

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
  * [Cisco Spark](readme-ciscospark.md)
  * [Microsoft Teams](readme-teams.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
