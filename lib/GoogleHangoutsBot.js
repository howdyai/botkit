var Botkit = require(__dirname + '/CoreBot.js');
var { google } = require('googleapis');

function GoogleHangoutsBot(configuration) {

    var api_version = 'v1';

    var google_hangouts_botkit = Botkit(configuration || {});

    google_hangouts_botkit.defineBot(function(botkit, config) {

        var bot = {
            type: 'googlehangouts',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.send = function(message, cb) {


            bot.api.spaces.messages.create(message)
                .then(res => {
                    botkit.debug('Successfully sent message to Google Hangouts : ' + res.data.name);
                    if (cb) {
                        cb(null, res.data);
                    }
                })
                .catch(err => {
                    botkit.debug('Error while sending message to Google Hangouts', err);
                    if (cb) {
                        cb(err);
                    }
                });
        };

        bot.reply = function(src, resp, cb) {

            var message_to_send = {
                parent: src.space.name,
                threadKey: undefined,
                requestBody: {}
            };

            if (typeof (resp) == 'string') {
                message_to_send.requestBody.text = resp;
            } else if (resp.text) {
                message_to_send.requestBody.text = resp.text;
            } else {
                message_to_send.requestBody = resp.requestBody;
            }

            if (!src.message.thread) {
                bot.replyAsNewThread(src, resp, cb);
            } else {
                message_to_send.requestBody.thread = {
                    name: src.message.thread.name
                };

                bot.say(message_to_send, cb);
            }

        };

        bot.replyWithThreadKey = function(src, resp, cb) {

            var msg = {};

            msg.parent = src.space.name;
            msg.threadKey = resp.threadKey;
            msg.requestBody = resp.requestBody;

            bot.say(msg, cb);
        };

        bot.replyAsNewThread = function(src, resp, cb) {

            var msg = {};

            msg.parent = src.space.name;

            if (typeof (resp) == 'string') {
                msg.requestBody = {
                    text: resp
                };
            } else {
                msg.requestBody = resp;
            }

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                      botkit.tasks[t].convos[c].source_message.user == message.user &&
                      botkit.tasks[t].convos[c].source_message.channel == message.channel &&
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

        return bot;
    });

    google_hangouts_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        var endpoint = '/hangouts/' + (google_hangouts_botkit.config.endpoint ? google_hangouts_botkit.config.endpoint : 'receive');

        google_hangouts_botkit.log(
            '** Serving webhook endpoints for Google Hangout Platform at : ' +
            'http://' + google_hangouts_botkit.config.hostname + ':' + google_hangouts_botkit.config.port + endpoint
        );

        webserver.post(endpoint, function(req, res) {
            google_hangouts_botkit.handleWebhookPayload(req, res, bot);
        });

        if (cb) {
            cb();
        }

        return google_hangouts_botkit;
    };

    google_hangouts_botkit.handleWebhookPayload = function(req, res, bot) {

        var payload = req.body;

        if (google_hangouts_botkit.config.token && google_hangouts_botkit.config.token !== payload.token) {
            res.status(401);
            google_hangouts_botkit.debug('Token verification failed, Ignoring message');
        } else {
            res.status(200);
            google_hangouts_botkit.ingest(bot, payload, res);
        }

        res.send();
    };

    google_hangouts_botkit.middleware.format.use(function(bot, message, platform_message, next) {

        platform_message.parent = message.parent;
        platform_message.threadKey = message.threadKey;
        platform_message.requestBody = message.requestBody;

        next();

    });

    google_hangouts_botkit.middleware.spawn.use(function(worker, next) {

        let params = {
            scopes: 'https://www.googleapis.com/auth/chat.bot'
        };

        google
            .auth
            .getClient(params)
            .then(client => {
                worker.authClient = client;
                worker.api = google.chat({version: api_version, auth: worker.authClient});
                next();
            })
            .catch(err => {
                console.error('Could not get google auth client !');
                throw new Error(err);
            });
    });

    google_hangouts_botkit.middleware.normalize.use(function handlePostback(bot, message, next) {
        message.user = message.user.name;
        if (message.message) {
            message.channel = message.message.thread.name;
            message.text = message.message.argumentText ? message.message.argumentText.trim() : '';
        } else {
            message.channel = message.space.name;
        }
        next();
    });

    google_hangouts_botkit.middleware.categorize.use(function(bot, message, next) {

        if ('MESSAGE' === message.type) {
            if (message.space.type == 'DM') {
                message.type = 'direct_message';
            } else {
                message.type = 'message_received';
            }
        }

        if ('ADDED_TO_SPACE' === message.type) {
            message.type = 'ROOM' === message.space.type ? 'bot_room_join' : 'bot_dm_join';
        }

        if ('REMOVED_FROM_SPACE' === message.type) {
            message.type = 'ROOM' === message.space.type ? 'bot_room_leave' : 'bot_dm_leave';
        }

        if ('CARD_CLICKED' === message.type) {
            message.type = message.type.toLowerCase();
        }

        next();

    });

    google_hangouts_botkit.startTicking();

    return google_hangouts_botkit;
}

module.exports = GoogleHangoutsBot;
