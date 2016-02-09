# Botkit Middleware

The functionality of Botkit can now be extended using middleware
functions. These functions can plugin to the core bot running processes at
several useful places and make changes to both a bot's configuration and
the incoming or outgoing message.

## Middleware Endpoints

Botkit currently supports middleware insertion in three places:

* When receiving a message, before triggering any events
* When hearing a message, before triggering any events
* When sending a message, before the message is sent to the API
* Before making a call to an external API
* After making a call to an external API

Middleware functions are added to Botkit using an Express-style "use" syntax.
Each function receives (at least) a bot parameter, a message parameter, and
a next function which must be called to continue processing the middleware stack.

```
controller.middleware.receive.use(function(bot, message, next) {

    // do something...
    next();

});
```

## Receive Middleware

Receive middleware can be used to do things like preprocess the message
content using external natural language processing services like Wit.ai.  
Additional information can be added to the message object for use down the chain.

```
controller.middleware.receive.use(function(bot, message, next) {

    // do something...
    // message.extrainfo = 'foo';
    next();

});
```



## Hear Middleware

PLEASE NOTE: This is likely to change as it currently requires every hears middleware function to actually call callbacks and doesn't necessarily prevent double-processing
of a message by two matching triggers.  

Hear middleware can be used to change the way Botkit bots "hear" triggers.
It can be used to look for values in fields other than message.text, or use comparison methods other than regular expression matching. For example, a middleware function
could enable Botkit to "hear" intents added by an NLP classifier instead of string patterns.

NOTE: Unlike receive and send middleware, hears receives an extra `triggers`
parameter which contains an array of triggers that should be used to match
against the message object.  

If a trigger pattern is matched, the callback should be fired, and message.heard
should be set to true.  This will prevent it from being double-processed,
at least by other middleware functions that look for message.heard field.

```
controller.middleware.hears.use(function(bot, message, triggers, next) {

    // triggers is an array [{pattern: pattern, callback: function}]
    if (triggers && triggers.length) {
    for (var t = 0; t < triggers.length; t++) {

        if (...) {
            triggers[t].callback.apply(controller,[bot,message]);
            message.heard = true;
            break;
        }
    }

    next();

});
```

## Send Middleware

Send middleware can be used to do things like preprocess the message
content before it gets sent out to the messaging client.  This can
be used to do things like translate a custom message.intent field
into a real string so that the actual message content can be stored
externally or retrieved via API.

```
controller.middleware.send.use(function(bot, message, next) {

    // do something useful...
    if (message.intent == 'hi') {
        message.text = 'Hello!!!';
    }
    next();

});
```

# Pre_API Middleware

```
controller.middleware.pre_api.use(function(command, options, cb, next) {

    // do something useful...
    // like check a cache and call cb with that version instead of  
    // continuing
    // if (cached) {
    // cb(null,cached_version);
    // } else {
    // next();
    // }

});
```

# Post_API Middleware


```
controller.middleware.post_api.use(function(command, options, cb, response_payload, next) {

    // do something useful...
    // like stuff response_payload into the cache
    next();

});
```
