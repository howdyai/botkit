var Botkit = require(__dirname + '/CoreBot.js');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var request = require('request');

function TeamsBot(configuration) {
  var controller = Botkit(configuration || {});

  var token = null;

  request(
    {
      uri: 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
      form: {
        grant_type: 'client_credentials',
        client_id: configuration.client_id,
        client_secret: configuration.client_secret,
        scope: 'https://api.botframework.com/.default'
      }
    },
    function(err, res, body) {
      var json = JSON.parse(body);
      token = json.access_token;
      console.log('TOKEN', token);
    }
  );

  controller.defineBot(function(botkit, config) {
    var bot = {
      type: 'teams',
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

    bot.openConvo = function(src, members, cb) {
        var serviceUrl = src.serviceUrl + 'v3/conversations';
        var data = {
          isGroup: true,
          bot: src.recipient,
          members: members,
          channelData: src.channelData,
          // title: 'new convo title',
        };

        console.log('MAKING REQUEST:');
        console.log(serviceUrl, data);

        request(
          {
            method: 'POST',
            json: true,
            headers: {
              'content-type': 'application/json',
              Authorization: 'Bearer ' + token
            },
            body: data,
            uri: serviceUrl
          },
          function(err, res, body) {
            if (body.error) {
              cb(body.error);
            } else {
              cb(err, body);
            }
          }
        );
    };

    bot.send = function(message, cb) {
      var serviceUrl = message.serviceUrl;

      var serviceUrl =
        serviceUrl +
        '/v3/conversations/' +
        message.conversation.id +
        '/activities';

      var data = {
        type: 'message',
        recipient: message.recipient,
        from: message.from,
      //  conversation: message.conversation,
        // textFormat: 'string',
        text: message.text,
        attachments: message.attachments
      };

      console.log('REQUEST TO',serviceUrl);

      request(
        {
          method: 'POST',
          json: true,
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: data,
          uri: serviceUrl
        },
        function(err, res, body) {
          console.log(err, body);
        }
      );
    };

    bot.replyInThread = function(src, resp, cb) {

      // make sure this does NOT include the activity id
      src.original_message.conversation = src.channelData.channel;

      bot.reply(src, resp, cb);

    }

    bot.reply = function(src, resp, cb) {
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

      bot.send(resp, cb);
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

    if (
      controller.config &&
      controller.config.webserver &&
      controller.config.webserver.static_dir
    )
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
        controller.log(
          '** Starting webserver on port ' + controller.config.port
        );
        if (cb) {
          cb(null, controller.webserver);
        }
      }
    );

    return controller;
  };

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

    message.user = message.from.id;
    message.channel = message.conversation.id;

    next();

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

  controller.middleware.receive.use(function(bot, message, next) {
    console.log('RECEIVING ', message.type);
    next();

  });


  return controller;
}

module.exports = TeamsBot;
