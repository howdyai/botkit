# Botkit middlewares

The functionality of Botkit can be extended using middleware functions. These functions can plugin to the core bot running processes at several useful places and make changes to both a bot's configuration and
the incoming or outgoing message. Anyone can add their own middleware to the Botkit documentation, [for more information please read this.](#have-you-created-middleware)


### Middleware Endpoints

Botkit currently supports middleware insertion in three places:

* When receiving a message, before triggering any events
* When sending a message, before the message is sent to the API
* When hearing a message

Send and Receive middleware functions are added to Botkit using an Express-style "use" syntax.
Each function receives a bot parameter, a message parameter, and
a next function which must be called to continue processing the middleware stack.

Hear middleware functions are passed in to the `controller.hears` function,
and override the built in regular expression matching.

### Receive Middleware

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


### Send Middleware

Send middleware can be used to do things like preprocess the message
content before it gets sent out to the messaging client.

```
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

```
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

```
controller.changeEars(function(patterns, message) {

    // ... do something
    // return true or false
});
```



#Have you created middleware?
We would love to hear about it! [Contact the Howdy team](https://howdy.ai/) to be included in Botkit documentation, or [submit a PR on this documentation](https://github.com/howdyai/botkit-storage-firebase/blob/master/CONTRIBUTING.md)!
