var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Slackbot(configuration) {

    // Create a core botkit bot
    var slack_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    slack_botkit.defineBot(function(botkit, config) {

        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {

            var facebook_message = {
                recipient: {},
                message: {}
            };

            if (typeof(message.channel) == 'string' && message.channel.match(/\+\d+\(\d\d\d\)\d\d\d\-\d\d\d\d/)) {
                facebook_message.recipient.phone_number = message.channel;
            } else {
                facebook_message.recipient.id = message.channel;
            }

            if (message.text) {
                facebook_message.message.text = message.text;
            }

            if (message.attachment) {
                facebook_message.message.attachment = message.attachment;
            }

            request.post('https://graph.facebook.com/me/messages?access_token=' + configuration.access_token,
                function(err, res, body) {
                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }
                    botkit.debug('WEBHOOK SUCCESS', body);
                    cb && cb(null, body);
                }).form(facebook_message);
        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user
                    ) {
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


    // set up a web route for receiving outgoing webhooks and/or slash commands
    slack_botkit.createWebhookEndpoints = function(webserver, bot) {

        slack_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://MY_HOST:' + slack_botkit.config.port + '/facebook/receive');
        webserver.post('/facebook/receive', function(req, res) {

            console.log('GOT A MESSAGE HOOK');
            var obj = req.body;
            if (obj.entry) {
                for (var e = 0; e < obj.entry.length; e++) {
                    for (var m = 0; m < obj.entry[e].messaging.length; m++) {
                        var facebook_message = obj.entry[e].messaging[m];
                        if (facebook_message.message) {

                            var message = {
                                text: facebook_message.message.text,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                                seq: facebook_message.message.seq,
                                mid: facebook_message.message.mid,
                            };

                            slack_botkit.receiveMessage(bot, message);
                        } else if (facebook_message.postback) {

                            var message = {
                                payload: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            slack_botkit.trigger('facebook_postback', [bot, message]);
                        } else if (facebook_message.optin) {

                            var message = {
                                optin: facebook_message.optin,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            slack_botkit.trigger('facebook_optin', [bot, message]);
                        } else if (facebook_message.delivery) {

                            var message = {
                                optin: facebook_message.delivery,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            slack_botkit.trigger('message_delivered', [bot, message]);

                        } else {
                            botkit.log('Got an unexpected message from Facebook: ', facebook_message);
                        }
                    }
                }
            }
            res.send('ok');
        });

        webserver.get('/facebook/receive', function(req, res) {
            console.log(req.query);
            if (req.query['hub.mode'] == 'subscribe') {
                if (req.query['hub.verify_token'] == configuration.verify_token) {
                    res.send(req.query['hub.challenge']);
                } else {
                    res.send('OK');
                }
            }
        });

        return slack_botkit;
    };

    slack_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        slack_botkit.config.port = port;

        slack_botkit.webserver = express();
        slack_botkit.webserver.use(bodyParser.json());
        slack_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        slack_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = slack_botkit.webserver.listen(
            slack_botkit.config.port,
            function() {
                slack_botkit.log('** Starting webserver on port ' +
                    slack_botkit.config.port);
                if (cb) { cb(null, slack_botkit.webserver); }
            });


        request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + configuration.access_token,
            function(err, res, body) {
                if (err) {
                    botkit.log('Could not subscribe to page messages');
                } else {
                    botkit.debug('Successfully subscribed to Facebook events:', body);
                    slack_botkit.startTicking();
                }
            });

        return slack_botkit;

    };

    return slack_botkit;
};

module.exports = Slackbot;
