var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var Twilio = require('twilio');
var async = require('async');


function Twiliobot(configuration) {

    // Create a core botkit bot
    var twilio_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    twilio_botkit.defineBot(function(botkit, config) {
        var bot = {
            type: 'twilioipm',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.send = function(message, cb) {
            botkit.debug('SEND ', message);

            bot.api.channels(message.channel).messages.create(message)
                .then(function(response) {
                    cb(null, response);
                }).catch(function(err) {
                    cb(err);
                });
        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.user = src.user;
            msg.channel = src.channel;

            bot.say(msg, cb);
        };

        bot.autoJoinChannels = function() {
            bot.api.channels.list().then(function(full_channel_list) {
                if (bot.config.autojoin === true) {
                    bot.channels = full_channel_list;
                    bot.channels.forEach(function(chan) {
                        bot.api.channels(chan.sid).members.create({
                            identity: bot.identity
                        }).then(function(response) {
                            botkit.debug('added ' +
                              bot.identity + ' as a member of the ' + chan.friendlyName);
                        }).catch(function(error) {
                            botkit.debug('Couldn\'t join the channel: ' +
                                chan.friendlyName + ': ' + error);
                        });
                    });
                } else if (bot.identity) {

                    // load up a list of all the channels that the bot is currently

                    bot.channels = [];

                    async.each(full_channel_list, function(chan, next) {
                        bot.api.channels(chan.sid).members.list().then(function(members) {
                            for (var x = 0; x < members.length; x++) {
                                if (members[x].identity === bot.identity) {
                                    bot.channels.push(chan);
                                }
                            }
                            next();
                        }).catch(function(error) {
                            botkit.log('Error loading channel member list: ', error);
                            next();
                        });
                    });
                }
            }).catch(function(error) {
                botkit.log('Error loading channel list: ' + error);
                // fails if no channels exist
                // set the channels to empty
                bot.channels = { channels: [] };
            });

        };

        bot.configureBotIdentity = function() {
            if (bot.identity !== null || bot.identity !== '') {
                var userRespIter = 0;
                var existingIdentity = null;

                // try the get by identity thing
                bot.api.users(bot.identity).fetch().then(function(response) {
                    bot.autoJoinChannels();
                }).catch(function(error) {
                    // if not make the new user and see if they need to be added to all the channels
                    bot.api.users.create({
                        identity: bot.identity
                    }).then(function(response) {
                        bot.autoJoinChannels();
                    }).catch(function(error) {
                        botkit.log('Could not get Bot Identity:');
                        botkit.log(error);
                        process.exit(1);
                    });
                });
            }
        };

        /**
        * This handles the particulars of finding an existing conversation or
        * topic to fit the message into...
        */
        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                            botkit.tasks[t].convos[c].source_message.channel == message.channel
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };


        bot.client = new Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        bot.api = bot.client.chat.services(config.TWILIO_IPM_SERVICE_SID);

        if (config.identity) {
            bot.identity = config.identity;
            bot.configureBotIdentity();
        }

        return bot;

    });

    // set up a web route for receiving outgoing webhooks and/or slash commands
    twilio_botkit.createWebhookEndpoints = function(webserver, bot) {

        twilio_botkit.log(
            '** Serving webhook endpoints for receiving messages ' +
            'webhooks at: http://' + twilio_botkit.config.hostname + ':' +
                twilio_botkit.config.port + '/twilio/receive');
        webserver.post('/twilio/receive', function(req, res) {

            res.status(200);
            res.send('ok');
            twilio_botkit.handleWebhookPayload(req, res, bot);

        });


        return twilio_botkit;
    };

    twilio_botkit.handleWebhookPayload = function(req, res, bot) {
        var message = req.body;
        twilio_botkit.ingest(bot, message, res);
    };

    //normalize the message to ensure channel, and user properties are present
    twilio_botkit.middleware.normalize.use(function normalizeMessage(bot, message, next) {
        if (message.EventType == 'onMessageSent') {

            // customize fields to be compatible with Botkit
            message.text = message.Body;
            message.from = message.From;
            message.to = message.To;
            message.user = message.From;
            message.channel = message.ChannelSid;

        } else if (message.EventType == 'onChannelAdded' || message.EventType == 'onChannelAdd') {
            // this event has a channel sid but not a user
            message.channel = message.ChannelSid;

        } else if (message.EventType == 'onChannelDestroyed' || message.EventType == 'onChannelDestroy') {
            // this event has a channel sid but not a user
            message.channel = message.ChannelSid;

        } else if (message.EventType == 'onMemberAdded' || message.EventType == 'onMemberAdd') {
            // should user be MemberSid the The Member Sid of the newly added Member
            message.user = message.Identity;
            message.channel = message.ChannelSid;
        } else if (message.EventType == 'onMemberRemoved' || message.EventType == 'onMemberRemove') {
            message.user = message.Identity;
            message.channel = message.ChannelSid;
        }

        next();
    });

    //categorize the message type with appropriate checks
    twilio_botkit.middleware.categorize.use(function categorizeMessage(bot, message, next) {
        if (message.EventType === 'onMessageSent') {
            //discard echo messages
            if (bot.identity && message.from === bot.identity) {
                return;
            }

            // message without text is probably an edit
            if (!message.text) {
                return;
            }

            if (bot.identity) {
                var channels = bot.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid === message.channel;
                });

                if (apprChan.length === 0) {
                    return;
                }
            }

            message.type = 'message_received';

        } else if (message.EventType === 'onMemberRemoved') {

            if (bot.identity && message.user === bot.identity) {
                // remove that channel from bot.channels.channels
                var chan_to_rem = bot.channels.map(function(ch) {
                    return ch.sid;
                }).indexOf(message.channel);

                if (chan_to_rem != -1) {
                    bot.channels.splice(chan_to_rem, 1);
                    twilio_botkit.debug('Unsubscribing from channel because of memberremove.');

                }

            } else if (bot.identity) {
                var channels = bot.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid == message.channel;
                });

                if (apprChan.length === 0) {
                    return;
                }
            }

            if (bot.identity && bot.identity == message.user) {
                message.type = 'bot_channel_leave';
            } else {
                message.type = 'user_channel_leave';
            }
        } else if (message.EventType === 'onMemberAdded') {

            if (bot.identity && message.user === bot.identity) {
                bot.api.channels(message.channel).fetch().then(function(response) {
                    bot.channels.push(response);
                    twilio_botkit.debug('Subscribing to channel because of memberadd.');
                }).catch(function(error) {
                    botkit.log(error);
                });
            } else if (bot.identity) {
                var channels = bot.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid == message.channel;
                });

                if (apprChan.length === 0) {
                    return;
                }
            }

            if (bot.identity && bot.identity == message.user) {
                message.type = 'bot_channel_join';
            } else {
                message.type = 'user_channel_join';
            }
        } else if (message.EventType === 'onChannelDestroyed') {
            if (bot.identity) {
                var chan_to_rem = bot.channels.map(function(ch) {
                    return ch.sid;
                }).indexOf(message.channel);
                if (chan_to_rem !== -1) {
                    bot.channels.splice(chan_to_rem, 1);
                    twilio_botkit.debug('Unsubscribing from destroyed channel.');
                }
                message.type = 'channel_destroyed';
            }
        } else if (message.EventType === 'onChannelAdded') {
            if (bot.identity && bot.config.autojoin === true) {
                // join the channel
                bot.api.channels(message.channel).members.create({
                    identity: bot.identity
                }).then(function(response) {
                    return bot.api.channels(message.channel).fetch().then(function(response) {
                        bot.channels.push(response);
                        twilio_botkit.debug('Subscribing to new channel.');
                    });
                }).catch(function(error) {
                    botkit.log(error);
                });
                message.type = message.EventType;
                message.type = 'channel_created';
            }
        } else {
            message.type = message.EventType;
        }

        next();
    });

    twilio_botkit.middleware.format.use(function formatMessage(bot, message, platform_message, next) {
        platform_message.channel = message.channel;
        platform_message.body = message.text;
        if (bot.identity) {
            platform_message.from = bot.identity;
        }
        next();
    });

    twilio_botkit.startTicking();

    return twilio_botkit;

}

module.exports = Twiliobot;
