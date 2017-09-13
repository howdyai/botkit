var path = require('path');
var os = require('os');
var Botkit = require('./CoreBot');
var express = require('express');
var bodyParser = require('body-parser');
var twilio = require('twilio');

function TwilioSMS(configuration) {

    var twilioSMS = Botkit(configuration || {});

    if (!configuration) {
        throw Error('Specify your \'account_sid\', \'auth_token\', and ' +
            '\'twilio_number\' as properties of the \'configuration\' object');
    }

    if (configuration && !configuration.account_sid) {
        throw Error('Specify an \'account_sid\' in your configuration object');
    }

    if (configuration && !configuration.auth_token) {
        throw Error('Specify an \'auth_token\'');
    }

    if (configuration && !configuration.twilio_number) {
        throw Error('Specify a \'twilio_number\'');
    }

    twilioSMS.defineBot(function(botkit, config) {

        var bot = {
            type: 'twiliosms',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(bot, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(bot, message, cb);
        };


        bot.send = function(sms, cb) {

            var client = new twilio.RestClient(
                configuration.account_sid,
                configuration.auth_token
            );


            client.messages.create(sms, function(err, message) {

                if (err) {
                    cb(err);
                } else {
                    cb(null, message);
                }

            });

        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof resp === 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;

            if (typeof cb === 'function') {
                bot.say(msg, cb);
            } else {
                bot.say(msg, function() {});
            }

        };

        bot.findConversation = function(message, cb) {

            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);

            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {

                    var convo = botkit.tasks[t].convos[c];
                    var matchesConvo = (
                        convo.source_message.channel === message.channel ||
                        convo.source_message.user === message.user
                    );

                    if (convo.isActive() && matchesConvo) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }

                }
            }

            cb();
        };

        return bot;
    });

    twilioSMS.handleWebhookPayload = function(req, res, bot) {

        twilioSMS.log('=> Got a message hook');

        var payload = req.body;
        twilioSMS.ingest(bot, payload, res);

    };

    twilioSMS.middleware.normalize.use(function(bot, message, next) {

        message.text = message.Body;
        message.user = message.From;
        message.channel = message.From;


        message.from = message.From;
        message.to = message.To;

        message.timestamp = Date.now();
        message.sid = message.MessageSid;

        next();

    });

    twilioSMS.middleware.format.use(function(bot, message, platform_message, next) {

        platform_message.body = message.text;
        platform_message.from = configuration.twilio_number;
        platform_message.to = message.channel;

        if (message.hasOwnProperty('mediaUrl')) {
            platform_message.mediaUrl = message.mediaUrl;
        }

        next();

    });



    // set up a web route for receiving outgoing webhooks
    twilioSMS.createWebhookEndpoints = function(webserver, bot, cb) {

        twilioSMS.log('** Serving webhook endpoints for Twilio Programmable SMS' +
            ' at: ' + os.hostname() + ':' + twilioSMS.config.port + '/sms/receive');

        var endpoint = twilioSMS.config.endpoint || '/sms/receive';

        webserver.post(endpoint, function(req, res) {
            twilioSMS.handleWebhookPayload(req, res, bot);

            // Send empty TwiML response to Twilio
            var twiml = new twilio.TwimlResponse();
            res.type('text/xml');
            res.send(twiml.toString());
        });

        if (cb) cb();

        return twilioSMS;
    };

    twilioSMS.startTicking();

    return twilioSMS;
}

module.exports = TwilioSMS;
