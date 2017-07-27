var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var crypto = require('crypto');

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
            console.log('Cisco Spark: My identity is', identity);
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
            controller.config.public_address = endpoint.hostname + (endpoint.port ? ':' + endpoint.port : '');
        }

    }

    if (!controller.config.secret) {
        console.log('WARNING: No secret specified. Source of incoming webhooks will not be validated. https://developer.ciscospark.com/webhooks-explained.html#auth');
        // throw new Error('secret parameter required to secure webhooks');
    }


    controller.resetWebhookSubscriptions = function() {
        controller.api.webhooks.list().then(function(list) {
            for (var i = 0; i < list.items.length; i++) {
                controller.api.webhooks.remove(list.items[i]).then(function(res) {
                    console.log('Removed subscription: ' + list.items[i].name);
                }).catch(function(err) {
                    console.log('Error removing subscription:', err);
                });
            }
        });
    };

    // set up a web route for receiving outgoing webhooks and/or slash commands
    controller.createWebhookEndpoints = function(webserver, bot, cb) {


        var webhook_name = controller.config.webhook_name || 'Botkit Firehose';

        controller.log(
            '** Serving webhook endpoints for Cisco Spark Platform at: ' +
            'http://' + controller.config.hostname + ':' + controller.config.port + '/ciscospark/receive');
        webserver.post('/ciscospark/receive', function(req, res) {
            res.sendStatus(200);
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

            console.log('Cisco Spark: incoming webhook url is ', hook_url);

            if (hook_id) {
                controller.api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: controller.config.secret,
                    name: webhook_name,
                }).then(function(res) {
                    console.log('Cisco Spark: SUCCESSFULLY UPDATED CISCO SPARK WEBHOOKS');
                    if (cb) cb();
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

                    console.log('Cisco Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS');
                    if (cb) cb();
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
            var hash = crypto.createHmac('sha1', controller.config.secret).update(JSON.stringify(req.body)).digest('hex');

            if (signature != hash) {
                console.error('WARNING: Webhook received message with invalid signature. Potential malicious behavior!');
                return false;
            }
        }

        if (req.body.resource == 'messages' && req.body.event == 'created') {

            // console.log('RAW MESSAGE',req.body);
            controller.api.messages.get(req.body.data).then(function(message) {

                // console.log('DECRYPTED MESSAGE', message);
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
                    var pattern = new RegExp('^(\<p\>)?\<spark\-mention .*?data\-object\-id\=\"' + controller.identity.id + '\".*\>.*?\<\/spark\-mention\>', 'im');
                    if (!message.original_message.html.match(pattern)) {
                        var encoded_id = controller.identity.id;
                        var decoded = new Buffer(encoded_id, 'base64').toString('ascii');

                        // this should look like ciscospark://us/PEOPLE/<id string>
                        var matches;
                        if (matches = decoded.match(/ciscospark\:\/\/.*\/(.*)/im)) {
                            pattern = new RegExp('^(\<p\>)?\<spark\-mention .*?data\-object\-id\=\"' + matches[1] + '\".*\>.*?\<\/spark\-mention\>', 'im');
                        }
                    }
                    var action = message.original_message.html.replace(pattern, '');


                    // strip the remaining HTML tags
                    action = action.replace(/\<.*?\>/img, '');

                    // strip remaining whitespace
                    action = action.trim();

                    // replace the message text with the the HTML version
                    message.text = action;

                } else {
                    var pattern = new RegExp('^' + controller.identity.displayName + '\\s+', 'i');
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
                        controller.trigger('bot_space_leave', [bot, message]);
                    } else {
                        controller.trigger('user_space_leave', [bot, message]);
                    }
                    break;
                case 'memberships.created':
                    if (message.user === controller.identity.emails[0]) {
                        controller.trigger('bot_space_join', [bot, message]);
                    } else {
                        controller.trigger('user_space_join', [bot, message]);
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
                    convo.source_message.user = message_options.toPersonEmail;
                    convo.source_message.channel = sent_message.roomId;

                    convo.context.user = convo.source_message.user;
                    convo.context.channel = convo.source_message.channel;

                });
                cb(null, convo);
            });
        };


        /**
         * Convenience method for creating a DM based on a personId instead of email
         */
        bot.startPrivateConversationWithPersonId = function(personId, cb) {

            controller.api.people.get(personId).then(function(identity) {
                bot.startPrivateConversation({user: identity.emails[0]}, cb);
            }).catch(function(err) {
                cb(err);
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

            // mutate the message into proper spark format
            ciscospark_message.roomId = message.channel;
            delete ciscospark_message.channel;

            // default the markdown field to be the same as tex.
            if (ciscospark_message.text && !ciscospark_message.markdown) {
                ciscospark_message.markdown = ciscospark_message.text;
            }

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

        bot.retrieveFileInfo = function(url, cb) {
            request.head({
                url: url,
                headers: {
                    'Authorization': 'Bearer ' + controller.config.ciscospark_access_token
                },
            }, function(err, response, body) {

                if (!err) {
                    var obj = response.headers;
                    if (obj['content-disposition']) {
                        obj.filename = obj['content-disposition'].replace(/.*filename=\"(.*)\".*/gi, '$1');
                    }
                    cb(null, obj);
                } else {
                    cb(err);
                }

            });
        };

        bot.retrieveFile = function(url, cb) {

            request({
                url: url,
                headers: {
                    'Authorization': 'Bearer ' + controller.config.ciscospark_access_token
                },
                encoding: 'binary',
            }, function(err, response, body) {

                cb(err, body);

            });

        };

        return bot;

    });

    controller.startTicking();

    return controller;

}


module.exports = Sparkbot;
