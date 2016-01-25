/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();



// Example receive middleware.
// Console.log's every message that gets received.
controller.middleware.receive.use(function(bot, message, next) {

    console.log('Receive middleware! ', message.type, 'for ', bot.identity.name);
    next();


});

// Example hears middleware.
// Look for {intent: 'name_of_intent'} and match the message.intent field
// instead of doing a regular expression match on the text
controller.middleware.hears.use(function(bot, message, triggers, next) {

    console.log('Hears middleware!');

    if (!message.heard) {
        for (var t = 0; t < triggers.length; t++) {
            var trigger = triggers[t];
            if (typeof(trigger.pattern) == 'object' && trigger.pattern.intent) {
                if (message.intent) {
                    if (message.intent === trigger.pattern.intent) {
                        message.heard = true;
                        trigger.callback.apply(controller, [bot, message]);
                        break;
                    }
                }
            }
        }
    }
    next();

});


// Example receive middleware.
// Looks for the phrase "hi" or "hello" and adds a message.intent field
controller.middleware.receive.use(function(bot, message, next) {

    console.log('Receive middleware!');

    if (message.text &&
        (message.text == 'hi' || message.text == 'hello')
    ) {
        message.intent = 'hi';
    }
    next();

});

// Example send middleware
// Looks for message.intent, and translates it into a real message
controller.middleware.send.use(function(bot, message, next) {

    console.log('Send middleware!');

    if (message.intent) {
        if (message.intent == 'hi') {
            message.text = 'OH HELLOOOOOOO';
        }
    }
    next();

});


//controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
controller.hears([{intent: 'hi'}], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, {intent: 'hi'});
        }
    });
});

controller.hears(['call me (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.reply(message, 'I don\'t know yet!');
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention',
    function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message, ':robot_face: I am a bot named <@' +
            bot.identity.name + '>. I have been running for ' +
            uptime + ' on ' + hostname + '.');

    }
);

// controller.on(['direct_message', 'direct_mention'], function(bot, message) {
//     if (!message.heard) {
//         bot.reply(message, ':robot_face:?');
//     }
// });

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
