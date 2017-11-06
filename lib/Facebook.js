var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var crypto = require('crypto');
var bodyParser = require('body-parser');

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

    // For backwards-compatability, support the receive_via_postback config option
    // this causes facebook_postback events to be replicated as message_received events
    // allowing them to be heard without subscribing to additional events
    if (facebook_botkit.config.receive_via_postback) {
        facebook_botkit.on('facebook_postback', function(bot, message) {
            facebook_botkit.trigger('message_received', [bot, message]);
        });
    }


    facebook_botkit.middleware.format.use(function(bot, message, platform_message, next) {

        platform_message.recipient = {};
        platform_message.message =  message.sender_action ? undefined : {};

        if (typeof(message.channel) == 'string' && message.channel.match(/\+\d+\(\d\d\d\)\d\d\d\-\d\d\d\d/)) {
            platform_message.recipient.phone_number = message.channel;
        } else {
            platform_message.recipient.id = message.channel;
        }

        if (!message.sender_action) {
            if (message.text) {
                platform_message.message.text = message.text;
            }

            if (message.attachment) {
                platform_message.message.attachment = message.attachment;
            }

            if (message.tag) {
                platform_message.message.tag = message.tag;
            }

            if (message.sticker_id) {
                platform_message.message.sticker_id = message.sticker_id;
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

                platform_message.message.quick_replies = message.quick_replies.map(function(item) {
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
            platform_message.sender_action = message.sender_action;
        }

        if (message.sender_action) {
            platform_message.sender_action = message.sender_action;
        }

        if (message.notification_type) {
            platform_message.notification_type = message.notification_type;
        }

        next();

    });

    // customize the bot definition, which will be used when new connections
    // spawn!
    facebook_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'fb',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.send = function(message, cb) {


            //Add Access Token to outgoing request
            message.access_token = configuration.access_token;

            request({
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: message,
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
            msg.to = src.user;

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

        // return info about the specific instance of this bot
        // including identity information, and any other info that is relevant
        bot.getInstanceInfo = function(cb) {
            return facebook_botkit.getInstanceInfo(cb);
        };

        bot.getMessageUser = function(message, cb) {
            return new Promise(function(resolve, reject) {
                facebook_botkit.api.user_profile(message.user).then(function(identity) {

                    // normalize this into what botkit wants to see
                    var profile = {
                        id: message.user,
                        username: identity.first_name + ' ' + identity.last_name,
                        first_name: identity.first_name,
                        last_name: identity.last_name,
                        full_name: identity.first_name + ' ' + identity.last_name,
                        email: null, // no source for this info
                        gender: identity.gender,
                        timezone_offset: identity.timezone,
                    };

                    if (cb) {
                        cb(null, profile);
                    }
                    resolve(profile);

                }).catch(function(err) {
                    if (cb) {
                        cb(err);
                    }
                    reject(err);
                });
            });

        };




        return bot;
    });

    // return info about the specific instance of this bot
    // including identity information, and any other info that is relevant
    // unlike other platforms, this has to live on the controller
    // so that we can use it before a bot is spawned!
    facebook_botkit.getInstanceInfo = function(cb) {
        return new Promise(function(resolve, reject) {
            var instance = {
                identity: {},
                team: {},
            };

            request.get('https://' + api_host + '/v2.6/me?access_token=' + configuration.access_token,
                {},
                function(err, res, body) {
                    if (err) {
                        if (cb) cb(err);
                        return reject(err);
                    } else {

                        var identity = null;
                        try {
                            identity = JSON.parse(body);
                        } catch (err) {
                            if (cb) cb(err);
                            return reject(err);
                        }

                        // for facebook, the bot and the page have the same identity
                        instance.identity.name = identity.name;
                        instance.identity.id = identity.id;

                        instance.team.name = identity.name;
                        instance.team.url = 'http://facebook.com/' + identity.id;
                        instance.team.id = identity.id;

                        if (cb) cb(null, instance);
                        resolve(instance);
                    }
                });
        });
    };

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

        var payload = req.body;

        // facebook may send more than 1 message payload at a time
        // we split these up into multiple message objects for ingestion
        if (payload.entry) {
            for (var e = 0; e < payload.entry.length; e++) {
                if (payload.entry[e].messaging) {
                    for (var m = 0; m < payload.entry[e].messaging.length; m++) {
                        facebook_botkit.ingest(bot, payload.entry[e].messaging[m], res);
                    }
                }
            }
        }

    };

    facebook_botkit.middleware.spawn.use(function(worker, next) {

        // copy the identity that we get when the app initially boots up
        // into the specific bot instance
        worker.identity = facebook_botkit.identity;
        next();

    });

    // universal normalizing steps
    // handle normal messages from users (text, stickers, files, etc count!)
    facebook_botkit.middleware.normalize.use(function normalizeMessage(bot, message, next) {

        // capture the user ID
        message.user = message.sender.id;

        // since there are only 1:1 channels on Facebook, the channel id is set to the user id
        message.channel = message.sender.id;

        // copy over some facebook specific features
        message.page = message.recipient.id;
        next();

    });

    // handle normal messages from users (text, stickers, files, etc count!)
    facebook_botkit.middleware.normalize.use(function handleMessage(bot, message, next) {
        if (message.message) {

            // capture the message text
            message.text = message.message.text;

            // copy over some facebook specific features
            message.seq = message.message.seq;
            message.is_echo = message.message.is_echo;
            message.mid = message.message.mid;
            message.sticker_id = message.message.sticker_id;
            message.attachments = message.message.attachments;
            message.quick_reply = message.message.quick_reply;
            message.nlp = message.message.nlp;
        }

        next();

    });

    // handle postback messages (when a user clicks a button)
    facebook_botkit.middleware.normalize.use(function handlePostback(bot, message, next) {

        if (message.postback) {

            message.text = message.postback.payload;
            message.payload = message.postback.payload;

            message.referral = message.postback.referral;

            message.type = 'facebook_postback';

        }

        next();

    });

    // handle message sub-types
    facebook_botkit.middleware.categorize.use(function handleOptIn(bot, message, next) {

        if (message.optin) {
            message.type = 'facebook_optin';
        }
        if (message.delivery) {
            message.type = 'message_delivered';
        }
        if (message.read) {
            message.type = 'message_read';
        }
        if (message.referral) {
            message.type = 'facebook_referral';
        }
        if (message.account_linking) {
            message.type = 'facebook_account_linking';
        }
        if (message.is_echo) {
            message.type = 'message_echo';
        }

        next();

    });

    facebook_botkit.on('webserver_up', function(webserver) {

        // Validate that requests come from facebook, and abort on validation errors
        if (facebook_botkit.config.validate_requests === true) {
            // Load verify middleware just for post route on our receive webhook, and catch any errors it might throw to prevent the request from being parsed further.
            webserver.post('/facebook/receive', bodyParser.json({verify: verifyRequest}));
            webserver.use(abortOnValidationError);
        }


    });

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

    var attachment_upload_api = {
        upload: function(attachment, cb) {
            var message = {
                message: {
                    attachment: attachment
                }
            };

            request.post('https://' + api_host + '/v2.6/me/message_attachments?access_token=' + configuration.access_token,
                { form: message },
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not upload attachment');
                        cb(err);
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in attachment upload API call: Could not parse JSON', err, body);
                            cb(err);
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in attachment upload API call: ', results.error.message);
                                cb(results.error);
                            } else {
                                var attachment_id = results.attachment_id;
                                facebook_botkit.log('Successfully got attachment id ', attachment_id);
                                cb(null, attachment_id);
                            }
                        }
                    }
                });
        }

    };

    var tags = {
        get_all: function(cb) {
            request.get('https://' + api_host + '/v2.6/page_message_tags?access_token=' + configuration.access_token,
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not get tags list');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in page message tags call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in page message tags: ', results.error.message);
                            } else {
                                facebook_botkit.debug('Successfully call page message tags', body);
                                cb(results);
                            }
                        }
                    }
                });
        }
    };

    var nlp = {
        enable: function(custom_token) {
            facebook_botkit.api.nlp.postAPI(true, custom_token);
        },
        disable: function(custom_token) {
            facebook_botkit.api.nlp.postAPI(false, custom_token);
        },
        postAPI: function(value, custom_token) {
            var uri = 'https://' + api_host + '/v2.8/me/nlp_configs?nlp_enabled=' + value + '&access_token=' + configuration.access_token;
            if (custom_token) {
                uri += '&custom_token=' + custom_token;
            }
            request.post(uri, {},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not enable/disable build-in NLP');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in build-in NLP API call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in build-in API call: ', results.error.message);
                            } else {
                                facebook_botkit.debug('Successfully enable/disable build-in NLP', body);
                            }
                        }
                    }
                });
        }
    };

    var user_profile = function(uid, fields, cb) {
        if (!fields) {
            fields = 'first_name,last_name,timezone,gender,locale';
        }
        return new Promise(function(resolve, reject) {
            var uri = 'https://' + api_host + '/v2.6/' + uid + '?fields=' + fields + '&access_token=' + configuration.access_token;
            request.get(uri, {},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not get user profile:', err);
                        if (cb) {
                            cb(err);
                        } else {
                            reject(err);
                        }
                        return;
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in user profile call: Could not parse JSON', err, body);
                            if (cb) {
                                cb(err);
                            } else {
                                reject(err);
                            }
                            return;
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in user profile API call: ', results.error.message);
                                if (cb) {
                                    cb(results.error);
                                } else {
                                    reject(results.error);
                                }
                            } else {
                                if (cb) {
                                    cb(null, results);
                                } else {
                                    resolve(results);
                                }
                            }
                        }
                    }
                });
        });
    };






    facebook_botkit.api = {
        'user_profile': user_profile,
        'messenger_profile': messenger_profile_api,
        'thread_settings': messenger_profile_api,
        'attachment_upload': attachment_upload_api,
        'nlp': nlp,
        'tags': tags,
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


    facebook_botkit.getInstanceInfo().then(function(instance) {

        facebook_botkit.identity = instance.identity;

    }).catch(function(err) {

        console.error('Could not load bot identity!');
        throw new Error(err);

    });



    facebook_botkit.startTicking();


    return facebook_botkit;
};

module.exports = Facebookbot;
