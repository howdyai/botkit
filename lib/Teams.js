var Botkit = require(__dirname + '/CoreBot.js');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var request = require('request');

function TeamsBot(configuration) {

    var controller = Botkit(configuration || {});

    var token = null;

    request({
        uri: 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
        form: {
            grant_type: 'client_credentials',
            client_id: '69b4bbd8-db62-4657-a944-5b380edcb0a2',
            client_secret: '7B8xGpEYuo0e7wODuqxdamk',
            scope: 'https://api.botframework.com/.default'
        }
    }, function(err, res, body) {
        var json = JSON.parse(body);
        token = json.access_token;
        console.log('TOKEN', token);
    });


     controller.defineBot(function(botkit, config) {
       var bot = {
           type: 'teams',
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

           var serviceUrl = message.serviceUrl;

           var serviceUrl = serviceUrl + '/v3/conversations/' + message.conversation.id + '/activities';

           var data = {
                 "type": "message",
                 recipient: message.recipient,
                 from: message.from,
                 "conversation": message.conversation,
                 "textFormat": "string",
                 "text": message.text,
               };

               request({
                   method: 'POST',
                   json: true,
                   headers: {
                       'content-type': 'application/json',
                       'Authorization': 'Bearer ' + token,
                   },
                   body: data,
                   uri: serviceUrl
               },
               function(err, res, body) {

                   console.log(err,body);

               });

       }

       bot.reply = function(src, resp, cb) {

           if (typeof(resp) == 'string') {
               resp = {
                   text: resp
               }
           }

           resp.serviceUrl = src.original_message.serviceUrl;
           resp.from = src.original_message.recipient;
           resp.recipient = src.original_message.from;
           resp.channel = src.channel;
           resp.conversation = src.original_message.conversation;

           bot.send(resp, cb);

       }

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

         var static_dir =  process.cwd() + '/public';

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


     return controller;

}

module.exports = TeamsBot;
