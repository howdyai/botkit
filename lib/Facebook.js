var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');

function Facebookbot(configuration) {

    var api_host = configuration.api_host || 'graph.facebook.com';

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
                uri: 'https://' + api_host + '/v2.6/me/messages'
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
            var textLength;

            if (typeof(resp) == 'string') {
                textLength = resp.length;
            } else if (resp.text) {
                textLength = resp.text.length;
            } else {
                textLength = 80; //default attachement text length
            }

            var avgWPM = 85;
            var avgCPM = avgWPM * 7;

            var typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 5000);

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
                            page: facebook_message.recipient.id,
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
                            page: facebook_message.recipient.id,
                            timestamp: facebook_message.timestamp,
                            referral: facebook_message.postback.referral,
                        };

                        facebook_botkit.trigger('facebook_postback', [bot, message]);

                        if (facebook_botkit.config.receive_via_postback) {
                            var message = {
                                text: facebook_message.postback.payload,
                                user: facebook_message.sender.id,
                                channel: facebook_message.sender.id,
                                page: facebook_message.recipient.id,
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
                            page: facebook_message.recipient.id,
                            timestamp: facebook_message.timestamp,
                        };

                        facebook_botkit.trigger('facebook_optin', [bot, message]);
                    } else if (facebook_message.delivery) {

                        var message = {
                            delivery: facebook_message.delivery,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            page: facebook_message.recipient.id
                        };

                        facebook_botkit.trigger('message_delivered', [bot, message]);
                    } else if (facebook_message.read) {

                        var message = {
                            read: facebook_message.read,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            page: facebook_message.recipient.id,
                            timestamp: facebook_message.timestamp,
                        };

                        facebook_botkit.trigger('message_read', [bot, message]);
                    } else if (facebook_message.referral) {
                        var message = {
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            page: facebook_message.recipient.id,
                            timestamp: facebook_message.timestamp,
                            referral: facebook_message.referral,
                        };

                        facebook_botkit.trigger('facebook_referral', [bot, message]);
                    } else if (facebook_message.account_linking) {
                        var message = {
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            timestamp: facebook_message.timestamp,
                            account_linking: facebook_message.account_linking,
                        };

                        facebook_botkit.trigger('facebook_account_linking', [bot, message]);
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


        request.post('https://' + api_host + '/me/subscribed_apps?access_token=' + configuration.access_token,
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

    var messenger_profile_api = {
        greeting: function(payload) {
            var message = {
                'greeting': []
            };
            if (Array.isArray(payload)) {
                message.greeting = payload;
            } else {
                message.greeting.push({
                    'locale': 'default',
                    'text': payload
                });
            }
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_greeting: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('greeting');
        },
        get_greeting: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('greeting', cb);
        },
        get_started: function(payload) {
            var message = {
                'get_started': {
                    'payload': payload
                }
            };
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_get_started: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('get_started');
        },
        get_get_started: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('get_started', cb);
        },
        menu: function(payload) {
            var messege = {
                persistent_menu: payload
            };
            facebook_botkit.api.messenger_profile.postAPI(messege);
        },
        delete_menu: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('persistent_menu');
        },
        get_menu: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('persistent_menu', cb);
        },
        account_linking: function(payload) {
            var message = {
                'account_linking_url': payload
            };
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_account_linking: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('account_linking_url');
        },
        get_account_linking: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('account_linking_url', cb);
        },
        domain_whitelist: function(payload) {
            var message = {
                'whitelisted_domains': Array.isArray(payload) ? payload : [payload]
            };
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_domain_whitelist: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('whitelisted_domains');
        },
        get_domain_whitelist: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('whitelisted_domains', cb);
        },
        target_audience: function(payload) {
            var message = {
                'target_audience': payload
            };
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_target_audience: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('target_audience');
        },
        get_target_audience: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('target_audience', cb);
        },
        home_url: function(payload) {
            var message = {
                home_url: payload
            };
            facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_home_url: function() {
            facebook_botkit.api.messenger_profile.deleteAPI('home_url');
        },
        get_home_url: function(cb) {
            facebook_botkit.api.messenger_profile.getAPI('home_url', cb);
        },
        postAPI: function(message) {
            request.post('https://' + api_host + '/v2.6/me/messenger_profile?access_token=' + configuration.access_token,
                {form: message},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not configure messenger profile');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in messenger profile API call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in messenger profile API call: ', results.error.message);
                            } else {
                                facebook_botkit.debug('Successfully configured messenger profile', body);
                            }
                        }
                    }
                });
        },
        deleteAPI: function(type) {
            var message = {
                'fields': [type]
            };
            request.delete('https://' + api_host + '/v2.6/me/messenger_profile?access_token=' + configuration.access_token,
                {form: message},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not configure messenger profile');
                    } else {
                        facebook_botkit.debug('Successfully configured messenger profile', message);
                    }
                });
        },
        getAPI: function(fields, cb) {
            request.get('https://' + api_host + '/v2.6/me/messenger_profile?fields=' + fields + '&access_token=' + configuration.access_token,
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not get messenger profile');
                        cb(err);
                    } else {
                        facebook_botkit.debug('Successfully got messenger profile ', body);
                        cb(null, body);
                    }
                });
        },
        get_messenger_code: function(image_size, cb, ref) {
            var message = {
                'type': 'standard',
                'image_size': image_size || 1000
            };

            if (ref) {
                message.data = {'ref': ref};
            }

            request.post('https://' + api_host + '/v2.6/me/messenger_codes?access_token=' + configuration.access_token,

                {form: message},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not configure get messenger code');
                        cb(err);
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in messenger code API call: Could not parse JSON', err, body);
                            cb(err);
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in messenger code API call: ', results.error.message);
                                cb(results.error);
                            } else {
                                var uri = results.uri;
                                facebook_botkit.log('Successfully got messenger code', uri);
                                cb(null, uri);
                            }
                        }
                    }
                });
        }
    };

    facebook_botkit.api = {
        'messenger_profile': messenger_profile_api,
        'thread_settings': messenger_profile_api
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
