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
});

controller.configureSlackApp({
    clientId: '2151250279.61939261125',
    clientSecret: '4a80e469c74d387c6fa2285079f683d6',
    redirectUri: 'https://botkit.localtunnel.me/oauth',
    scopes: ['bot'],
});



controller.setupWebserver(4000,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

controller.on('create_bot',function(bot,config) {

    bot.startRTM(function(err) {


    });

});

//
// var bot = controller.spawn({
//     token: process.env.token,
//     howdy_token: process.env.howdy_token,
//     howdy_bot_id: process.env.howdy_bot_id
// }).startRTM();

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
    controller.triggerConversation(bot, message).then(function(convo) {
        console.log(convo.status);
    }).catch(function(err) {
        bot.reply(message, 'I experienced an error: ' + err);
    });
});


controller.before('run', function(convo, next) {

    // see if the user has already added a script name
    if (matches = convo.source_message.text.match(/run (.*)/)) {
        console.log(matches);
        convo.collectResponse('script',{text: matches[1]});
        convo.changeTopic('participants');
    }
    next();

}).before('run', function(convo, next) {

    // check to see if there are participants in the original message
    if (found_users) {

    }

});


controller.before('hello', function(convo, next) {

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
