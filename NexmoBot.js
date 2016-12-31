var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function NexmoBot(configuration) {

    var nexmo_botkit = Botkit(configuration || {});

    nexmo_botkit.defineBot(function (botkit, config) {

        var bot = {
            type: 'nexmo',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances
        };

        bot.startConversation = function (message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.findConversation = function (message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (botkit.tasks[t].convos[c].isActive() && botkit.tasks[t].convos[c].source_message.user == message.user) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }
            cb();
        };

        bot.send = function (message, cb) {

            botkit.debug('*** SEND NEXMO SMS', message);

            var nexmoMessage = JSON.stringify({
                api_key: configuration.api_key,
                api_secret: configuration.api_secret,
                to: message.user,
                from: configuration.bot_number,
                text: message.text
            });

            request({
                    uri: 'https://rest.nexmo.com/sms/json',
                    method: 'POST',
                    port: 443,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(nexmoMessage)
                    },
                    body: nexmoMessage
                },
                function (err, res, body) {

                    if (message['status'] === "0") {
                        botkit.debug('NEXMO WEBHOOK SUCCESS', body);
                        cb && cb(null, body);
                    }
                    else {
                        botkit.debug('NEXMO WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                });
        };

        bot.reply = function (src, resp, cb) {
            var message = {};
            message.text = resp;
            message.user = src.user;
            bot.say(message, cb);
        };

        return bot;
    });



    return nexmo_botkit;
};

module.exports = NexmoBot;
