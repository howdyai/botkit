var Botkit = require(__dirname + '/CoreBot.js');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');


function Connector(configuration) {

    var controller = Botkit(configuration || {});

     controller.defineBot(function(botkit, config) {
       var bot = {
           type: 'new_type_of_bot',
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
       }

       bot.reply = function(src, resp, cb) {

           if (typeof(resp) == 'string') {
               resp = {
                   text: resp
               }
           }

           resp.user = src.user;
           resp.channel = src.channel;

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

module.exports = Connector;
