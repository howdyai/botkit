## Middleware

The functionality of Botkit can be extended using middleware
functions. These functions can plugin to the core bot running processes at
several useful places and make changes to both a bot's configuration and
the incoming or outgoing message.

For information about existing middleware plugins, [see here](readme-middlewares.md)

### Middleware Endpoints

Botkit currently supports middleware insertion in the following places:

* When receiving a message, before triggering any events
* When sending a message, before the message is sent to the API
* When hearing a message
* When matching patterns with `hears()`, after the pattern has been matched but before the handler function is called
* When capturing a users response to a `convo.ask()` question, after the user has answered, but before the value is stored or passed to the handler function

Send and Receive middleware functions are added to Botkit using an Express-style "use" syntax.
Each function receives a bot parameter, a message parameter, and
a next function which must be called to continue processing the middleware stack.

Hear middleware functions are passed in to the `controller.hears` function,
and override the built in regular expression matching.

### Receive Middleware

Receive middleware can be used to do things like preprocess the message
content using external natural language processing services like Wit.ai.
Additional information can be added to the message object for use down the chain.

```javascript
controller.middleware.receive.use(function(bot, message, next) {

    // do something...
    // message.extrainfo = 'foo';
    next();

});
```


### Send Middleware

Send middleware can be used to do things like preprocess the message
content before it gets sent out to the messaging client.

```javascript
controller.middleware.send.use(function(bot, message, next) {

    // do something useful...
    if (message.intent == 'hi') {
        message.text = 'Hello!!!';
    }
    next();

});
```


### Hear Middleware

Hear middleware can be used to change the way Botkit bots "hear" triggers.
It can be used to look for values in fields other than message.text, or use comparison methods other than regular expression matching. For example, a middleware function
could enable Botkit to "hear" intents added by an NLP classifier instead of string patterns.

Hear middleware is enabled by passing a function into the `hears()` method on the Botkit controller.
When specified, the middleware function will be used instead of the built in regular expression match.

These functions receive 2 parameters - `patterns` an array of patterns, and `message` the incoming
message. This function will be called _after_ any receive middlewares, so may use any additional
information that may have been added. A return value of `true` indicates the pattern has been
matched and the bot should respond.

```javascript
// this example does a simple string match instead of using regular expressions
function custom_hear_middleware(patterns, message) {

    for (var p = 0; p < patterns.length; p++) {
        if (patterns[p] == message.text) {
            return true;
        }
    }
    return false;
}


controller.hears(['hello'],'direct_message',custom_hear_middleware,function(bot, message) {

    bot.reply(message, 'I heard the EXACT string match for "hello"');

});
```

It is possible to completely replace the built in regular expression match with
a middleware function by calling `controller.changeEars()`. This will replace the matching function used in `hears()`
as well as inside `convo.ask().` This would, for example, enable your bot to
hear only intents instead of strings.

```javascript
controller.changeEars(function(patterns, message) {

    // ... do something
    // return true or false
});
```


### Heard Middleware

Heard middleware can be used to modify or enrich a message with additional information before it is handled by the callback function.
This can be useful for developers who want to use NLP tools, but want to limit the type and number of messages sent to be classified.
It is also useful for developers who want to mix internal application data (for example, user account information) into messages.

Whereas the `receive middleware` will fire for every single incoming message of any type, the heard middleware only fires when a pattern has already been matched.

Heard middleware functions fire anytime Botkit attempts to match a pre-defined pattern: when using the `hears()` feature, and also when using `convo.ask()` to capture user responses.


```javascript
controller.middleware.heard.use(function(bot, message, next) {

    // load internal user data and add it to the message

    mydb.users.find({id: message.user}, function(err, user_record) {

        // amend the message with a new field.
        // this will now be available inside the normal handler function
        message.internal_user = user_record;

        // call next or else execution will stall
        next();

    });

});
```

### Capture Middleware

As users respond to questions posed using `convo.ask()`, their answers will first be passed through any capture middleware endpoints.
The capture middleware can modify the message in any way, including changing the value that will be used to test pre-defined patterns
and that will ultimately be stored as the final user answer.

This can be particularly useful when used in conjunction with a natural language processing API. NLP plugins like [IBM Watson](https://github.com/watson-developer-cloud/botkit-middleware) and [Microsoft LUIS](https://github.com/Stevenic/botkit-middleware-luis) typically provide 2 features: translation of raw user text into a pre-defined `intent`, and extraction of structured data from the raw string into `entities`.

Another instance in which this is useful is when used in conjunction with buttons and quick replies that, in addition to displayed text may also carry a hidden payload value. Developers can use this middleware endpoint to capture the payload instead of the displayed text.

The `capture` middleware endpoint allows developers to harness these values and capture them instead of or in addition to the raw user text.

Please note that the signature of the `capture` middleware is slightly different than the other endpoints, as it includes a parameter for the conversation object:

```javascript
controller.middleware.capture.use(function(bot, message, convo, next) {

    // user's raw response is in message.text

    // instead of capturing the raw response, let's capture the intent
    if (message.intent) {
        message.text = message.intent;
    }

    // what if there is a hidden payload? let's use that instead
    if (message.payload) {
        message.text = message.payload;
    }

    // what if there are entities too? we can use them as part of the conversation...
    if (message.entities) {
        for (var e = 0; e < message.entities.length; e++) {
            convo.setVar(message.entities[e].name, message.entities[e].value);
        }
    }

    // always call next!
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
