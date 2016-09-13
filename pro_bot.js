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

    token=<MY TOKEN> node slack_bot.js

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

  Botkit has many features for building cool and useful bots!

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
    howdy_token: process.env.howdy_token,
    json_file_store: './db'
});

// controller.configureSlackApp({
//     clientId: '2151250279.61939261125',
//     clientSecret: '4a80e469c74d387c6fa2285079f683d6',
//     redirectUri: 'https://botkit.localtunnel.me/oauth',
//     scopes: ['bot'],
// });
//
//
//
// controller.setupWebserver(4000,function(err,webserver) {
//   controller.createWebhookEndpoints(controller.webserver);
//
//   controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
//     if (err) {
//       res.status(500).send('ERROR: ' + err);
//     } else {
//       res.send('Success!');
//     }
//   });
// });
//
// controller.on('create_bot',function(bot,config) {
//
//     bot.startRTM(function(err) {
//
//
//     });
//
// });

//
var bot = controller.spawn({
    token: process.env.token,
    howdy_token: process.env.howdy_token,
    howdy_bot_id: process.env.howdy_bot_id
}).startRTM();





function getListOfEntitiesInMessage(bot, message, cb) {
        var list = [];
        var text = message.text;

        function uniq(a) {
            var seen = {};
            return a.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        }


        while (matches = text.match(/\<(.*?)\>/i)) {
            user = matches[1];
            text = text.replace(new RegExp('\<' + user + '\>'), '');
            text = text.replace(/\s*$/, '');
            // sometimes it includes a printable name...
            user = user.split('|')[0];
            list.push(user);
        }

        while (matches = text.match(/\b(me|myself)\b/i)) {
            user = matches[1].toLowerCase();
            text = text.replace(new RegExp('\\b' + user + '\\b','i'),'');
            text = text.replace(/\s*$/, '');
            list.push(user);
        }


        // find !channel or !group and translate them into message.channel
        for (var i = 0; i < list.length; i++) {
            if (list[i] == '!channel' || list[i] == '!group') {
                list[i] = '#' + message.channel;
            } else if (list[i] == 'me' || list[i] == 'myself') {
                list[i] = '@' + message.user;
            }
        }

        cb(uniq(list));
    };




controller.on('interactive_message_callback', function(bot, trigger) {

    if (trigger.actions[0].name.match(/^action\:/)) {
        controller.trigger(trigger.actions[0].name, [bot, trigger]);
    } else if (trigger.actions[0].name.match(/^say\:/)) {
        var message = {
            user: trigger.user,
            channel: trigger.channel,
            text: trigger.actions[0].value,
            type: 'message',
        };

        var reply = trigger.original_message;

        reply.attachments = [
            {
                text: 'You said, ' + message.text,
            }
        ];

        bot.replyInteractive(trigger, reply)

        controller.receiveMessage(bot, message);
    } else {
        console.log('GOT BUTTON CLICK', trigger);
    }

});


controller.on('direct_message,direct_mention,mention', function(bot, message) {
    controller.studio.runTrigger(bot, message).then(function(convo) {
        console.log(convo.status);
    }).catch(function(err) {
        bot.reply(message, 'I experienced an error: ' + err);
    });
});


controller.studio.before('run', function(convo, next) {

    controller.getScripts(convo.task.bot).then(function(commands) {

        convo.setVar('scripts',commands);

        next();

    }).catch(function(err) {

        convo.changeTopic('error_loading_scripts');
        next();

    });

}).validate('run', function(convo, next) {

    console.log('Validate script selection');
    var responses = convo.extractResponses();

    if (responses.script) {
        // validate this script
        var found = false;
        var matches = [];
        for (var s = 0; s < convo.vars.scripts.length; s++) {
            if (responses.script == convo.vars.scripts[s].command) {
                found = true;
            } else if (convo.vars.scripts[s].command.match(new RegExp(responses.script,'i'))) {
                matches.push(convo.vars.scripts[s]);
            }
        }


        if (!found) {
            if (matches.length) {
                convo.setVar('possible_matches',matches);
                convo.changeTopic('choose_script');
            } else {
                convo.changeTopic('bad_script');
            }
            return next();
        }
    } else {
        console.log('no script set yet');
    }

    next();

}).validate('run', function(convo, next) {

    console.log('Validating participants');
    var responses = convo.extractResponses();
    if (responses.participants) {

        getListOfEntitiesInMessage(convo.task.bot, {
            text: responses.participants,
            user: convo.source_message.user,
            channel: convo.source_message.channel,
        }, function(list) {

            console.log('GOT A LIST OF ENTITIES', list);

            if (!list || !list.length) {

                convo.changeTopic('bad_participants');
                return next();

            } else {
                next();
            }

        });

    } else {
        next();
    }

}).before('run', function(convo, next) {

    next();

});


controller.studio.before('hello', function(convo, next) {

    console.log('RUNNING BEFORE HOOK!');
    convo.setVar('hook', 'FOO!!!');
    next();

}).before('hello', function(convo, next) {

    console.log('RUNNING BEFORE HOOK!');
    convo.setVar('hook2', 'BAR!!!');
    convo.setVar('list', [{name: 'foo'},{name:'bar'}]);

    next();

}).after('hello', function(convo, next) {

    console.log('run after hook');
    console.log(convo.extractResponses());
    next();

});


//
// controller.storage.teams.all(function(err,teams) {
//
//   if (err) {
//     throw new Error(err);
//   }
//
//   // connect all teams with bots up to slack!
//   for (var t  in teams) {
//     if (teams[t].bot) {
//       controller.spawn(teams[t]).startRTM(function(err, bot) {
//         if (err) {
//           console.log('Error connecting bot to Slack:',err);
//         }
//       });
//     }
//   }
//
// });
