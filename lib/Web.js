var Botkit = require(__dirname + '/CoreBot.js');
var WebSocket = require('ws');

function WebBot(configuration) {

    var controller = Botkit(configuration || {});

    if (controller.config.typingDelayFactor === undefined) {
        controller.config.typingDelayFactor = 1;
    }

    controller.excludeFromConversations(['hello', 'welcome_back', 'reconnect']);

    controller.openSocketServer = function(server) {

        // create the socket server along side the existing webserver.
        var wss = new WebSocket.Server({
            server
        });

        function heartbeat() {
            this.isAlive = true;
        }

        wss.on('connection', function connection(ws) {
            ws.isAlive = true;
            ws.on('pong', heartbeat);
            // search through all the convos, if a bot matches, update its ws
            var bot = controller.spawn();
            bot.ws = ws;
            bot.connected = true;

            ws.on('message', function incoming(message) {

                var message = JSON.parse(message);
                controller.ingest(bot, message, ws);

            });

            ws.on('error', (err) => console.error('Websocket Error: ', err));

            ws.on('close', function(err) {
                bot.connected = false;
            });

        });

        var interval = setInterval(function ping() {
            wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                //  if (ws.isAlive === false) return ws.terminate()
                ws.isAlive = false;
                ws.ping('', false, true);
            });
        }, 30000);
    };


    controller.middleware.ingest.use(function(bot, message, reply_channel, next) {

        // this could be a message from the WebSocket
        // or it might be coming from a webhook.
        // configure the bot appropriately so the reply goes to the right place!
        if (!bot.ws) {
            bot.http_response = reply_channel;
        }

        // look for an existing conversation for this user/channel combo
        // why not just pass in message? because we only care if there is a conversation  ongoing
        // and we might be dealing with "silent" message that would not otherwise match a conversation
        bot.findConversation({
            user: message.user,
            channel: message.channel
        }, function(convo) {
            if (convo) {
                if (bot.ws) {
                    // replace the websocket connection
                    convo.task.bot.ws = bot.ws;
                    convo.task.bot.connected = true;
                    if (message.type == 'hello' || message.type == 'welcome_back') {
                        message.type = 'reconnect';
                    }
                } else {

                    // replace the reply channel in the active conversation
                    // this is the one that gets used to send the actual reply
                    convo.task.bot.http_response = bot.http_response;
                }
            }
            next();
        });
    });

    controller.middleware.categorize.use(function(bot, message, next) {

        if (message.type == 'message') {
            message.type = 'message_received';
        }

        next();

    });

    // simple message clone because its already in the right format!
    controller.middleware.format.use(function(bot, message, platform_message, next) {

        for (var key in message) {
            platform_message[key] = message[key];
        }
        if (!platform_message.type) {
            platform_message.type = 'message';
        }
        next();

    });


    controller.defineBot(function(botkit, config) {
        var bot = {
            type: 'socket',
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
            if (bot.connected || !bot.ws) {
                if (bot.ws) {
                    try {
                        if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
                            bot.ws.send(JSON.stringify(message), function(err) {
                                if (cb) {
                                    return cb(err, message);
                                }
                            });
                        } else {
                            console.error('Cannot send message to closed socket');
                        }
                    } catch (err) {
                        return cb(err);
                    }
                } else {
                    try {
                        bot.http_response.json(message);
                        if (cb) {
                            cb(null, message);
                        }
                    } catch (err) {
                        if (cb) {
                            return cb(err, message);
                        } else {
                            console.error('ERROR SENDING', err);
                        }
                    }
                }
            } else {
                setTimeout(function() {
                    bot.send(message, cb);
                }, 3000);
            }
        };

        bot.startTyping = function() {
            if (bot.connected) {
                try {
                    if (bot.ws && bot.ws.readyState === WebSocket.OPEN) {
                        bot.ws.send(JSON.stringify({
                            type: 'typing'
                        }), function(err) {
                            if (err) {
                                console.error('startTyping failed: ' + err.message);
                            }
                        });
                    } else {
                        console.error('Socket closed! Cannot send message');
                    }
                } catch (err) {
                    console.error('startTyping failed: ', err);
                }
            }
        };

        bot.typingDelay = function(message) {

            return new Promise(function(resolve, reject) {
                var typingLength = 0;
                if (message.typingDelay) {
                    typingLength = message.typingDelay;
                } else {
                    var textLength;
                    if (message.text) {
                        textLength = message.text.length;
                    } else {
                        textLength = 80; //default attachement text length
                    }

                    var avgWPM = 150;
                    var avgCPM = avgWPM * 7;

                    typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 2000) * controller.config.typingDelayFactor;
                }

                setTimeout(function() {
                    resolve();
                }, typingLength);
            });

        };

        bot.replyWithTyping = function(src, resp, cb) {

            bot.startTyping();
            bot.typingDelay(resp).then(function() {

                if (typeof(resp) == 'string') {
                    resp = {
                        text: resp
                    };
                }

                resp.user = src.user;
                resp.channel = src.channel;
                resp.to = src.user;

                bot.say(resp, cb);
            });
        };


        bot.reply = function(src, resp, cb) {

            if (typeof(resp) == 'string') {
                resp = {
                    text: resp
                };
            }

            resp.user = src.user;
            resp.channel = src.channel;
            resp.to = src.user;

            if (resp.typing || resp.typingDelay || controller.config.replyWithTyping) {
                bot.replyWithTyping(src, resp, cb);
            } else {
                bot.say(resp, cb);
            }
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

            return new Promise(function(resolve, reject) {
                var instance = {
                    identity: {},
                    team: {},
                };

                if (bot.identity) {
                    instance.identity.name = bot.identity.name;
                    instance.identity.id = bot.identity.id;

                    instance.team.name = bot.identity.name;
                    instance.team.url = bot.identity.root_url;
                    instance.team.id = bot.identity.name;

                } else {
                    instance.identity.name = 'Botkit Web';
                    instance.identity.id = 'web';
                }

                if (cb) cb(null, instance);
                resolve(instance);

            });
        };

        bot.getMessageUser = function(message, cb) {
            return new Promise(function(resolve, reject) {
                // normalize this into what botkit wants to see
                controller.storage.users.get(message.user, function(err, user) {

                    if (!user) {
                        user = {
                            id: message.user,
                            name: 'Unknown',
                            attributes: {},
                        };
                    }

                    var profile = {
                        id: user.id,
                        username: user.name,
                        first_name: user.attributes.first_name || '',
                        last_name: user.attributes.last_name || '',
                        full_name: user.attributes.full_name || '',
                        email: user.attributes.email, // may be blank
                        gender: user.attributes.gender, // no source for this info
                        timezone_offset: user.attributes.timezone_offset,
                        timezone: user.attributes.timezone,
                    };

                    if (cb) {
                        cb(null, profile);
                    }
                    resolve(profile);
                });
            });

        };


        return bot;
    });

    controller.handleWebhookPayload = function(req, res) {
        var payload = req.body;
        controller.ingest(controller.spawn({}), payload, res);
    };

    // change the speed of typing a reply in a conversation
    controller.setTypingDelayFactor = function(delayFactor) {
        controller.config.typingDelayFactor = delayFactor;
    };

    // Substantially shorten the delay for processing messages in conversations
    controller.setTickDelay(10);

    return controller;
}

module.exports = WebBot;
