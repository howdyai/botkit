var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

// TODO
// In order to change Botkit to support multiple Facebook pages:
// - Change the access_token config key passed to BotKit.facebookbot() to be an object pairing the
// page id and the corresponding access_token.
// - Change anywhere access_token is used to check if it's a string or the aforementioned object
// type.
// - Change the Conversation object in CoreBot.js to create messages that include the page id
// - In Facebook.js change the send method to lookup the right access_token by the page id in the
// message.
// - In the Facebook /facebook/receive webhook include the page id in the message structure created.
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
            var access_token = facebook_botkit.getAccessTokenFromMessage(message);

            botkit.debug('SEND MESSAGE', message);
            botkit.debug('ACCESS_TOKEN', access_token);

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

            request.post('https://graph.facebook.com/me/messages?access_token=' + access_token,
                function(err, res, body) {
                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    try {

                        var json = JSON.parse(body);

                    } catch (err) {

                        botkit.debug('JSON Parse error: ', err);
                        return cb && cb(err);

                    }

                    if (json.error) {
                        botkit.debug('API ERROR', json.error);
                        return cb && cb(json.error.message);
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

    facebook_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        facebook_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://MY_HOST:' + facebook_botkit.config.port + '/facebook/receive');
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
                                page_id: facebook_message.recipient.id,
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
                                page_id: facebook_message.recipient.id,
                            };

                            facebook_botkit.trigger('facebook_postback', [bot, message]);

                            var message = {
                                text: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                                page_id: facebook_message.recipient.id,
                            };

                            facebook_botkit.receiveMessage(bot, message);

                        } else if (facebook_message.optin) {

                            var message = {
                                optin: facebook_message.optin,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                                page_id: facebook_message.recipient.id,
                            };

                            facebook_botkit.trigger('facebook_optin', [bot, message]);
                        } else if (facebook_message.delivery) {

                            var message = {
                                optin: facebook_message.delivery,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                                page_id: facebook_message.recipient.id,
                            };

                            facebook_botkit.trigger('message_delivered', [bot, message]);

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

        if (cb) {
            cb();
        }

        return facebook_botkit;
    };

    facebook_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        var static_dir =  __dirname + '/public';

        if (facebook_botkit.config && facebook_botkit.config.webserver && facebook_botkit.config.webserver.static_dir)
            static_dir = facebook_botkit.config.webserver.static_dir;

        facebook_botkit.config.port = port;

        facebook_botkit.webserver = express();
        facebook_botkit.webserver.use(bodyParser.json());
        facebook_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        facebook_botkit.webserver.use(express.static(static_dir));

        var server = facebook_botkit.webserver.listen(
            facebook_botkit.config.port,
            function() {
                facebook_botkit.log('** Starting webserver on port ' +
                    facebook_botkit.config.port);
                if (cb) { cb(null, facebook_botkit.webserver); }
            });

        for (var page_id of Object.keys(configuration.access_tokens)) {
            request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + configuration.access_tokens[page_id],
              function (err, res, body) {
                  if (err) {
                      facebook_botkit.log('Could not subscribe to page messages');
                  } else {
                      facebook_botkit.debug('Successfully subscribed to Facebook events:', body);
                      facebook_botkit.startTicking();
                  }
              });
        }

        return facebook_botkit;

    };

    facebook_botkit.getAccessTokenFromMessage = function(message) {
        if (typeof configuration.access_tokens == 'object') {
            if (message.page_id) {
                for (var page_id of Object.keys(configuration.access_tokens)) {
                    if (page_id == message.page_id) {
                        return configuration.access_tokens[page_id];
                    }
                }
            }
        } else {
            return configuration.access_tokens;
        }
    }

    return facebook_botkit;
};

module.exports = Facebookbot;
