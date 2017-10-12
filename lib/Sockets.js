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

                var message = JSON.parse(message);
                controller.ingest(bot, message, ws);

            });

            ws.on('close', function(err) {
                console.log('CLOSED', err);
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

      bot.findConversation(message, function(convo) {
          if (convo) {
            if (bot.ws) {
              if (!convo.task.bot.connected) {
                  convo.task.bot.ws = bot.ws;
                  convo.task.bot.connected = true;
                  controller.trigger('reconnect', [bot, message]);
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
                try {
                    if (bot.ws) {
                      bot.ws.send(JSON.stringify(message));
                    } else {
                      bot.http_response.json(message);
                    }
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
                    type: 'typing',
                }));
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

                  typingLength = Math.min(Math.floor(textLength / (avgCPM / 60)) * 1000, 5000);
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


    controller.handleWebhookPayload = function(req, res) {

        var payload = req.body;
        controller.ingest(controller.spawn({}), payload, res);

    }



    return controller;

}

module.exports = SocketBot;
