var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

var NEXMO_PORT = 443;

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
                    port: NEXMO_PORT,
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

            if (typeof(resp) == 'string') {
                message.text = resp;
            } else {
                message.text = resp.text;
            }

            message.user = src.user;

            bot.say(message, cb);
        };

        return bot;
    });

    nexmo_botkit.setupWebserver = function (port, cb) {
        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }

        var static_dir = process.cwd() + '/public';

        nexmo_botkit.config.port = port;

        nexmo_botkit.webserver = express();
        nexmo_botkit.webserver.use(bodyParser.json());
        nexmo_botkit.webserver.use(bodyParser.urlencoded({extended: true}));
        nexmo_botkit.webserver.use(express.static(static_dir));

        nexmo_botkit.webserver.listen(nexmo_botkit.config.port, nexmo_botkit.config.hostname, function () {
            nexmo_botkit.log('** Starting webserver on port ' + nexmo_botkit.config.port);
            if (cb) {
                cb(null, nexmo_botkit.webserver);
            }
        });

        return nexmo_botkit;
    };

    nexmo_botkit.createWebhookEndpoints = function (webserver, bot, cb) {

        var url = 'http://' + nexmo_botkit.config.hostname + ':' + nexmo_botkit.config.port + '/nexmo/receive';
        nexmo_botkit.log('** Serving webhook endpoints for Nexmo at: ' + url);

        webserver.get('/nexmo/receive', function (req, res) {
            if (req.query['messageId']) {
                nexmo_botkit.handleWebhookPayload(req.query, res, bot);
            } else {
                nexmo_botkit.logger.log('*** verifying Callback URL from Nexmo dashboard');
            }
            res.sendStatus(200);
        });

        if (cb) {
            cb();
        }

        nexmo_botkit.startTicking();

        return nexmo_botkit;
    };

    nexmo_botkit.handleWebhookPayload = function (params, res, bot) {
        var message = {
            user: params['msisdn'],
            channel: params['msisdn'],
            to: params['to'],
            messageId: params['messageId'],
            text: params['text'],
            type: params['type'],
            keyword: params['keyword'],
            messageTimestamp: params['message-timestamp']
        };
        nexmo_botkit.receiveMessage(bot, message);
    };

    return nexmo_botkit;
};

module.exports = NexmoBot;
