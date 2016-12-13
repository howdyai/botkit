var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Sparkbot(configuration) {

    // Create a core botkit bot
    var controller = Botkit(configuration || {});

    if (!controller.config.ciscospark_access_token) {
        throw new Error('ciscospark_access_token required to create controller');
    } else {
        controller.api = require('ciscospark').init({
            credentials: {
                authorization: {
                    access_token: controller.config.ciscospark_access_token
                }
            }
        });

        if (!controller.api) {
            throw new Error('Could not create Cisco Spark API');
        }

        controller.api.people.get('me').then(function(identity) {
            console.log('SPARK: My identity is',identity);
        }).catch(function(err) {
            throw new Error(err);
        });


    }



    // set up a web route for receiving outgoing webhooks and/or slash commands
    controller.createWebhookEndpoints = function(webserver, bot, cb) {

        controller.log(
            '** Serving webhook endpoints for Cisco Spark Platform at: ' +
            'http://' + controller.config.hostname + ':' + controller.config.port + '/ciscospark/receive');
        webserver.post('/ciscospark/receive', function(req, res) {
            controller.api.messages.get(req.body.data).then(function(message) {
                console.log('RECEIVED', message);

                var message = {
                    user: message.personEmail,
                    channel: message.roomId,
                    text: message.text,
                    id: message.id,
                    original_message: message,
                }

                controller.receiveMessage(bot, message);

            }).catch(function(err) {



            });
        });


        var list = controller.api.webhooks.list().then(function(list) {
            var hook_id = null;

            console.log("SPARK: Found webhooks ", list.items.length);
            for (var i = 0; i < list.items.length; i++) {
                if (list.items[i].name == 'Botkit Firehose') {
                    hook_id = list.items[i].id;
                }
            }


            if (hook_id) {
                console.log("UPDATING WEBHOOK");
                controller.api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: 'https://' + controller.config.public_address + '/ciscospark/receive',
                    event: 'all',
                    name: 'Botkit Firehose',
                }).then(function(res) {
                    console.log('Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS', res);
                }).catch(function(err) {
                    console.log("FAILED TO REGISTER WEBHOOK", err);
                    throw new Error(err);
                });

            } else {
                console.log("CREATING WEBHOOK");
                controller.api.webhooks.create({
                    resource: 'all',
                    targetUrl: 'https://' + controller.config.public_address + '/ciscospark/receive',
                    event: 'all',
                    name: 'Botkit Firehose',
                }).then(function(res) {

                    console.log('Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS', res);
                }).catch(function(err) {
                    console.log("FAILED TO REGISTER WEBHOOK", err);
                    throw new Error(err);
                });

            }


        });



    };

    controller.setupWebserver = function(port, cb) {

        console.log('SETTING UP WEB SERVER');
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

            controller.api.messages.create({
                text: message.text,
                roomId: message.channel
            });
            
        }

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


    return controller;

}


module.exports = Sparkbot;
