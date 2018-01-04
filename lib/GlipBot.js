/**
 * Created by pawan.venugopal on 10/17/16.
 */

"use strict";

var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var async = require('async');
var btoa = require('btoa');
const RC = require('ringcentral');
require('events').EventEmitter.defaultMaxListeners = Infinity;


var platform, subscription, rcsdk;

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
            botkit.debug('SAY', message);

            platform.post('/glip/posts',{
                groupId: message.channel,
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

        return bot;

    });

    glip_botkit.createWebhookEndpoints = function(webserver, bot, cb){

        glip_botkit.log('** Serving Webhooks endpoint for receiving messages ** ' +
            'webhooks at:' + glip_botkit.config.apiRoot + ':' + glip_botkit.config.port + '/glip/receive');


        webserver.post('/glip/receive', function(req,res){
            var validationToken = req.get('Validation-Token');
            if(validationToken)
            {
                console.log("Inside Validation Token");
                res.setHeader('Validation-Token', validationToken);
                res.statusCode = 200;
                res.end();
            } else {
                res.status(200)
                glip_botkit.handleWebhookPayload(bot, req, res);
            }
        });

        return glip_botkit;
    };

    glip_botkit.handleWebhookPayload = function(bot, req, res){
        var payload = req.body;
        bot.res = res;
        glip_botkit.ingest(bot, payload, res);
    }



    glip_botkit.middleware.ingest.use(function(bot, message, res, next){
        if (res && res.statusCode) {
            // this is an http response
            // always send a 200
            res.status(200);
        }
        next();

    });

    glip_botkit.middleware.normalize.use(function(bot, message, next){
            message.channel = message.raw_message.body.groupId;
            message.user = message.raw_message.body.creatorId;
            message.text = message.raw_message.body.text;
            message.type = message.raw_message.body.type;

        next();
    });


    glip_botkit.middleware.categorize.use(function(bot, message, next){
        if(message.user == bot.identity.id){
            return false
        } else{

            if(message.type == "TextMessage")
            {
                message.type = "message_received",
                    message.text = message.text.trim();
            } else if('direct_mention' == message.type){
                message.text = message.text.split('</a>')[1].trim();
            }
            next();
        }
    });


    glip_botkit.middleware.receive.use(function(bot, message, next){
        next();
    });

    glip_botkit.middleware.format.use(function(bot, message, platform_message, next) {

        for (var key in message) {
            platform_message[key] = message[key];
        }
        next();

    });


    glip_botkit.configureGlipApp = function(glip_app_config, cb){

        glip_botkit.log('** Configuring app as a Glip App!' + glip_app_config.clientId);
        if (!glip_app_config || !glip_app_config.clientId ||
            !glip_app_config.clientSecret) {
            throw new Error('Missing oauth config details');
        } else {
            glip_botkit.config.clientId = glip_app_config.clientId;
            glip_botkit.config.clientSecret = glip_app_config.clientSecret;
            glip_botkit.config.apiRoot = glip_app_config.apiRoot;
            if (glip_app_config.redirectUri) glip_botkit.config.redirectUri = glip_app_config.redirectUri;
            if (cb) cb(null);
        }

        return glip_botkit;
    }

    glip_botkit.createOauthEndpoints = function (webserver, bot, accessToken, callback) {


        console.log(glip_botkit.config.apiRoot);

        rcsdk = new RC({
            server: glip_botkit.config.apiRoot,
            appKey: glip_botkit.config.clientId,
            appSecret: glip_botkit.config.clientSecret
        });

        platform = rcsdk.platform();


        if (!glip_botkit.config.clientId) {
            throw new Error(
                'Cannot create oauth endpoints without clientId');
        }
        if (!glip_botkit.config.clientSecret) {
            throw new Error(
                'Cannot create oauth endpoints without clientSecret');
        }


        var startSubscription = function (){
            var requestData = {
                "eventFilters": [
                    "/restapi/v1.0/glip/posts",
                    "/restapi/v1.0/glip/groups"
                ],
                "deliveryMode": {
                    "transportType": "WebHook",
                    "address": glip_botkit.config.redirectUri + "/glip/receive"
                },
                "expiresIn": 630720000
            };

            return platform.post('/subscription', requestData)
                .then(function (subscriptionResponse) {
                    console.log('Subscription Response: ', subscriptionResponse.json());
                    subscription = subscriptionResponse;
                    glip_botkit.config.subscriptionId = subscriptionResponse.id;
            }).catch(function (e) {
                    console.error(e);
                    throw e;
            });

        };

        var getBotIdentity = function(bot){
            platform.get('/account/~/extension/~')
                .then(function(extensionInfo){
                    var identity = JSON.parse(extensionInfo.text());
                    bot.identity = {
                        id: identity.id,
                        name: identity.contact.firstName
                    }
                }).catch(function(e){
                    console.error(e);
                    throw e;
                })
        };

      if (accessToken == ''){
        webserver.get('/oauth', function (req, res) {
              if(!req.query.code){
                  res.status(500);
                  res.send({"Error": "Looks like we're not getting code."});
                  console.log("Looks like we're not getting code.");
              }else {
                  platform.login({
                      code : req.query.code,
                      redirectUri : glip_botkit.config.redirectUri + '/oauth'
                  }).then(function(authResponse){
                      var obj = authResponse.json();
                      glip_botkit.config.accessToken = obj.access_token;
                      console.log("Access Token: " + obj.access_token);
                      res.send(authResponse.json())
                      getBotIdentity(bot);
                      startSubscription();
                    callback(null, req, res, obj.access_token)
                  }).catch(function(e){
                      console.error(e)
                    callback(e, null, null, null)
                  })
              }
        })
      }
      else{
        var data = platform.auth().data();
        data.token_type = "bearer"
        data.expires_in = 630720000
        data.access_token = accessToken
        platform.auth().setData(data)
        getBotIdentity(bot);
      }
    }

    glip_botkit.getAccessToken = function() {
      return glip_botkit.config.accessToken;
    }

    glip_botkit.getRCPlatform = function () {
      return platform;
    }

    glip_botkit.startTicking();
    return glip_botkit;

}


module.exports = Glipbot;
