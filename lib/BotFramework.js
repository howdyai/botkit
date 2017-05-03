var Botkit = require(__dirname + '/CoreBot.js');
var builder = require('botbuilder');
var express = require('express');
var bodyParser = require('body-parser');

function BotFrameworkBot(configuration) {

    // Create a core botkit bot
    var bf_botkit = Botkit(configuration || {});

    // customize the bot definition, which will be used when new connections
    // spawn!
    bf_botkit.defineBot(function(botkit, config) {

        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {
            function done(err) {
                if (cb) {
                    cb(err);
                }
            }

            if (!message || !message.address) {
                if (cb) {
                    cb(new Error('Outgoing message requires a valid address...'));
                }
                return;
            }

            // Copy message minus user & channel fields
            var bf_message = {};
            for (var key in message) {
                switch (key) {
                    case 'user':
                    case 'channel':
                        // ignore
                        break;
                    default:
                        bf_message[key] = message[key];
                        break;
                }
            }
            if (!bf_message.type) {
                bf_message.type = 'message';
            }

            // Ensure the message address has a valid conversation id.
            if (!bf_message.address.conversation) {
                bot.connector.startConversation(bf_message.address, function(err, adr) {
                    if (!err) {
                        // Send message through connector
                        bf_message.address = adr;
                        bot.connector.send([bf_message], done);
                    } else {
                        done(err);
                    }
                });
            } else {
                // Send message through connector
                bot.connector.send([bf_message], done);
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
            msg.address = src.address;

            bot.say(msg, cb);
        };

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

        // Create connector
        bot.connector = new builder.ChatConnector(config);

        return bot;

    });


    // set up a web route for receiving outgoing webhooks and/or slash commands

    bf_botkit.createWebhookEndpoints = function(webserver, bot, cb) {

        // Listen for incoming events
        bf_botkit.log(
            '** Serving webhook endpoints for the Microsoft Bot Framework at: ' +
                'http://' + bf_botkit.config.hostname + ':' +
                bf_botkit.config.port + '/botframework/receive');
        webserver.post('/botframework/receive', bot.connector.listen());

        // Receive events from chat connector
        bot.connector.onEvent(function(events, done) {
            for (var i = 0; i < events.length; i++) {
                // Break out user & channel fields from event
                // - These fields are used as keys for tracking conversations and storage.
                // - Prefixing with channelId to ensure that users & channels for different
                //   platforms are unique.
                var bf_event = events[i];
                var prefix = bf_event.address.channelId + ':';
                bf_event.user = prefix + bf_event.address.user.id;
                bf_event.channel = prefix + bf_event.address.conversation.id;

                // Dispatch event
                if (bf_event.type === 'message') {
                    bf_botkit.receiveMessage(bot, bf_event);
                } else {
                    bf_botkit.trigger(bf_event.type, [bot, bf_event]);
                }
            }

            if (done) {
                done(null);
            }
        });

        if (cb) {
            cb();
        }

        bf_botkit.startTicking();

        return bf_botkit;
    };

    bf_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        bf_botkit.config.port = port;

        bf_botkit.webserver = express();
        bf_botkit.webserver.use(bodyParser.json());
        bf_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        bf_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = bf_botkit.webserver.listen(
            bf_botkit.config.port,
            bf_botkit.config.hostname,
            function() {
                bf_botkit.log('** Starting webserver on port ' +
                    bf_botkit.config.port);
                if (cb) { cb(null, bf_botkit.webserver); }
            });

        return bf_botkit;

    };

    return bf_botkit;
};

module.exports = BotFrameworkBot;
