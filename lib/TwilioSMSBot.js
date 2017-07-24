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


        bot.send = function(message, cb) {

            var client = new twilio.RestClient(
                configuration.account_sid,
                configuration.auth_token
            );

            var sms = {
                body: message.text,
                from: configuration.twilio_number,
                to: message.channel
            };

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

        var message = {
            text: req.body.Body,
            from: req.body.From,
            to: req.body.To,
            user: req.body.From,
            channel: req.body.From,
            timestamp: Date.now(),
            sid: req.body.MessageSid,
            NumMedia: req.body.NumMedia,
            MediaUrl0: req.body.MediaUrl0,
            MediaUrl1: req.body.MediaUrl1,
            MediaUrl2: req.body.MediaUrl2,
            MediaUrl3: req.body.MediaUrl3,
            MediaUrl4: req.body.MediaUrl4,
            MediaUrl5: req.body.MediaUrl5,
            MediaUrl6: req.body.MediaUrl6,
            MediaUrl7: req.body.MediaUrl7,
            MediaUrl9: req.body.MediaUrl9,
            MediaUrl10: req.body.MediaUrl10,
        };

        twilioSMS.receiveMessage(bot, message);

    };

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

    twilioSMS.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a \'port\' parameter');
        }

        if (isNaN(port)) {
            throw new TypeError('Specified \'port\' parameter is not a valid number');
        }

        var static_dir = path.join(__dirname, '/public');

        var config = twilioSMS.config;

        if (config && config.webserver && config.webserver.static_dir) {
            static_dir = twilioSMS.config.webserver.static_dir;
        }

        twilioSMS.config.port = port;

        twilioSMS.webserver = express();
        twilioSMS.webserver.use(bodyParser.json());
        twilioSMS.webserver.use(bodyParser.urlencoded({extended: true}));
        twilioSMS.webserver.use(express.static(static_dir));

        twilioSMS.webserver.listen(twilioSMS.config.port, function() {

            twilioSMS.log('*> Listening on port ' + twilioSMS.config.port);
            twilioSMS.startTicking();
            if (cb) cb(null, twilioSMS.webserver);

        });

        return twilioSMS;
    };

    return twilioSMS;
}

module.exports = TwilioSMS;
