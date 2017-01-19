var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');

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
            console.log('SPARK: My identity is', identity);
            controller.identity = identity;
        }).catch(function(err) {
            throw new Error(err);
        });
    }

    if (!controller.config.public_address) {
            throw new Error('public_address parameter required to receive webhooks');
    } else {

        var endpoint = url.parse(controller.config.public_address);
        if (!endpoint.hostname) {
            throw new Error('Could not determine hostname of public address: ' + controller.config.public_address);
        } else if (endpoint.protocol != 'https:') {
            throw new Error('Please specify an SSL-enabled url for your public address: ' + controller.config.public_address);
        } else {
            controller.config.public_address = endpoint.hostname;
        }

    }

    if (!controller.config.secret) {
        console.log("WARNING: No secret specified. Source of incoming webhooks will not be validated. https://developer.ciscospark.com/webhooks-explained.html#auth");
        // throw new Error('secret parameter required to secure webhooks');
    }

    // set up a web route for receiving outgoing webhooks and/or slash commands
    controller.createWebhookEndpoints = function(webserver, bot, cb) {


        var webhook_name = controller.config.webhook_name || 'Botkit Firehose';

        controller.log(
            '** Serving webhook endpoints for Cisco Spark Platform at: ' +
            'http://' + controller.config.hostname + ':' + controller.config.port + '/ciscospark/receive');
        webserver.post('/ciscospark/receive', function(req, res) {

            controller.handleWebhookPayload(req, res, bot);

        });


        var list = controller.api.webhooks.list().then(function(list) {
            var hook_id = null;

            for (var i = 0; i < list.items.length; i++) {
                if (list.items[i].name == webhook_name) {
                    hook_id = list.items[i].id;
                }
            }

            var hook_url = 'https://' + controller.config.public_address + '/ciscospark/receive';

            console.log('Spark: incoming webhook url is ', hook_url);

            if (hook_id) {
                controller.api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: controller.config.secret,
                    name: webhook_name,
                }).then(function(res) {
                    console.log('Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS');
                }).catch(function(err) {
                    console.log('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });

            } else {
                controller.api.webhooks.create({
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: controller.config.secret,
                    name: webhook_name,
                }).then(function(res) {

                    console.log('Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS');
                }).catch(function(err) {
                    console.log('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });

            }
        });
    };

    controller.on('message_received', function(bot, message) {

        if (controller.config.limit_to_org) {
            console.log('limit to org', controller.config.limit_to_org,  message.original_message.orgId);
            if (!message.original_message.orgId || message.original_message.orgId != controller.config.limit_to_org) {
                // this message is from a user outside of the proscribed org
                return false;
            }
        }

        if (controller.config.limit_to_domain) {
            var domains = [];
            if (typeof(controller.config.limit_to_domain) == 'string') {
                domains = [controller.config.limit_to_domain];
            } else {
                domains = controller.config.limit_to_domain;
            }

            var allowed = false;
            for (var d = 0; d < domains.length; d++) {
                if (message.user.toLowerCase().indexOf(domains[d]) >= 0) {
                    allowed = true;
                }
            }

            if (!allowed) {
                // this message came from a domain that is outside of the allowed list.
                return false;
            }
        }



        if (message.user === controller.identity.emails[0]) {
            controller.trigger('self_message', [bot, message]);
            return false;
        } else if (message.original_message.roomType == 'direct') {
            controller.trigger('direct_message', [bot, message]);
            return false;
        } else {

            controller.trigger('direct_mention', [bot, message]);
            return false;
        }
    });

    controller.handleWebhookPayload = function(req, res, bot) {

        if (controller.config.secret) {
            var signature = req.headers['x-spark-signature'];
            var crypto = require('crypto');
            var hash = crypto.createHmac('sha1', controller.config.secret).update(JSON.stringify(req.body)).digest('hex');

            if (signature != hash) {
                console.error('WARNING: Webhook received message with invalid signature. Potential malicious behavior!');
                return false;
            }
        }

        if (req.body.resource == 'messages' && req.body.event == 'created') {

            console.log('RAW MESSAGE',req.body);
            controller.api.messages.get(req.body.data).then(function(message) {

                console.log('DECRYPTED MESSAGE', message);
                // copy some fields from req.body that aren't in the new message
                message.orgId = req.body.orgId;

                var message = {
                    user: message.personEmail,
                    channel: message.roomId,
                    text: message.text,
                    id: message.id,
                    original_message: message,
                };

                // remove @mentions of the bot from the source text before we ingest it
                if (message.original_message.html) {

                  // strip the mention & HTML from the message
                  var pattern = new RegExp('^\<p\>\<spark\-mention .*?data\-object\-id\=\"' + controller.identity.id + '\".*\>.*?\<\/spark\-mention\>');
                  var action = message.original_message.html.replace(pattern,'');

                  // strip the remaining HTML tags
                  action = action.replace(/\<.*?\>/img,'');

                  // strip remaining whitespace
                  action = action.trim();

                  // replace the message text with the the HTML version
                  message.text = action;

                } else {
                    var pattern = new RegExp('^' + controller.identity.displayName + '\\s+','i');
                    if (message.text) {
                        message.text = message.text.replace(pattern, '');
                    }
                }

                controller.receiveMessage(bot, message);

            }).catch(function(err) {
                console.error('Could not get message', err);
            });
        } else {

            var event = req.body.resource + '.' + req.body.event;

            var message = {
                user: req.body.data.personEmail,
                channel: req.body.data.roomId,
                id: req.body.data.id,
                original_message: req.body,
                type: event,
            };

            switch (event) {
                case 'memberships.deleted':
                    if (message.user === controller.identity.emails[0]) {
                        controller.trigger('bot_room_leave', [bot, message]);
                    } else {
                        controller.trigger('user_room_leave', [bot, message]);
                    }
                    break;
                case 'memberships.created':
                    if (message.user === controller.identity.emails[0]) {
                        controller.trigger('bot_room_join', [bot, message]);
                    } else {
                        controller.trigger('user_room_join', [bot, message]);
                    }
                    break;
            }

            controller.trigger(event, [bot, message]);
        }
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


        bot.send = function(message, cb) {

            // clone the incoming message
            var ciscospark_message = {};
            for (var k in message) {
                ciscospark_message[k] = message[k];
            }

            // mutate the message into proper spark format
            ciscospark_message.roomId = message.channel;
            delete ciscospark_message.channel;

            controller.api.messages.create(ciscospark_message).then(function(message) {
                if (cb) cb(null, message);
            }).catch(function(err) {
                if (cb) cb(err);
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


module.exports = Sparkbot;
