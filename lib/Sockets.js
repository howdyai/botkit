var Botkit = require(__dirname + '/CoreBot.js');
var WebSocket = require('ws');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var http = require('http');

function SocketBot(configuration) {

    var controller = Botkit(configuration || {});



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

                console.log('received: %s', message);

                var message = JSON.parse(message);
                bot.findConversation(message, function(convo) {
                    var reconnected = false;
                    if (convo) {
                        if (convo.task.bot.connected) {
                            console.log('WEIRD STILL CONNECTED?');
                        } else {
                            console.log('BOT JUST RECONNECTED');
                            convo.task.bot.ws = bot.ws;
                            convo.task.bot.connected = true;
                            reconnected = true;
                            controller.trigger('reconnect', [bot, message]);
                        }
                    }

                    if (message.type == 'message') {
                        controller.ingest(bot, message);
                    } else {
                        controller.trigger(message.type, [bot, message]);
                    }
                });

            });

            ws.on('close', function(err) {
                console.log('CLOSED', err);
                bot.connected = false;
            });

        });

        var interval = setInterval(function ping() {
            wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    console.log('!!!!!!!!!!!!!!!!!!!! ws terminated !!!!!!!!!!!!!!!!!!!!');
                    return ws.terminate();
                }
                //  if (ws.isAlive === false) return ws.terminate()
                ws.isAlive = false;
                ws.ping('', false, true);
            });
        }, 30000);
    };

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
            if (bot.connected) {
                try {
                    bot.ws.send(JSON.stringify(message));
                } catch (err) {
                    console.error('ERROR SENDING', err);
                    if (cb) return cb(err, message);
                }
                if (cb) cb(null, message);

            } else {

                console.log('not connected. wait to resend');
                setTimeout(function() {
                    bot.send(message, cb);
                }, 3000);
            }
        };

        bot.startTyping = function() {
            if (bot.connected) {
                bot.ws.send(JSON.stringify({
                    typing: true
                }));
            }
        };

        bot.typingDelay = function(message) {

            return new Promise(function(resolve, reject) {

                var textLength;
                if (message.text) {
                    textLength = message.text.length;
                } else {
                    textLength = 80; //default attachement text length
                }

                var avgWPM = 150;
                var avgCPM = avgWPM * 7;

                var typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 5000);

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

                bot.send(resp, cb);
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

            if (resp.typing || controller.config.useTypingDelay) {
              bot.replyWithTyping(src, resp, cb);
            } else {
              bot.send(resp, cb);
            }
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

    controller.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        var static_dir = process.cwd() + '/public';

        if (controller.config && controller.config.webserver && controller.config.webserver.static_dir)
            static_dir = controller.config.webserver.static_dir;

        controller.config.port = port;

        controller.webserver = express();
        controller.webserver.use(bodyParser.json());
        controller.webserver.use(bodyParser.urlencoded({
            extended: true
        }));
        controller.webserver.use(express.static(static_dir));

        var server = controller.webserver.listen(
            controller.config.port,
            controller.config.hostname,
            function() {
                controller.log('** Starting webserver on port ' +
                    controller.config.port);
                if (cb) {
                    cb(null, controller.webserver);
                }
            });

        return controller;

    };


    return controller;

}

module.exports = SocketBot;
