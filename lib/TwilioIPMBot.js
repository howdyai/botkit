var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var async = require('async');

var AccessToken = twilio.AccessToken;
var IpMessagingGrant = AccessToken.IpMessagingGrant;

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

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {
            botkit.debug('SEND ', message);

            if (bot.identity === null || bot.identity === '') {
                bot.api.channels(message.channel).messages.create({
                    body: message.text,
                }).then(function(response) {
                    cb(null, response);
                }).catch(function(err) {
                    cb(err);
                });
            } else {
                bot.api.channels(message.channel).messages.create({
                    body: message.text,
                    from: bot.identity
                }).then(function(response) {
                    cb(null, response);
                }).catch(function(err) {
                    cb(err);
                });
            }
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
                bot.channels.channels.forEach(function(chan) {
                    bot.api.channels(chan.sid).members.create({
                        identity: bot.identity
                    }).then(function(response) {
                        botkit.debug('added ' +
                          bot.identity + ' as a member of the ' + chan.friendly_name);
                    }).fail(function(error) {
                        botkit.debug('Couldn\'t join the channel: ' +
                            chan.friendly_name + ': ' + error);
                    });
                });
            } else if (bot.identity) {

                // load up a list of all the channels that the bot is currently

                bot.channels = {
                    channels: []
                };

                async.each(full_channel_list.channels, function(chan, next) {
                    bot.api.channels(chan.sid).members.list().then(function(members) {
                        for (var x = 0; x < members.members.length; x++) {
                            if (members.members[x].identity == bot.identity) {
                                bot.channels.channels.push(chan);
                            }
                        }
                        next();
                    }).fail(function(error) {
                        botkit.log('Error loading channel member list: ', error);
                        next();
                    });
                });
            }
        }).fail(function(error) {
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
                bot.api.users(bot.identity).get().then(function(response) {
                    bot.autoJoinChannels();
                }).fail(function(error) {
                    // if not make the new user and see if they need to be added to all the channels
                    bot.api.users.create({
                        identity: bot.identity
                    }).then(function(response) {
                        bot.autoJoinChannels();
                    }).fail(function(error) {
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


        bot.client = new twilio.IpMessagingClient(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        bot.api = bot.client.services(config.TWILIO_IPM_SERVICE_SID);

        if (config.identity) {
            bot.identity = config.identity;
            bot.configureBotIdentity();
        }

        return bot;

    });


    twilio_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        twilio_botkit.config.port = port;

        twilio_botkit.webserver = express();
        twilio_botkit.webserver.use(bodyParser.json());
        twilio_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        twilio_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = twilio_botkit.webserver.listen(
            twilio_botkit.config.port,
            twilio_botkit.config.hostname,
            function() {
                twilio_botkit.log('** Starting webserver on port ' +
                    twilio_botkit.config.port);
                if (cb) { cb(null, twilio_botkit.webserver); }
            });

        return twilio_botkit;

    };




    // set up a web route for receiving outgoing webhooks and/or slash commands
    twilio_botkit.createWebhookEndpoints = function(webserver, bot) {

        twilio_botkit.log(
            '** Serving webhook endpoints for receiving messages ' +
            'webhooks at: http://' + twilio_botkit.config.hostname + ':' +
                twilio_botkit.config.port + '/twilio/receive');
        webserver.post('/twilio/receive', function(req, res) {
            // ensure all messages
            // have a user & channel
            var message = req.body;
            if (req.body.EventType == 'onMessageSent') {

                // customize fields to be compatible with Botkit
                message.text = req.body.Body;
                message.from = req.body.From;
                message.to = req.body.To;
                message.user = req.body.From;
                message.channel = req.body.ChannelSid;

                twilio_botkit.receiveMessage(bot, message);

            }else if (req.body.EventType == 'onChannelAdded' || req.body.EventType == 'onChannelAdd') {
                // this event has a channel sid but not a user
                message.channel = req.body.ChannelSid;
                twilio_botkit.trigger(req.body.EventType, [bot, message]);

            }else if (req.body.EventType == 'onChannelDestroyed' || req.body.EventType == 'onChannelDestroy') {
                // this event has a channel sid but not a user
                message.channel = req.body.ChannelSid;
                twilio_botkit.trigger(req.body.EventType, [bot, message]);

            }else if (req.body.EventType == 'onMemberAdded' || req.body.EventType == 'onMemberAdd') {
                // should user be MemberSid the The Member Sid of the newly added Member
                message.user = req.body.Identity;
                message.channel = req.body.ChannelSid;
                twilio_botkit.trigger(req.body.EventType, [bot, message]);
            } else if (req.body.EventType == 'onMemberRemoved' || req.body.EventType == 'onMemberRemove') {
                message.user = req.body.Identity;
                message.channel = req.body.ChannelSid;
                twilio_botkit.trigger(req.body.EventType, [bot, message]);

                if (req.body.EventType == 'onMemberRemoved') {

                }
            } else {
                twilio_botkit.trigger(req.body.EventType, [bot, message]);
            }

            res.status(200);
            res.send('ok');


        });

        twilio_botkit.startTicking();

        return twilio_botkit;
    };



    // handle events here
    twilio_botkit.handleTwilioEvents = function() {
        twilio_botkit.log('** Setting up custom handlers for processing Twilio messages');
        twilio_botkit.on('message_received', function(bot, message) {



            if (bot.identity && message.from == bot.identity) {
                return false;
            }

            if (!message.text) {
                // message without text is probably an edit
                return false;
            }

            if (bot.identity) {
                var channels = bot.channels.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid == message.channel;
                });

                if (apprChan.length === 0) {
                    return false;
                }
            }
        });


        // if a member is removed from a channel, check to see if it matches the bot's identity
        // and if so remove it from the list of channels the bot listens to
        twilio_botkit.on('onMemberRemoved', function(bot, message) {
            if (bot.identity && message.user == bot.identity) {
                // remove that channel from bot.channels.channels
                var chan_to_rem = bot.channels.channels.map(function(ch) {
                return ch.sid;
            }).indexOf(message.channel);

                if (chan_to_rem != -1) {
                    bot.channels.channels.splice(chan_to_rem, 1);
                    twilio_botkit.debug('Unsubscribing from channel because of memberremove.');

                }
            } else if (bot.identity) {
                var channels = bot.channels.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid == message.channel;
                });

                if (apprChan.length === 0) {
                    return false;
                }
            }

            if (bot.identity && bot.identity == message.user) {
                twilio_botkit.trigger('bot_channel_leave', [bot, message]);
            } else {
                twilio_botkit.trigger('user_channel_leave', [bot, message]);
            }
        });

        twilio_botkit.on('onMemberAdded', function(bot, message) {
            if (bot.identity && message.user == bot.identity) {
                bot.api.channels(message.channel).get().then(function(response) {
                    bot.channels.channels.push(response);
                    twilio_botkit.debug('Subscribing to channel because of memberadd.');

                }).fail(function(error) {
                    botkit.log(error);
                });
            } else if (bot.identity) {
                var channels = bot.channels.channels;

                // if its not in a channel with the bot
                var apprChan = channels.filter(function(ch) {
                    return ch.sid == message.channel;
                });

                if (apprChan.length === 0) {
                    return false;
                }
            }

            if (bot.identity && bot.identity == message.user) {
                twilio_botkit.trigger('bot_channel_join', [bot, message]);
            } else {
                twilio_botkit.trigger('user_channel_join', [bot, message]);
            }

        });


        // if a channel is destroyed, remove it from the list of channels this bot listens to
        twilio_botkit.on('onChannelDestroyed', function(bot, message) {
            if (bot.identity) {
                var chan_to_rem = bot.channels.channels.map(function(ch) {
                return ch.sid;
            }).indexOf(message.channel);
                if (chan_to_rem != -1) {
                    bot.channels.channels.splice(chan_to_rem, 1);
                    twilio_botkit.debug('Unsubscribing from destroyed channel.');
                }
            }
        });

        // if a channel is created, and the bot is set in autojoin mode, join the channel
        twilio_botkit.on('onChannelAdded', function(bot, message) {
            if (bot.identity && bot.config.autojoin === true) {
                // join the channel
                bot.api.channels(message.channel).members.create({
                    identity: bot.identity
                }).then(function(response) {
                    bot.api.channels(message.channel).get().then(function(response) {
                        bot.channels.channels.push(response);
                        twilio_botkit.debug('Subscribing to new channel.');

                    }).fail(function(error) {
                        botkit.log(error);
                    });
                }).fail(function(error) {
                    botkit.log(error);
                });
            }
        });

    };

    twilio_botkit.handleTwilioEvents();

    return twilio_botkit;

}

module.exports = Twiliobot;
