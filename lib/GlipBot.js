/**
 * Created by pawan.venugopal on 10/17/16.
 */

"use strict";

var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var GlipClient = require('glip-client');
var async = require('async');
require('events').EventEmitter.defaultMaxListeners = Infinity;


function Glipbot(configuration) {
    
    //Create a core botkit bot
    var glip_botkit = Botkit(configuration || {});

    glip_botkit.defineBot(function (botkit, config) {
        var bot = {
            type: 'glip',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
            identity: {
                name: '',
                id: null
            }
        };

        bot.configureIncomingWebhook = function(options){
            if(!options.url)
                throw new Error('No incoming webhook URL specified');

            bot.config.incoming_webhook = options;

            return bot;
        }

        bot.sendWebhook = function (options, cb) {
            if(!bot.config.incoming_webhook || !bot.config.incoming_webhook.url){
                botkit.debug('CANNOT SEND WEBHOOK!!');

                return cb && cb('No Webhook url specified');
            }

            request.post(bot.config.incoming_webhook.url, function (err, res, body) {
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

        bot.startTyping = function(src){
          bot.reply(src, {type: 'typing'});
        };

        bot.replyWithTyping = function(src,resp, cb){
            var text;

            if(typeof(resp) == 'string'){
                text = resp;
            }else {
                text = resp.text;
            }

            var typingLength = 1200/60 * text.length;
            typingLength = typingLength > 2000 ? 2000 : typingLength;

            bot.startTyping(src);
            setTimeout(function(){
                bot.reply(src, resp, cb);
            }, typingLength);
        };

        bot.send = function (message, cb) {
            bot.api.posts().post(
                { groupId: message.channel,
                  text: message.text
                }).then(function(response){
                    cb && cb();

            }).catch(function(err){
                console.log(err);
            });
        };

        bot.reply = function(src, resp, cb) {
            var msg ={};
            if(typeof(resp) == 'string'){
                msg.text = resp;
            }else {
                msg =resp;
            }

            msg.user = src.user;
            msg.channel = src.channel;

            bot.say(msg, cb);
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
                            if(message.text){
                                message.text = message.text.trim();
                            }
                            cb(botkit.tasks[t].convos[c]);
                            return ;
                        }
                    }
                }

            cb();
        };



        var glipClient = new GlipClient({
            server: config.server,
            appKey: config.appKey,
            appSecret: config.appSecret,
            appName: config.appName,
            appVersion: config.appVersion
        });

        bot.client = glipClient;

        bot.api = bot.client;

        bot.startRTM = function(cb) {
            var message = null;
            bot.api.authorize({
                username: config.username,
                password: config.password,
                extension: config.extension
            }).then(function(response){

                bot.api.persons().get({ personId: '~' }).then(function (response) {
                    bot.identity = {
                        id: response.id,
                        name: response.firstName + " " + response.lastName
                    };
                });


                bot.api.posts().subscribe(function(data){
                    console.log(data);
                    try{
                        message = {
                            channel: data.groupId,
                            text: data.text,
                            user: data.creatorId,
                            type: 'TextMessage'
                        }
                    } catch (err){
                        console.log('** Received Bad JSON **');
                    }

                    if(message != null){
                        botkit.receiveMessage(bot, message)
                    }
                });

                botkit.startTicking();
                cb && cb(null, bot, response);
            });

        };

        if(bot.config.incoming_webhook)
            bot.configureIncomingWebhook(config.incoming_webhook);


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
            'webhooks at: http://localhost:' + glip_botkit.config.port + '/glip/receive');


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

    glip_botkit.handelGlipEvents = function(){

        glip_botkit.log('** Setting up custom handlers for processing Glip messages');
        glip_botkit.on('message_received', function(bot, message) {

            if(message.user == bot.identity.id){
                return false;
            }
            else {

                if('TextMessage' == message.type){
                    if(message.text){
                        message.text = message.text.trim();
                    }
                } else if('direct_mention' == message.type) {
                    message.text = message.text.split('</a>')[1].trim();
                }

                return ;

            }

        });

    }

    glip_botkit.handelGlipEvents();

    return glip_botkit;

}




module.exports = Glipbot;

