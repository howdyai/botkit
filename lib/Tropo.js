var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var crypto = require('crypto');
var tropo_webapi = require('tropo-webapi');
var tropo = new TropoWebAPI();

function Tropobot(configuration) {

    // Create a core botkit bot
    var controller = Botkit(configuration || {});


    // set up a web route for receiving outgoing webhooks and/or slash commands
    controller.createWebhookEndpoints = function(webserver, bot, cb) {


        var webhook_name = controller.config.webhook_name || 'Botkit Firehose';

        controller.log(
            '** Serving webhook endpoints for Cisco Spark Platform at: ' +
            'http://' + controller.config.hostname + ':' + controller.config.port + '/tropo/receive');
        webserver.post('/tropo/receive', function(req, res) {
            console.log('GOT A POST');
            controller.handleWebhookPayload(req, res, bot);

        });


    };


    controller.handleWebhookPayload = function(req, res, bot) {

      console.log('GOT PAYLOAD', req.body);
      var payload = req.body.session;
      var msg = {
        user: payload.from.id,
        text: payload.initialText,
        channel: payload.from.id,
      }

      controller.receiveMessage(bot, msg);

    };

    controller.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }

        var static_dir =  __dirname + '/public';

        if (controller.config && controller.config.webserver && controller.config.webserver.static_dir)
            static_dir = controller.config.webserver.static_dir;

        controller.config.port = port;

        controller.webserver = express();
        controller.webserver.use(bodyParser.json());
        controller.webserver.use(bodyParser.urlencoded({ extended: true }));
        controller.webserver.use(express.static(static_dir));

        var server = controller.webserver.listen(
            controller.config.port,
            controller.config.hostname,
            function() {
                controller.log('** Starting webserver on port ' +
                    controller.config.port);
                if (cb) { cb(null, controller.webserver); }
            });

        return controller;

    };


    // customize the bot definition, which will be used when new connections
    // spawn!
    controller.defineBot(function(botkit, config) {

        var bot = {
            type: 'ciscospark',
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


        /**
         * Convenience method for creating a DM convo.
         */
        bot.startPrivateConversation = function(message, cb) {

            var message_options = {};

            message_options.toPersonEmail = message.user;

            botkit.startTask(bot, message_options, function(task, convo) {
                convo.on('sent', function(sent_message) {
                    // update this convo so that future messages will match
                    // since the source message did not have this info in it.
                    convo.source_message.user = message.user;
                    convo.source_message.channel = sent_message.roomId;
                });
                cb(null, convo);
            });
        };


        /**
         * Convenience method for creating a DM based on a personId instead of email
         */
        bot.startPrivateConversationWithPersonId = function(personId, cb) {

            var message_options = {};

            message_options.toPersonId = personId;

            botkit.startTask(bot, message_options, function(task, convo) {
                convo.on('sent', function(sent_message) {
                    // update this convo so that future messages will match
                    // since the source message did not have this info in it.
                    convo.source_message.user = message.user;
                    convo.source_message.channel = sent_message.roomId;
                });
                cb(null, convo);
            });
        };


        /**
         * Convenience method for creating a DM convo with the `actor`, not the sender
         * this applies to events like channel joins, where the actor may be the user who sent the invite
         */
        bot.startPrivateConversationWithActor = function(message, cb) {
            bot.startPrivateConversationWithPersonId(message.original_message.actorId, cb);
        };


        bot.send = function(message, cb) {

            // clone the incoming message
            var ciscospark_message = {};
            for (var k in message) {
                ciscospark_message[k] = message[k];
            }

            console.log("SAY", message);


            // controller.api.messages.create(ciscospark_message).then(function(message) {
            //     if (cb) cb(null, message);
            // }).catch(function(err) {
            //     if (cb) cb(err);
            // });

        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            if (src.channel) {
                msg.channel = src.channel;
            } else if (src.toPersonEmail) {
                msg.toPersonEmail = src.toPersonEmail;
            } else if (src.toPersonId) {
                msg.toPersonId = src.toPersonId;
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

        return bot;

    });

    controller.startTicking();

    return controller;

}


module.exports = Tropobot;
