/**
 * Created by pawan.venugopal on 10/17/16.
 */

'use strict'

var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var GlipClient = require(__dirname + '/glip.js');
var async = require('async');

function Glipbot(configuration) {
    
    //Create a core botkit bot
    var glip_botkit = Botkit(configuration || {});

    glip_botkit.defineBot(function (botkit, config) {
        var bot = {
            type: 'glip',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances
        };

        bot.configureIncomingWebhook = function(options){
            if(!options.url)
                throw new Error('no incoming webhook URL specified!');

            bot.config.incoming_webhook = options;

            return bot;
        };

        bot.sendWebhook = function(options, cb){
          if(!bot.config.incoming_webhook || !bot.config.incoming_webhook.url){
              botkit.debug('CANNOT SEND WEBHOOK!!');

              return cb && cb('No webhook url specified');
          }

          request.post(bot.config.incoming_webhook.url, function (err,resp,body){
              if(err){
                  botkit.debug('WEBHOOK ERROR', err);
                  return cb && cb(err);
              }
              botkit.debug('WEBHOOK SUCCESS', body);
              cb && cb(null, body);
          }).form({ payload: JSON.stringify(options)});
        };

        bot.startConversation = function (message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb){
            botkit.createConversation(this, message, cb);
        };

        bot.send = function (message, cb) {
            bot.api.post(message.channel, message.text);
        };



        bot.reply = function(src, resp, cb) {
            var msg ={};
            if(typeof(resp) == 'string'){
                msg.text = resp;
            }else {
                msg =resp;
            }

            msg.channel = src.channel;
            bot.say(msg, cb);
        };


        /**
         * This handles the particulars of finding an existing conversation or
         * topic to fit the message into...
         */
        bot.findConversation = function(message, cb) {
            //console.log('find conversation');
            console.log('find conversation: '+ JSON.stringify(message));
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            if(message.type == 'message' || message.type == 'slash_command') {
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
            }

            cb();
        };

        if(bot.config.incoming_webhook)
            bot.configureIncomingWebhook(config.incoming_webhook);


        bot.client = new GlipClient({
                host: config.host,
                port: config.port,
                user: config.email,
                password: config.password
        });
        bot.api = bot.client;

         bot.client.on('message', function(type, data){
             //console.log('on message');
             console.log("on message " + JSON.stringify(data));
             var message_type = 'message';

             if(data.hasOwnProperty('text'))
             {
                 if (data.text[0] == '/') {
                     message_type = 'slash_command';
                 }
             }

             var message = {
                 channel: data.group_id,
                 text: data.text,
                 user: data.creator_id,
                 type: message_type
             }

             botkit.receiveMessage(bot, message)

         });

        bot.api.start();

        return bot;

    });

    glip_botkit.setupWebserver = function(port, cb){
        if(!port) {
            throw new Error('Cannot start webserver without a port');
        }

        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        glip_botkit.config.port = port;
        glip_botkit.webserver = express();
        glip_botkit.webserver.use(bodyParser.json());
        glip_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        glip_botkit.webserver.use(express.static(__dirname + '/public'));


        var server = glip_botkit.webserver.listen(
            glip_botkit.config.port,
            function() {
                glip_botkit.log('** Starting webserver on port ' +
                    glip_botkit.config.port);
                if (cb) { cb(null, glip_botkit.webserver); }
            });


        return glip_botkit;
    };


    glip_botkit.createWebhookEndpoints = function(webserver, bot){

        glip_botkit.log('** Serving Webhooks endpoint for receiving messages ** ' +
            'webhooks at: http://MY_HOST:' + glip_botkit.config.port + '/glip/receive');

        webserver.post('/glip/receive', function(req,res){

            if(req.body.command){
                var message = {};

                for (var key in req.body){
                    message[key] = req.body[key];
                }

                console.log(message);
            }
        });


        glip_botkit.startTicking();

        return glip_botkit;
    };

    //handle events here
    glip_botkit.handelGlipEvents = function(){

        glip_botkit.log('** Setting up custom handlers for processing Glip messages');


        glip_botkit.on('message_received', function(bot, message) {
            console.log('message_received');
            console.log('message type: ' + message.type);

            if('message' == message.type){
                if(message.text){
                    message.text = message.text.trim();
                }
            } else {
                glip_botkit.trigger(message.type, [bot, message])
            }
            var data = {
                channel: parseInt(process.env.HUBOT_GLIP_ROOM),
                text: message.text,
                user: message.creator_id
            }

            return;

        });

    }

    glip_botkit.handelGlipEvents();

    return glip_botkit;

}




module.exports = Glipbot;

