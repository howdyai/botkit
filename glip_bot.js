/**
 * Created by pawan.venugopal on 10/31/16.
 */

"use strict";

require('dotenv').config();

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var http = require('http');
var request = require('request');


var controller = Botkit.glipbot({
    debug: false,
});

var bot = controller.spawn({
    server: process.env.GLIP_SERVER,
    appKey: process.env.GLIP_APPKEY,
    appSecret: process.env.GLIP_APPSECRET,
    appName: 'GlipDemo',
    appVersion: '1.0.0',
    username: process.env.GLIP_USERNAME,
    password: process.env.GLIP_PASSWORD,
    extension: process.env.GLIP_EXTENSION,
    port: process.env.GLIP_PORT,
}).startRTM();

controller.setupWebserver(process.env.port || 3000, function(err, webserver){
    webserver.get('/', function (req ,res) {
        res.send(':)');
    });

    controller.createWebhookEndpoints(webserver, bot);

});


// Usage: uptime
controller.hears(['uptime'],'message_received',function(bot, message) {
    console.log(message);
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message,'I am a bot! I have been running for ' + uptime + ' on ' + hostname + '.');
});

// Usage: question me
controller.hears(['question me'], 'message_received', function(bot,message) {

    // start a conversation to handle this response.
    bot.startConversation(message,function(err,convo) {

        convo.ask('Shall we proceed Say YES, NO or DONE to quit.',[
            {
                pattern: 'done',
                callback: function(response,convo) {
                    convo.say('OK you are done!');
                    convo.next();
                }
            },
            {
                pattern: bot.utterances.yes,
                callback: function(response,convo) {
                    convo.say('Great! I will continue...');
                    // do something else...
                    convo.next();

                }
            },
            {
                pattern: bot.utterances.no,
                callback: function(response,convo) {
                    convo.say('Perhaps later.');
                    // do something else...
                    convo.next();
                }
            },
            {
                default: true,
                callback: function(response,convo) {
                    // just repeat the question
                    convo.repeat();
                    convo.next();
                }
            }
        ]);

    })

});

//usage: pizzatime
controller.hears(['pizzatime'],'message_received',function(bot,message) {
    bot.startConversation(message, askFlavor);
});

var askFlavor = function(response, convo) {
    convo.ask("What flavor of pizza do you want?", function(response, convo) {
        convo.say("Awesome.");
        askSize(response, convo);
        convo.next();
    });
}
var askSize = function(response, convo) {
    convo.ask("What size do you want?", function(response, convo) {
        convo.say("Ok.")
        askWhereDeliver(response, convo);
        convo.next();
    });
}
var askWhereDeliver = function(response, convo) {
    convo.ask("So where do you want it delivered?", function(response, convo) {
        var message = null;
        message = "Ordered large pizza by pawan\n\n"
        message += "[Ticket ##1001](www.dominos.com) - ordered large pizza\n\n"
        message += "**Description**\n\n"
        message += "Ordered large cheese pizza & should delivered at home\n\n"
        message += "**Priority**\n\n"
        message += "asap\n"
        convo.say(message);
        convo.next();
    });
}

controller.hears(['hi','hello'], 'message_received', function (bot, message) {
    bot.reply(message, "hi, you can ask me questions.");
});


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




