var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Facebookbot(configuration) {

    // Create a core botkit bot
    var facebook_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    facebook_botkit.defineBot(function(botkit, config) {

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

            if (message.quick_replies) {
                facebook_message.message.quick_replies = message.quick_replies;
            }

            //Add Access Token to outgoing request

            facebook_message.access_token = configuration.access_token;

            request({
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json",
                    },
                    body: facebook_message,
                    uri: 'https://graph.facebook.com/v2.6/me/messages'
                },
                function(err, res, body) {


                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    if (body.error) {
                        botkit.debug('API ERROR', body.error);
                        return cb && cb(body.error.message);
                    }

                    botkit.debug('WEBHOOK SUCCESS', body);
                    cb && cb(null, body);
                })
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

    facebook_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        facebook_botkit.log(
            '** Serving webhook endpoints for Messenger Platform at: ' +
            'http://MY_HOST:' + facebook_botkit.config.port + '/facebook/receive');
        webserver.post('/facebook/receive', function(req, res) {

            facebook_botkit.debug('GOT A MESSAGE HOOK');
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
                                attachments: facebook_message.message.attachments,
                                quick_reply: facebook_message.message.quick_reply
                            };

                            facebook_botkit.receiveMessage(bot, message);
                        } else if (facebook_message.postback) {

                            // trigger BOTH a facebook_postback event
                            // and a normal message received event.
                            // this allows developers to receive postbacks as part of a conversation.
                            var message = {
                                payload: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            facebook_botkit.trigger('facebook_postback', [bot, message]);

                            var message = {
                                text: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            facebook_botkit.receiveMessage(bot, message);

                        } else if (facebook_message.optin) {

                            var message = {
                                optin: facebook_message.optin,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            facebook_botkit.trigger('facebook_optin', [bot, message]);
                        } else if (facebook_message.delivery) {

                            var message = {
                                optin: facebook_message.delivery,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                            };

                            facebook_botkit.trigger('message_delivered', [bot, message]);

                        } else {
                            facebook_botkit.log('Got an unexpected message from Facebook: ', facebook_message);
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

        if (cb) {
            cb();
        }

        return facebook_botkit;
    };

    facebook_botkit.persistentMenu = function(cb) {

        var buttons = configuration.persistent_menu && configuration.persistent_menu.buttons;

        if (buttons) {
            request({
                uri: "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + configuration.access_token,
                json: true,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: {
                    "setting_type": "call_to_actions",
                    "thread_state": "existing_thread",
                    "call_to_actions": .map(function(button) {
                        return {
                            "type": "postback",
                            "title": button.title,
                            "payload": button.payload
                        }
                    }): []
                }
            }, function(err, res, body) {

                if (err) {
                    facebook_botkit.error(err);
                    cb(err);
                } else {
                    facebook_botkit.log(body.result);
                    cb();
                }

            });
        } else {
            return cb();
        }

    };

    facebook_botkit.greetingText = function(cb) {

        var greetingText = configuration.greeting && configuration.greeting.text;

        if (greetingText) {

            request({
                uri: "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + configuration.access_token,
                json: true,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: {
                    "setting_type": "greeting",
                    "greeting": {
                        "text": configuration.greeting.text
                    }
                }
            }, function(err, res, body) {

                if (err) {
                    facebook_botkit.error(err);
                    return cb(err);
                } else {
                    facebook_botkit.log(body.result);
                    return cb();
                }

            });

        } else {
            return cb();
        }

    };

    facebook_botkit.greetingPayload = function(cb) {

        var payload = configuration.greeting && configuration.greeting.payload;

        if (payload) {

            request({
                uri: "https://graph.facebook.com/v2.6/me/thread_settings?access_token=" + configuration.access_token,
                json: true,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: {
                    "setting_type": "call_to_actions",
                    "thread_state": "new_thread",
                    "call_to_actions": [{
                        "payload": payload
                    }]
                }
            }, function(err, res, body) {

                if (err) {
                    facebook_botkit.error(err);
                    return cb(err);
                } else {
                    facebook_botkit.log(body.result);
                    return cb && cb();
                }

            });
        } else {
            return cb()
        }

    };

    facebook_botkit.reactivateFacebook = function(cb) {

        request.post("https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + configuration.access_token,
            function(err, res, body) {

                if (err) {
                    facebook_botkit.error(err);
                    return cb && cb(err);
                } else {

                    var isSuccess = JSON.parse(body).success;

                    if (isSuccess) {

                        facebook_botkit.log("Successfully subscribed to Facebook events");

                        return cb && cb();

                    } else {
                        facebook_botkit.error("Could not subscribe to page messages.");
                        return cb("Could not subscribe to page messages.");
                    }

                }

            });

    };

    facebook_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        var static_dir = __dirname + '/public';

        if (facebook_botkit.config && facebook_botkit.config.webserver && facebook_botkit.config.webserver.static_dir)
            static_dir = facebook_botkit.config.webserver.static_dir;

        facebook_botkit.config.port = port;

        facebook_botkit.webserver = express();
        facebook_botkit.webserver.use(bodyParser.json());
        facebook_botkit.webserver.use(bodyParser.urlencoded({
            extended: true
        }));
        facebook_botkit.webserver.use(express.static(static_dir));

        var server = facebook_botkit.webserver.listen(
            facebook_botkit.config.port,
            function() {
                facebook_botkit.log('** Starting webserver on port ' +
                    facebook_botkit.config.port);
                if (cb) {
                    cb(null, facebook_botkit.webserver);
                }
            });


        facebook_botkit.reactivateFacebook();
        facebook_botkit.greetingText()
        facebook_botkit.greetingPayload();
        facebook_botkit.persistentMenu();
        facebook_botkit.startTicking();

        return facebook_botkit;

    };

    return facebook_botkit;
};

module.exports = Facebookbot;
