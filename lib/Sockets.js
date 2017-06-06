var Botkit = require(__dirname + '/CoreBot.js');
var WebSocket = require('ws');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');


function SocketBot(configuration) {

    var controller = Botkit(configuration || {});

    var wss = new WebSocket.Server({
        port: configuration.socket_port || 8080,
     });

     wss.on('connection', function connection(ws) {

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
                     controller.trigger('reconnect',[bot, message]);
                 }
             }

             if (message.type == 'message') {
                 controller.receiveMessage(bot, message);
             } else if (message.type == 'hello' && !reconnected) {

                 var uid = message.user;
                 if (!uid) {
                     uid = guid();
                     bot.send({
                         type: 'hello',
                         user: uid,
                     });
                     controller.trigger(message.type,[bot, message]);
                 } else {
                     controller.trigger('welcome_back',[bot, message]);
                 }

             } else {
                 controller.trigger(message.type,[bot, message]);
             }


         });

       });

       ws.on('close', function(err) {
           console.log('CLOSED', err);
           bot.connected = false;
       });

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
               console.log('SEND', message);
               try {
                   console.log('sending type ahead');
                   bot.ws.send(JSON.stringify({typing:true}));
                   setTimeout(function() {
                       console.log('sending for reals');
                       try {
                         bot.ws.send(JSON.stringify(message));
                       } catch(err) {
                         console.error('ERROR SENDING', err);
                         if (cb) return cb(err, message);
                       }
                       if (cb) cb(null, message);

                   },1000);
               } catch(err) {
                   console.error('ERROR SENDING', err);
               }
           } else {
               console.log('not connected. wait to resend');
               setTimeout(function() {
                   bot.send(message, cb);
               }, 3000);
           }
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

module.exports = SocketBot;


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
