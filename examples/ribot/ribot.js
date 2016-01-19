"use strict";

var BotLoader = require('./BotLoader.js');


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('../../lib/Botkit.js');
var os = require('os');


var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

// reload the scripts without restart
controller.hears(['reload', '.r'],'ambient',function(bot, message) {
    BotLoader.reload();
    bot.reply(message, 'reloaded');
});

// send everything to the ribot
controller.hears(['.*'],'ambient',function(bot, message) {
    let reply = BotLoader.brain.reply(message.username, message.text)
    console.log("user>", message.text);
    console.log("bot >", reply);
    console.log("--");
    bot.reply(message, reply);
});


controller.hears(['.*'],['direct_message','direct_mention'],function(bot,message) {
    bot.startConversation(message,function(err,convo) {
        let reply = BotLoader.brain.reply(message.username, message.text)
        console.log("user dm>", message.text);
        console.log("bot >", reply);
        console.log("--");
        bot.reply(message, reply);
    });

    bot.startPrivateConversation(message,function(err,dm) {
        let reply = BotLoader.brain.reply(message.username, message.text)
        console.log("user>", message.text);
        console.log("bot >", reply);
        console.log("--");
        //   bot.reply(message, reply);
        dm.say('Private reply!');
    });

});
