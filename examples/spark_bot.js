/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Cisco Spark bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Cisco Spark's APIs
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://botkit.ai

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var Botkit = require('../lib/Botkit.js');

var controller = Botkit.sparkbot({
    debug: false,
    log: false,
    public_address: process.env.public_address,
    ciscospark_access_token: process.env.access_token,
    studio_token: process.env.studio_token, // get one from studio.botkit.ai to enable content management, stats, message console and more
    secret: process.env.secret, // this is an RECOMMENDED but optional setting that enables validation of incoming webhooks
    webhook_name: 'Cisco Spark bot created with Botkit, override me before going to production',
//    limit_to_domain: ['mycompany.com'],
//    limit_to_org: 'my_cisco_org_id',
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log("Cisco Spark: Webhooks set up!");
    });
});

controller.hears(['^markdown'], 'direct_message,direct_mention', function(bot, message) {

    bot.reply(message, {text: '*this is cool*', markdown: '*this is super cool*'});

});

controller.on('user_space_join', function(bot, message) {
    bot.reply(message, 'Welcome, ' + message.original_message.data.personDisplayName);
});

controller.on('user_space_leave', function(bot, message) {
    bot.reply(message, 'Bye, ' + message.original_message.data.personDisplayName);
});


controller.on('bot_space_join', function(bot, message) {

    bot.reply(message, 'This trusty bot is here to help.');

});


controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
    if (message.original_message.files) {
        bot.retrieveFileInfo(message.original_message.files[0], function(err, file) {
            bot.reply(message,'I also got an attached file called ' + file.filename);
        });
    }
});

if (process.env.studio_token) {
    controller.on('direct_message,direct_mention', function(bot, message) {
        controller.studio.runTrigger(bot, message.text, message.user, message.channel).then(function(convo) {
            if (!convo) {
                // console.log('NO STUDIO MATCH');
            } else {
              // found a conversation
            }
        }).catch(function(err) {
            console.error('Error with Botkit Studio: ', err);
        });
    });
}
