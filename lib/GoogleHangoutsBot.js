var Botkit = require(__dirname + '/CoreBot.js');

function GoogleHangoutsBot(configuration) {

    var google_hangouts_botkit = Botkit(configuration || {});

    google_hangouts_botkit.defineBot(function (botkit, config) {

        var bot = {
            type: 'googlehangouts',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.send = function (message, cb) {


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
                function (err, res, body) {

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

        bot.startTyping = function (src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_on';
            bot.say(msg, cb);
        };

        bot.stopTyping = function (src, cb) {
            var msg = {};
            msg.channel = src.channel;
            msg.sender_action = 'typing_off';
            bot.say(msg, cb);
        };

        bot.replyWithTyping = function (src, resp, cb) {
            var textLength;

            if (typeof (resp) == 'string') {
                textLength = resp.length;
            } else if (resp.text) {
                textLength = resp.text.length;
            } else {
                textLength = 80; //default attachement text length
            }

            var avgWPM = 85;
            var avgCPM = avgWPM * 7;

            var typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 5000);

            bot.startTyping(src, function (err) {
                if (err) console.error(err);
                setTimeout(function () {
                    bot.reply(src, resp, cb);
                }, typingLength);
            });

        };

        bot.reply = function (src, resp, cb) {
            var msg = {};

            if (typeof (resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            bot.say(msg, cb);
        };

        bot.findConversation = function (message, cb) {
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

        bot.getInstanceInfo = function (cb) {
            return facebook_botkit.getInstanceInfo(cb);
        };

        bot.getMessageUser = function (message, cb) {
            return new Promise(function (resolve, reject) {
                facebook_botkit.api.user_profile(message.user).then(function (identity) {

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

                }).catch(function (err) {
                    if (cb) {
                        cb(err);
                    }
                    reject(err);
                });
            });

        };

        return bot;
    });

    google_hangouts_botkit.createWebhookEndpoints = function (webserver, bot, cb) {

        var endpoint = '/hangouts/' + google_hangouts_botkit.config.endpoint;

        google_hangouts_botkit.log(
            '** Serving webhook endpoints for Google Hangout Platform at : ' +
            'http://' + google_hangouts_botkit.config.hostname + ':' + google_hangouts_botkit.config.port + endpoint
        );

        webserver.post(endpoint, function (req, res) {
            res.status(200).send();
            google_hangouts_botkit.handleWebhookPayload(req, res, bot);
        });

        if (cb) {
            cb();
        }

        return google_hangouts_botkit;
    };

    google_hangouts_botkit.handleWebhookPayload = function (req, res, bot) {
        var payload = req.body;
        if (google_hangouts_botkit.config.token && google_hangouts_botkit.config.token !== payload.token) {
            google_hangouts_botkit.debug('Token verification failed, Ignoring message');
        } else {
            google_hangouts_botkit.ingest(bot, payload, res);
        }
    };

    google_hangouts_botkit.middleware.normalize.use(function handlePostback(bot, message, next) {
        if (message.message) {
            message.text = message.message.argumentText.trim();
        }
        next();
    });

    google_hangouts_botkit.middleware.categorize.use(function (bot, message, next) {
        
        if ('MESSAGE' === message.type) {
            message.type = 'message_received';
        }

        if ('ADDED_TO_SPACE' === message.type) {
            message.type = 'ROOM' === message.space.type ? 'room_join' : 'direct_message';
        }

        if ('REMOVED_FROM_SPACE' === message.type) {
            message.type = 'ROOM' === message.space.type ? 'room_leave' : 'remove_conversation';
        }

        next();
    });

    return google_hangouts_botkit;
};

module.exports = GoogleHangoutsBot;