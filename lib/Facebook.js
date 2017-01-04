var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');

function Facebookbot(configuration) {

    // Create a core botkit bot
    var facebook_botkit = Botkit(configuration || {});

    if (facebook_botkit.config.require_delivery) {

        facebook_botkit.on('message_delivered', function(bot, message) {

            // get list of mids in this message
            for (var m = 0; m < message.delivery.mids.length; m++) {
                var mid = message.delivery.mids[m];

                // loop through all active conversations this bot is having
                // and mark messages in conversations as delivered = true
                bot.findConversation(message, function(convo) {
                    if (convo) {
                        for (var s = 0; s < convo.sent.length; s++) {
                            if (convo.sent[s].sent_timestamp <= message.delivery.watermark ||
                                (convo.sent[s].api_response && convo.sent[s].api_response.mid == mid)) {
                                convo.sent[s].delivered = true;
                            }
                        }
                    }
                });
            }

        });

    }




    // customize the bot definition, which will be used when new connections
    // spawn!
    facebook_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'fb',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(this, message, cb);
        };


        bot.send = function(message, cb) {

            var facebook_message = {
                recipient: {},
                message: message.sender_action ? undefined : {}
            };

            if (typeof(message.channel) == 'string' && message.channel.match(/\+\d+\(\d\d\d\)\d\d\d\-\d\d\d\d/)) {
                facebook_message.recipient.phone_number = message.channel;
            } else {
                facebook_message.recipient.id = message.channel;
            }

            if (!message.sender_action) {
                if (message.text) {
                    facebook_message.message.text = message.text;
                }

                if (message.attachment) {
                    facebook_message.message.attachment = message.attachment;
                }

                if (message.sticker_id) {
                    facebook_message.message.sticker_id = message.sticker_id;
                }

                if (message.quick_replies) {

                    // sanitize the length of the title to maximum of 20 chars
                    var titleLimit = function(title) {
                        if (title.length > 20) {
                            var newTitle = title.substring(0, 16) + '...';
                            return newTitle;
                        } else {
                            return title;
                        }
                    };

                    facebook_message.message.quick_replies = message.quick_replies.map(function(item) {
                        var quick_reply = {};
                        if (item.content_type === 'text' || !item.content_type) {
                            quick_reply = {
                                content_type: 'text',
                                title: titleLimit(item.title),
                                payload: item.payload,
                                image_url: item.image_url,
                            };
                        } else if (item.content_type === 'location') {
                            quick_reply = {
                                content_type: 'location'
                            };
                        } else {
                            // Future quick replies types
                        }
                        return quick_reply;
                    });
                }
            } else {
                facebook_message.sender_action = message.sender_action;
            }

            if (message.sender_action) {
                facebook_message.sender_action = message.sender_action;
            }

            if (message.notification_type) {
                facebook_message.notification_type = message.notification_type;
            }

            //Add Access Token to outgoing request
            facebook_message.access_token = configuration.access_token;

            request({
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
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
                });
        };

        bot.startTyping = function(src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_on';
            bot.say(msg, cb);
        };

        bot.stopTyping = function(src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_off';
            bot.say(msg, cb);
        };

        bot.replyWithTyping = function(src, resp, cb) {
            var text;

            if (typeof(resp) == 'string') {
                text = resp;
            } else {
                text = resp.text;
            }

            var avgWPM = 85;
            var avgCPM = avgWPM * 7;

            var typingLength = Math.min(Math.floor(text.length / (avgCPM / 60)) * 1000, 5000);

            bot.startTyping(src, function(err) {
                if (err) console.log(err);
                setTimeout(function() {
                    bot.reply(src, resp, cb);
                }, typingLength);
            });

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
            'http://' + facebook_botkit.config.hostname + ':' + facebook_botkit.config.port + '/facebook/receive');
        webserver.post('/facebook/receive', function(req, res) {
            res.send('ok');
            facebook_botkit.handleWebhookPayload(req, res, bot);
        });

        webserver.get('/facebook/receive', function(req, res) {
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

    facebook_botkit.handleWebhookPayload = function(req, res, bot) {

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
                            is_echo: facebook_message.message.is_echo,
                            mid: facebook_message.message.mid,
                            sticker_id: facebook_message.message.sticker_id,
                            attachments: facebook_message.message.attachments,
                            quick_reply: facebook_message.message.quick_reply,
                            type: 'user_message',
                        };

                        facebook_botkit.receiveMessage(bot, message);
                    } else if (facebook_message.postback) {

                        // trigger BOTH a facebook_postback event
                        // and a normal message received event.
                        // this allows developers to receive postbacks as part of a conversation.
                        var message = {
                            text: facebook_message.postback.payload,
                            payload: facebook_message.postback.payload,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            timestamp: facebook_message.timestamp,
                            referral: facebook_message.postback.referral,
                        };

                        facebook_botkit.trigger('facebook_postback', [bot, message]);

                        if (facebook_botkit.config.receive_via_postback) {
                            var message = {
                                text: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                timestamp: facebook_message.timestamp,
                                type: 'facebook_postback',
                                referral: facebook_message.postback.referral,
                            };

                            facebook_botkit.receiveMessage(bot, message);
                        }

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
                            delivery: facebook_message.delivery,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                        };

                        facebook_botkit.trigger('message_delivered', [bot, message]);
                    } else if (facebook_message.read) {

                        var message = {
                            read: facebook_message.read,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            timestamp: facebook_message.timestamp,
                        };

                        facebook_botkit.trigger('message_read', [bot, message]);
                    } else if (facebook_message.referral) {
                        var message = {
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            timestamp: facebook_message.timestamp,
                            referral: facebook_message.referral,
                        };

                        facebook_botkit.trigger('facebook_referral', [bot, message]);
                    }  else {
                        facebook_botkit.log('Got an unexpected message from Facebook: ', facebook_message);
                    }
                }
            }
        }
    };

    facebook_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }

        var static_dir =  process.cwd() + '/public';

        if (facebook_botkit.config && facebook_botkit.config.webserver && facebook_botkit.config.webserver.static_dir)
            static_dir = facebook_botkit.config.webserver.static_dir;

        facebook_botkit.config.port = port;

        facebook_botkit.webserver = express();

        // Validate that requests come from facebook, and abort on validation errors
        if (facebook_botkit.config.validate_requests === true) {
            // Load verify middleware just for post route on our receive webhook, and catch any errors it might throw to prevent the request from being parsed further.
            facebook_botkit.webserver.post('/facebook/receive', bodyParser.json({verify: verifyRequest}));
            facebook_botkit.webserver.use(abortOnValidationError);
        }

        facebook_botkit.webserver.use(bodyParser.json());
        facebook_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        facebook_botkit.webserver.use(express.static(static_dir));

        var server = facebook_botkit.webserver.listen(
            facebook_botkit.config.port,
            facebook_botkit.config.hostname,
            function() {
                facebook_botkit.log('** Starting webserver on port ' +
                    facebook_botkit.config.port);
                if (cb) { cb(null, facebook_botkit.webserver); }
            });


        request.post('https://graph.facebook.com/me/subscribed_apps?access_token=' + configuration.access_token,
            function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not subscribe to page messages');
                } else {
                    facebook_botkit.debug('Successfully subscribed to Facebook events:', body);
                    facebook_botkit.startTicking();
                }
            });

        return facebook_botkit;

    };

    facebook_botkit.api = {
        'thread_settings': {
            greeting: function(greeting) {
                var message = {
                    'setting_type': 'greeting',
                    'greeting': {
                        'text': greeting
                    }
                };
                facebook_botkit.api.thread_settings.postAPI(message);
            },
            delete_greeting: function() {
                var message = {
                    'setting_type': 'greeting',
                };
                facebook_botkit.api.thread_settings.deleteAPI(message);
            },
            get_started: function(payload) {
                var message = {
                    'setting_type': 'call_to_actions',
                    'thread_state': 'new_thread',
                    'call_to_actions':
                        [
                            {
                                'payload': payload
                            }
                        ]
                };
                facebook_botkit.api.thread_settings.postAPI(message);
            },
            delete_get_started: function() {
                var message = {
                    'setting_type': 'call_to_actions',
                    'thread_state': 'new_thread',
                };
                facebook_botkit.api.thread_settings.deleteAPI(message);
            },
            menu: function(payload) {
                var message = {
                    'setting_type': 'call_to_actions',
                    'thread_state': 'existing_thread',
                    'call_to_actions': payload
                };
                facebook_botkit.api.thread_settings.postAPI(message);
            },
            delete_menu: function() {
                var message = {
                    'setting_type': 'call_to_actions',
                    'thread_state': 'existing_thread',
                };
                facebook_botkit.api.thread_settings.deleteAPI(message);
            },
            postAPI: function(message) {
                request.post('https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + configuration.access_token,
                    {form: message},
                    function(err, res, body) {
                        if (err) {
                            facebook_botkit.log('Could not configure thread settings');
                        } else {

                            var results = null;
                            try {
                                results = JSON.parse(body);
                            } catch (err) {
                                facebook_botkit.log('ERROR in thread_settings API call: Could not parse JSON', err, body);
                            }

                            if (results) {
                                if (results.error) {
                                    facebook_botkit.log('ERROR in thread_settings API call: ', results.error.message);
                                } else {
                                    facebook_botkit.debug('Successfully configured thread settings', body);
                                }
                            }

                        }
                    });
            },
            deleteAPI: function(message) {
                request.delete('https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + configuration.access_token,
                    {form: message},
                    function(err, res, body) {
                        if (err) {
                            facebook_botkit.log('Could not configure thread settings');
                        } else {
                            facebook_botkit.debug('Successfully configured thread settings', message);
                        }
                    });
            }
        }
    };

    // Verifies the SHA1 signature of the raw request payload before bodyParser parses it
    // Will abort parsing if signature is invalid, and pass a generic error to response
    function verifyRequest(req, res, buf, encoding) {
        var expected = req.headers['x-hub-signature'];
        var calculated = getSignature(buf);
        if (expected !== calculated) {
            throw new Error('Invalid signature on incoming request');
        } else {
            // facebook_botkit.debug('** X-Hub Verification successful!')
        }
    }

    function getSignature(buf) {
        var hmac = crypto.createHmac('sha1', facebook_botkit.config.app_secret);
        hmac.update(buf, 'utf-8');
        return 'sha1=' + hmac.digest('hex');
    }

    function abortOnValidationError(err, req, res, next) {
        if (err) {
            facebook_botkit.log('** Invalid X-HUB signature on incoming request!');
            facebook_botkit.debug('** X-HUB Validation Error:', err);
            res.status(400).send({
                error: 'Invalid signature.'
            });
        } else {
            next();
        }
    }

    return facebook_botkit;
};

module.exports = Facebookbot;
