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


        bot.startConversation = function (message, cb) {
            botkit.startConversation(this, message, cb);
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
                bot.api.posts().subscribe(function(data){
                    try{
                        message = {
                            channel: data.post.groupId,
                            text: data.post.text,
                            user: data.post.creatorId,
                            type: 'message'
                        }
                    } catch (err){
                        console.log('** Received Bad JSON **');
                    }

                    if(message != null){
                        botkit.receiveMessage(bot, message)
                    }
                });
            });

        };

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

            if('message' == message.type){
                if(message.text){
                    message.text = message.text.trim();
                }
            } else if('direct_mention' == message.type) {
                message.text = message.text.split('</a>')[1].trim();
            }

            return ;

        });

    }

    glip_botkit.handelGlipEvents();

    return glip_botkit;

}




module.exports = Glipbot;

