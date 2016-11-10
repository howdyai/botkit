/**
 * Created by pawan.venugopal on 10/31/16.
 */
'use strict'

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var http = require('http');


var controller = Botkit.glipbot({
    debug: false,
});

var bot = controller.spawn({
    host: process.env.HUBOT_GLIP_HOST || 'glip.com',
    port: 443,
    email: process.env.HUBOT_GLIP_EMAIL,
    password: process.env.HUBOT_GLIP_PASSWORD,
    identity: 'Botkit'
});

controller.setupWebserver(process.env.port || 3000, function(err, webserver){
    webserver.get('/', function (req ,res) {
        res.send(':)');
    });

    controller.createWebhookEndpoints(webserver, bot);
});


controller.on('slash_command', function(bot, message) {
    bot.reply(message, 'This is a public reply to the ' + message.text + ' slash command!');

});


// reply to a direct mention - @bot hello
controller.on('direct_mention',function(bot,message) {
    bot.reply(message, message.text);
});

// Usage: weather SanFrancisco, CA
controller.hears(["weather"],'message_received', function(bot, message){
    var txt = message.text;
    txt = txt.toLowerCase().replace('weather ','');
    var city = txt.split(',')[0].trim().replace(' ','_');
    var state = txt.split(',')[1].trim();
    var key = 'Add your own key';

    console.log(city + ', ' + state);
    var url = '/api/' + key + '/forecast/q/state/city.json'
    url = url.replace('state', state);
    url = url.replace('city', city);

    http.get({
        host: 'api.wunderground.com',
        path: url
    }, function(response){
        var body = '';
        response.on('data',function(d){
            body += d;
        })
        response.on('end', function(){
            var data = JSON.parse(body);
            console.log(data);
            var days = data.forecast.simpleforecast.forecastday;
             for( var i = 0; i<days.length; i++)
            {
                //console.log(days[i]);
                bot.reply(message, days[i].date.weekday +
                    ' high: ' + days[i].high.fahrenheit +
                    ' low: ' + days[i].low.fahrenheit +
                    ' condition: ' + days[i].conditions);
                bot.reply(message, days[i].icon_url);
             }
        })
    })
});

// Usage: uptime
controller.hears(['uptime'],'message_received',function(bot, message) {
    console.log('uptime in glipbot.js file');
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
controller.hears(['pizzatime'], 'message_received', function(bot,message) {
    var askFlavor = function(err, convo) {
        convo.ask('What flavor of pizza do you want?', function(response, convo) {
            convo.say('Awesome.');
            askSize(response, convo);
            convo.next();
        });
    };
    var askSize = function(response, convo) {
        convo.ask('What size do you want?', function(response, convo) {
            convo.say('Ok.')
            askWhereDeliver(response, convo);
            convo.next();
        });
    };
    var askWhereDeliver = function(response, convo) {
        convo.ask('So where do you want it delivered?', function(response, convo) {
            convo.say('Ok! Good bye.');
            convo.next();
        });
    };

    bot.startConversation(message, askFlavor);
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




