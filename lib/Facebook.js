var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var clone = require('clone');

function Facebookbot(configuration) {

    var api_version = 'v2.11';
    var api_host = configuration.api_host || 'graph.facebook.com';

    var appsecret_proof = getAppSecretProof(configuration.access_token, configuration.app_secret);

    // Create a core botkit bot
    var facebook_botkit = Botkit(configuration || {});


    // For backwards-compatability, support the receive_via_postback config option
    // this causes facebook_postback events to be replicated as message_received events
    // allowing them to be heard without subscribing to additional events
    if (facebook_botkit.config.receive_via_postback) {
        facebook_botkit.on('facebook_postback', function(bot, message) {
            facebook_botkit.trigger('message_received', [bot, message]);
        });
    }

    facebook_botkit.excludeFromConversations(['message_delivered', 'message_echo', 'message_read']);

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
                platform_message.tag = message.tag;
            }

            platform_message.messaging_type = message.messaging_type || 'RESPONSE';

            if (message.sticker_id) {
                platform_message.message.sticker_id = message.sticker_id;
            }

            if (message.quick_replies) {
                platform_message.message.quick_replies = message.quick_replies.map(function(item) {
                    var quick_reply = clone(item);
                    if (!item.content_type) quick_reply.content_type = 'text';
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

            if (facebook_botkit.config.require_appsecret_proof) {
                message.appsecret_proof = appsecret_proof;
            }

            request({
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: message,
                uri: 'https://' + api_host + '/' + api_version + '/me/messages'
            },
                function(err, res, body) {

                    if (err) {
                        botkit.debug('WEBHOOK ERROR', err);
                        return cb && cb(err);
                    }

                    if (body.error) {
                        botkit.debug('API ERROR', body.error);
                        return cb && cb(body.error);
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
                if (err) console.error(err);
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
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                        botkit.excludedEvents.indexOf(message.type) == -1 // this type of message should not be included
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
                        email: identity.email || null,
                        gender: identity.gender,
                        locale: identity.locale,
                        picture: identity.picture,
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
            var uri = 'https://' + api_host + '/' + api_version + '/me?access_token=' + configuration.access_token;

            var instance = {
                identity: {},
                team: {},
            };

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request.get(uri,
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
                var payload_entry = '';

                if (payload.entry[e].changes) {
                    payload_entry = payload.entry[e].changes;
                } else if (payload.entry[e].messaging) {
                    payload_entry = payload.entry[e].messaging;
                }

                if (payload_entry) {
                    for (var m = 0; m < payload_entry.length; m++) {
                        facebook_botkit.ingest(bot, payload_entry[m], res);
                    }
                }
                if (payload.entry[e].standby) {
                    for (var s = 0; s < payload.entry[e].standby.length; s++) {
                        var standby_message = payload.entry[e].standby[s];
                        standby_message.standby = true;
                        facebook_botkit.ingest(bot, standby_message, res);
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

        // handle normalization for sessions events
        if (message.field && message.field == 'sessions') {
            message.user = message.value.actor_id;
            message.channel = message.value.actor_id;

            // copy facebook specific features
            message.page = message.value;

            // set the event type
            message.type = message.value.event.toLowerCase();
        } else {

            //  in case of Checkbox Plug-in sender.id is not present, instead we should look at optin.user_ref
            if (!message.sender && message.optin && message.optin.user_ref) {
                message.sender = {id: message.optin.user_ref};
            }

            // capture the user ID
            message.user = message.sender.id;

            // since there are only 1:1 channels on Facebook, the channel id is set to the user id
            message.channel = message.sender.id;

            // copy over some facebook specific features
            message.page = message.recipient.id;
        }

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

    /* Facebook Handover Protocol categorize middleware */
    facebook_botkit.middleware.categorize.use(function threadControl(bot, message, next) {

        if (message.app_roles) {
            message.type = 'facebook_app_roles';
        }
        if (message.standby) {
            message.type = 'standby';
        }
        if (message.pass_thread_control) {
            message.type = 'facebook_receive_thread_control';
        }
        if (message.take_thread_control) {
            message.type = 'facebook_lose_thread_control';
        }
        if (message.request_thread_control) {
            message.type = 'facebook_request_thread_control';
        }

        next();

    });

    // handle delivery messages
    facebook_botkit.middleware.receive.use(function handleDelivery(bot, message, next) {

        if (message.type === 'message_delivered' && facebook_botkit.config.require_delivery) {
            // loop through all active conversations this bot is having
            // and mark messages in conversations as delivered = true
            // note: we don't pass the real event in here because message_delivered events are excluded from conversations and won't ever match!
            // also note: we only use message.delivery.watermark since message.delivery.mids can sometimes not be in the payload (#1311)
            bot.findConversation({user: message.user}, function(convo) {
                if (convo) {
                    for (var s = 0; s < convo.sent.length; s++) {
                        if (convo.sent[s].sent_timestamp <= message.delivery.watermark) {
                            convo.sent[s].delivered = true;
                        }
                    }
                }
            });
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
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_greeting: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('greeting');
        },
        get_greeting: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('greeting', cb);
        },
        get_started: function(payload) {
            var message = {
                'get_started': {
                    'payload': payload
                }
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_get_started: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('get_started');
        },
        get_get_started: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('get_started', cb);
        },
        menu: function(payload) {
            var messege = {
                persistent_menu: payload
            };
            return facebook_botkit.api.messenger_profile.postAPI(messege);
        },
        delete_menu: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('persistent_menu');
        },
        get_menu: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('persistent_menu', cb);
        },
        account_linking: function(payload) {
            var message = {
                'account_linking_url': payload
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_account_linking: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('account_linking_url');
        },
        get_account_linking: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('account_linking_url', cb);
        },
        domain_whitelist: function(payload) {
            var message = {
                'whitelisted_domains': Array.isArray(payload) ? payload : [payload]
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_domain_whitelist: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('whitelisted_domains');
        },
        get_domain_whitelist: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('whitelisted_domains', cb);
        },
        target_audience: function(payload) {
            var message = {
                'target_audience': payload
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_target_audience: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('target_audience');
        },
        get_target_audience: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('target_audience', cb);
        },
        home_url: function(payload) {
            var message = {
                home_url: payload
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_home_url: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('home_url');
        },
        get_home_url: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('home_url', cb);
        },
        payment_settings: function(payload) {
            var message = {
                payment_settings: payload
            };
            return facebook_botkit.api.messenger_profile.postAPI(message);
        },
        delete_payment_settings: function() {
            return facebook_botkit.api.messenger_profile.deleteAPI('payment_settings');
        },
        get_payment_settings: function(cb) {
            return facebook_botkit.api.messenger_profile.getAPI('payment_settings', cb);
        },
        postAPI: function(message) {
            return new Promise(function(resolve, reject) {
                var uri = 'https://' + api_host + '/' + api_version + '/me/messenger_profile?access_token=' + configuration.access_token;

                if (facebook_botkit.config.require_appsecret_proof) {
                    uri += '&appsecret_proof=' + appsecret_proof;
                }

                request.post(uri,
                    {form: message},
                    function(err, res, body) {
                        if (err) {
                            facebook_botkit.log('Could not configure messenger profile');
                            reject(err);
                        } else {

                            var results = null;
                            try {
                                results = JSON.parse(body);
                            } catch (err) {
                                facebook_botkit.log('ERROR in messenger profile API call: Could not parse JSON', err, body);
                                reject(err);
                            }

                            if (results) {
                                if (results.error) {
                                    facebook_botkit.log('ERROR in messenger profile API call: ', results.error.message);
                                    reject(results.error);
                                } else {
                                    facebook_botkit.debug('Successfully configured messenger profile', body);
                                    resolve(body);
                                }
                            }
                        }
                    });
            });
        },
        deleteAPI: function(type) {
            return new Promise(function(resolve, reject) {
                var uri = 'https://' + api_host + '/' + api_version + '/me/messenger_profile?access_token=' + configuration.access_token;

                var message = {
                    'fields': [type]
                };

                if (facebook_botkit.config.require_appsecret_proof) {
                    uri += '&appsecret_proof=' + appsecret_proof;
                }

                request.delete(uri,
                    {form: message},
                    function(err, res, body) {
                        if (err) {
                            facebook_botkit.log('Could not configure messenger profile');
                            reject(err);
                        } else {
                            var results = null;
                            try {
                                results = JSON.parse(body);
                            } catch (err) {
                                facebook_botkit.log('ERROR in messenger profile API call: Could not parse JSON', err, body);
                                reject(err);
                            }

                            if (results) {
                                if (results.error) {
                                    facebook_botkit.log('ERROR in messenger profile API call: ', results.error.message);
                                    reject(results.error);
                                } else {
                                    facebook_botkit.debug('Successfully configured messenger profile ', body);
                                    resolve(message);
                                }
                            }
                        }
                    });
            });
        },
        getAPI: function(fields, cb) {
            return new Promise(function(resolve, reject) {
                var uri = 'https://' + api_host + '/' + api_version + '/me/messenger_profile?fields=' + fields + '&access_token=' + configuration.access_token;

                if (facebook_botkit.config.require_appsecret_proof) {
                    uri += '&appsecret_proof=' + appsecret_proof;
                }

                request.get(uri,
                    function(err, res, body) {
                        if (err) {
                            facebook_botkit.log('Could not get messenger profile');
                            if (cb) cb(err);
                            else reject(err);
                        } else {
                            var results = null;
                            try {
                                results = JSON.parse(body);
                            } catch (err) {
                                facebook_botkit.log('ERROR in messenger profile API call: Could not parse JSON', err, body);
                                if (cb) cb(err);
                                else reject(err);
                            }

                            if (results) {
                                if (results.error) {
                                    facebook_botkit.log('ERROR in messenger profile API call: ', results.error.message);
                                    if (cb) cb(results.error);
                                    else reject(results.error);
                                } else {
                                    facebook_botkit.debug('Successfully got messenger profile ', body);
                                    if (cb) cb(null, body);
                                    else resolve(body);
                                }
                            }
                        }
                    });
            });
        },
        get_messenger_code: function(image_size, cb, ref) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/messenger_codes?access_token=' + configuration.access_token;

            var message = {
                'type': 'standard',
                'image_size': image_size || 1000
            };

            if (ref) {
                message.data = {'ref': ref};
            }

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }
            request.post(uri,
                {form: message},
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not configure get messenger code');
                        if (cb) {
                            cb(err);
                        }
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in messenger code API call: Could not parse JSON', err, body);
                            if (cb) {
                                cb(err);
                            }
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in messenger code API call: ', results.error.message);
                                if (cb) {
                                    cb(results.error);
                                }
                            } else {
                                var uri = results.uri;
                                facebook_botkit.log('Successfully got messenger code', uri);
                                if (cb) {
                                    cb(null, uri);
                                }
                            }
                        }
                    }
                });
        }
    };

    var attachment_upload_api = {
        upload: function(attachment, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/message_attachments?access_token=' + configuration.access_token;

            var message = {
                message: {
                    attachment: attachment
                }
            };

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request.post(uri,
                { form: message },
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not upload attachment');
                        if (cb) {
                            cb(err);
                        }
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in attachment upload API call: Could not parse JSON', err, body);
                            if (cb) {
                                cb(err);
                            }
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in attachment upload API call: ', results.error.message);
                                if (cb) {
                                    cb(results.error);
                                }
                            } else {
                                var attachment_id = results.attachment_id;
                                facebook_botkit.log('Successfully got attachment id ', attachment_id);
                                if (cb) {
                                    cb(null, attachment_id);
                                }
                            }
                        }
                    }
                });
        }

    };

    var tags = {
        get_all: function(cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/page_message_tags?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request.get(uri,
                function(err, res, body) {
                    if (err) {
                        facebook_botkit.log('Could not get tags list');
                        if (cb) {
                            cb(err);
                        }
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            facebook_botkit.log('ERROR in page message tags call: Could not parse JSON', err, body);
                            if (cb) {
                                cb(err);
                            }
                        }

                        if (results) {
                            if (results.error) {
                                facebook_botkit.log('ERROR in page message tags: ', results.error.message);
                                if (cb) {
                                    cb(results.error);
                                }
                            } else {
                                facebook_botkit.debug('Successfully call page message tags', body);
                                if (cb) {
                                    cb(results);
                                }
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
            var uri = 'https://' + api_host + '/' + api_version + '/me/nlp_configs?nlp_enabled=' + value + '&access_token=' + configuration.access_token;

            if (custom_token) {
                uri += '&custom_token=' + custom_token;
            }

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
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
            fields = 'first_name,last_name,timezone,gender,locale,email,picture';
        }
        return new Promise(function(resolve, reject) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + uid + '?fields=' + fields + '&access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

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

    var insights_api = {
        get_insights: function(metrics, since, until, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/insights?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            if (metrics) {
                if (typeof(metrics) == 'string') {
                    uri += '&metric=' + metrics;
                } else {
                    uri += '&metric=' + metrics.join(',');
                }
            }

            if (since) {
                uri += '&since=' + since;
            }

            if (until) {
                uri += '&until=' + until;
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not call Facebook Insights API', err);
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in Facebook Insights API call: ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully got Facebook Insights API');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        }
    };


    var handover = {
        get_secondary_receivers_list: function(fields, cb) {

            var uri = 'https://' + api_host + '/' + api_version + '/me/secondary_receivers';

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request.get({
                url: uri,
                qs: {
                    fields: typeof(fields) == 'string' ? fields : fields.join(','),
                    access_token: configuration.access_token
                },
                json: true
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get secondary receivers list');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in secondary receivers list: ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully getting secondary receivers list', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        take_thread_control: function(recipient, metadata, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/take_thread_control';

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var request_body = {
                recipient: {
                    id: recipient
                },
                metadata: metadata
            };
            request.post({
                url: uri,
                qs: {
                    access_token: configuration.access_token
                },
                body: request_body,
                json: true
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not take thread control');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in take thread control API call: ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully taken thread control', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        pass_thread_control: function(recipient, target, metadata, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/pass_thread_control';

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var request_body = {
                recipient: {
                    id: recipient
                },
                target_app_id: target,
                metadata: metadata
            };
            request.post({
                url: uri,
                qs: {
                    access_token: configuration.access_token
                },
                body: request_body,
                json: true
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not pass thread control');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in pass thread control API call: ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully passed thread control', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        request_thread_control: function(recipient, metadata, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/request_thread_control';

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var request_body = {
                recipient: {
                    id: recipient
                },
                metadata: metadata
            };
            request.post({
                url: uri,
                qs: {
                    access_token: configuration.access_token
                },
                body: request_body,
                json: true
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not request thread control');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in request thread control API call: ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully requested thread control', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_thread_owner: function(recipient, cb) {

            var uri = 'https://' + api_host + '/' + api_version + '/me/thread_owner';

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request.get({
                url: uri,
                qs: {
                    recipient: recipient,
                    access_token: configuration.access_token
                },
                json: true
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get thread owner');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR while getting thread owner : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully getting thread owner', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        }
    };
    var broadcast_api = {
        create_message_creative: function(message, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/message_creatives?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var messageToBroadcast = {};

            if (typeof(message) == 'string') {
                messageToBroadcast.text = message;
            } else {
                messageToBroadcast = message;
            }

            var body = {
                'messages': [messageToBroadcast]
            };

            request({
                method: 'POST',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not Create a broadcast message');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in creating a broadcast message call: ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully create a broadcast message', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        send: function(message_creative, custom_label_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/broadcast_messages?access_token=' + configuration.access_token;
            var body = {};

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            if (typeof message_creative === 'string') {
                body = {
                    'message_creative_id': message_creative
                };
            } else {
                body = message_creative;
            }

            if (custom_label_id) {
                body.custom_label_id = custom_label_id;
            }

            request({
                method: 'POST',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not send the broadcast message');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in sending the broadcast message call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully send the broadcast message', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_broadcast_metrics: function(broadcast_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + broadcast_id + '/insights/messages_sent?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not send a broadcast message');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in getting broadcast metrics call : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully get broadcast metrics ');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        create_label: function(name, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/custom_labels?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var body = {
                'name': name
            };

            request({
                method: 'POST',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not create label to target broadcast messages');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in creating label to target broadcast messages call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully create label to target broadcast messages', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        add_user_to_label: function(user, label_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + label_id + '/label?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var body = {
                'user': user
            };

            request({
                method: 'POST',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not add a user to a label');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in adding a user to a label API call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully add a user to a label', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        remove_user_from_label: function(user, label_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + label_id + '/label?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var body = {
                'user': user
            };

            request({
                method: 'DELETE',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not remove a user from a label');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in removing a user from a label API call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully remove a user from a label', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_labels_by_user: function(user, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + user + '/custom_labels?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get user associated labels');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in getting user associated labels API call : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully get user associated labels');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_label_details: function(label_id, fields, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + label_id + '?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            if (fields && fields.length > 0) {
                uri += '&fields=' + fields.join(',');
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get label details');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in getting label details call : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully get label details');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_all_labels: function(fields, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/me/custom_labels?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            if (fields && fields.length > 0) {
                uri += '&fields=' + fields.join(',');
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get labels');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in getting labels call : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully get labels');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        remove_label: function(label_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + label_id + '?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            request({
                method: 'DELETE',
                json: true,
                body: {},
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not remove label');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in removing label API call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully remove label', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        cancel_scheduled_broadcast: function(broadcast_id, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + broadcast_id + '?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            var body = {
                'operation': 'cancel'
            };

            request({
                method: 'POST',
                json: true,
                body: body,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not cancel scheduled broadcast');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in cencel scheduled broadcast call : ', body.error);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.debug('Successfully cancel scheduled broadcast', body);
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        },
        get_broadcast_status: function(broadcast_id, fields, cb) {
            var uri = 'https://' + api_host + '/' + api_version + '/' + broadcast_id + '?access_token=' + configuration.access_token;

            if (facebook_botkit.config.require_appsecret_proof) {
                uri += '&appsecret_proof=' + appsecret_proof;
            }

            if (fields && fields.length > 0) {
                uri += '&fields=' + fields.join(',');
            }

            request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, res, body) {
                if (err) {
                    facebook_botkit.log('Could not get broadcast status');
                    if (cb) {
                        cb(err);
                    }
                } else {
                    if (body.error) {
                        facebook_botkit.log('ERROR in getting broadcast status call : ', body.error.message);
                        if (cb) {
                            cb(body.error);
                        }
                    } else {
                        facebook_botkit.log('Successfully get broadcast status');
                        if (cb) {
                            cb(null, body);
                        }
                    }
                }
            });
        }
    };


    facebook_botkit.api = {
        'user_profile': user_profile,
        'messenger_profile': messenger_profile_api,
        'thread_settings': messenger_profile_api,
        'attachment_upload': attachment_upload_api,
        'nlp': nlp,
        'tags': tags,
        'handover': handover,
        'broadcast': broadcast_api,
        'insights': insights_api
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

    function getAppSecretProof(access_token, app_secret) {
        var hmac = crypto.createHmac('sha256', app_secret || '');
        return hmac.update(access_token).digest('hex');
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
