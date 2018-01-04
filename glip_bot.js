/**
 * Created by pawan.venugopal on 10/31/16.
 */

"use strict";

require('dotenv').config();

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var http = require('http');
var request = require('request');
var fs = require('fs');
var accessToken = "";
var platform = null;


if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
    console.log('Error: Specify clientId clientSecret and port in environment');
    process.exit(1);
}

var controller = Botkit.glipbot({
    debug: true
}).configureGlipApp({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: process.env.redirectUri,
    apiRoot: process.env.apiRoot
    // accessToken: '',
    // subscriptionId: ''
});

readAccessToken()

function readAccessToken(){
  try {
    fs.accessSync('token.dat');
    accessToken = fs.readFileSync('token.dat', 'utf8');
  }catch (e) {
    accessToken = ""
  }
}

function storeAccessToken(accessToken){
  fs.writeFile('token.dat', accessToken, function(err) {
    if(err)
      console.log(err)
  })
}

var bot = controller.spawn({});

controller.setupWebserver(process.env.port || 3000, function(err, webserver){
    controller.createWebhookEndpoints(webserver, bot,  function () {
        console.log("Online");
    });

    controller.createOauthEndpoints(webserver, bot, accessToken, function(err, req, res, token) {
        if(err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            platform = controller.getRCPlatform();
            storeAccessToken(token);
            //res.send('Success!');
        }
    })

});

// Usage: uptime
controller.hears(['uptime'],'message_received',function(bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());
    bot.reply(message,'I am a bot! I have been running for ' + uptime + ' on ' + hostname + '.');
    //console.log('Access Token =' + controller.configureGlipApp().accessToken);
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
