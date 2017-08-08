var Botkit = require(__dirname + '/CoreBot.js');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var request = require('requestretry');
var clone = require('clone');

function TeamsBot(configuration) {
  var controller = Botkit(configuration || {});

  controller.api = require(__dirname + '/TeamsAPI.js')(configuration || {});

  controller.api.getToken(function(err) {
    if (err) {
      // this is a fatal error - could not create a Teams API client
      throw new Error(err);
    }
  });


  controller.defineBot(function(botkit, config) {
    var bot = {
      type: 'teams',
      api: controller.api,
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances
    };

    bot.startConversation = function(message, cb) {
      botkit.startConversation(this, message, cb);
    };

    bot.createConversation = function(message, cb) {
      botkit.createConversation(this, message, cb);
    };


    bot.channelLink = function(channel_info) {
      return '<a href="https://teams.microsoft.com/l/channel/' + channel_info.id + '/' + channel_info.name +'">' + channel_info.name + '</a>';
    }


    bot.startPrivateConversation = function(message, cb) {

      bot.createPrivateConversation(message, function(err, new_convo) {

        if (err) {
          cb(err);
        } else {
          new_convo.activate();
          cb(null, new_convo);
        }

      })

    }

    bot.createPrivateConversation = function(message, cb) {

      bot.openPrivateConvo(message, function(err, new_convo) {
        if (err) {
          cb(err);
        } else {
          message.original_message.conversation = new_convo;
          bot.createConversation(message, cb);
        }
      });

    }

     bot.openPrivateConvo = function(src,  cb) {

       var data = {
        bot: src.recipient,
        members: [src.original_message.from],
        channelData: src.channelData,
      };

       bot.api.createConversation(src.serviceUrl, data, cb);

    };

    bot.openConvo = function(src, members, cb) {

        var data = {
          isGroup: true,
          bot: src.recipient,
          members: members,
          channelData: src.channelData,
        };

        bot.api.createConveration(src.serviceUrl, data, cb);
    };


    bot.send = function(message, cb) {
      var serviceUrl = message.serviceUrl;

      var data = {
        type: 'message',
        recipient: message.recipient,
        from: message.from,
        text: message.text,
        attachments: message.attachments || null,
        attachmentLayout: message.attachmentLayout || 'list',
      };

      bot.api.addMessageToConversation(serviceUrl, message.conversation.id, data, cb);

    };

    bot.replyWithActivity = function(src, message, cb) {

     var data = {
       type: 'message',
       recipient: src.original_message.from,
       from: src.original_message.recipient,
       conversation: src.conversation,
       channelData: {
         notification: {
           alert: true
         }
       },
       text: message.text,
       summary: message.summary,
       attachments: message.attachments || null,
       attachmentLayout: message.attachmentLayout || 'list',
     };

      bot.api.addMessageToConversation(src.serviceUrl, src.conversation.id, data, cb);
    }


    bot.replyToComposeExtension = function(src, resp, cb){
      // console.log('src: ', src);
      src.http_res.send(resp)
      if(cb){
        cb();
      }
    }

    bot.replyInThread = function(src, resp, cb) {

      // can't clone theis, not needed for this type of messages.
      delete(src.http_res);
      var copy = clone(src);

      // make sure this does NOT include the activity id
      copy.original_message.conversation = src.channelData.channel;

      bot.reply(copy, resp, cb);

    }

    bot.reply = function(src, resp, cb) {
      if(src.type === 'composeExtension'){
        bot.replyToComposeExtension(src, resp, cb)
      }
      if (typeof resp == 'string') {
        resp = {
          text: resp
        };
      }

      resp.serviceUrl = src.original_message.serviceUrl;
      resp.from = src.original_message.recipient;
      resp.recipient = src.original_message.from;
      resp.channel = src.channel;
      resp.conversation = src.original_message.conversation;

      bot.say(resp, cb);
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


  controller.configureIncomingWebhook = function() {
    controller.webserver.post('/teams/receive', function(req, res) {

      var bot = controller.spawn({});
      var message = req.body;
      bot.serviceUrl = message.serviceUrl;

      controller.ingest(bot, message, res);

    });
  };

  controller.middleware.ingest.use(function(bot, message, res, next) {

      res.status(200);
      if (message.name != 'composeExtension/query') {
        // send a result back immediately
        res.send('');
      }

      message.http_res = res;
      next();

  });

  controller.middleware.normalize.use(function(bot, message, next) {

    message.user = message.original_message.from.id;
    message.channel = message.original_message.conversation.id;

    next();

  });


  controller.middleware.categorize.use(function(bot, message, next){

    if (message.type === 'invoke' && message.name === 'composeExtension/query'){
      message.type = 'composeExtension';
      var query_params = message.value.parameters.filter(function(f){
        return f.name == 'keyword';
      });
      if(query_params.length > 0){
        message.text = query_params[0].value;
      }
    }

    next();

  });


    controller.middleware.categorize.use(function(bot, message, next) {

      if (message.type == 'conversationUpdate') {

        console.log('got a conversation update event', JSON.stringify(message.channelData));
        if (message.original_message.membersAdded) {
          // replies to these end up in the right place
          for (var m = 0; m < message.original_message.membersAdded.length; m++) {

             // clone the message
             // and copy this member into the from list
            delete(message.http_res); // <-- that can't be cloned safely
            var copy = clone(message);
            copy.from = message.original_message.membersAdded[m];
            copy.user = copy.from.id;

            if (copy.user == message.original_message.recipient.id) {
              copy.type = 'bot_channel_join';
            } else {
              copy.type = 'user_channel_join';
            }

            // restart the categorize process for the newly cloned messages
            controller.categorize(bot, copy);

          }

        } else if (message.original_message.membersRemoved) {

          // replies to these end up in the right place
          for (var m = 0; m < message.original_message.membersRemoved.length; m++) {

             // clone the message
             // and copy this member into the from list
            delete(message.http_res); // <-- that can't be cloned safely
            var copy = clone(message);
            copy.from = message.original_message.membersAdded[m];
            copy.user = copy.from.id;

            if (copy.user == message.original_message.recipient.id) {
              copy.type = 'bot_channel_leave';
            } else {
              copy.type = 'user_channel_leave';
            }

            // restart the categorize process for the newly cloned messages
            controller.categorize(bot, copy);
          }

          next();
        } else if (message.original_message.channelData && message.original_message.channelData.eventType) {
          // channelCreated
          // channelDeleted
          // channelRenamed
          // teamRenamed
          message.type = message.original_message.channelData.eventType;

          // replies to these end up in general
          next();
        }

      } else {
        next();
      }
    });


  controller.middleware.categorize.use(function(bot, message, next) {

    if (message.type == 'message') message.type = 'message_received';

    if (!message.conversation.isGroup && message.type == 'message_received') {
        message.type = 'direct_message';
    } else if (message.conversation.isGroup && message.type == 'message_received') {

        // start by setting this to a mention, meaning that the bot's name was _somewhere_ in the string
        message.type = 'mention';

        // check to see if this is a direct mention ,meaning bot was mentioned at start of string
        for (var e = 0; e < message.entities.length; e++) {
          var entity = message.entities[0];
          if (entity.type == 'mention' && message.text) {
            var pattern = new RegExp(message.recipient.id);
            if (entity.mentioned.id.match(pattern)) {
              var clean = new RegExp('^' + entity.text+'\\s+');

              if (message.text.match(clean)) {

                message.text = message.text.replace(clean,'');
                message.type = 'direct_mention';
              }
            }
          }
        }
    }

    next();
  });

  // controller.middleware.receive.use(function(bot, message, next) {
  //   console.log('RECEIVING ', message.type);
  //   next();
  //
  // });
  //
  // controller.middleware.send.use(function(bot, message, next) {
  //   console.log('SENDING ', JSON.stringify(message,null,2));
  //   next();
  // });

  controller.startTicking();
  return controller;
}

module.exports = TeamsBot;
