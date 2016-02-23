/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _______..___  ___.   ______     ______     ______  __    __  .______     ______   .___________.
    /       ||   \/   |  /  __  \   /  __  \   /      ||  |  |  | |   _  \   /  __  \  |           |
   |   (----`|  \  /  | |  |  |  | |  |  |  | |  ,----'|  |__|  | |  |_)  | |  |  |  | `---|  |----`
    \   \    |  |\/|  | |  |  |  | |  |  |  | |  |     |   __   | |   _  <  |  |  |  |     |  |     
.----)   |   |  |  |  | |  `--'  | |  `--'  | |  `----.|  |  |  | |  |_)  | |  `--'  |     |  |     
|_______/    |__|  |__|  \______/   \______/   \______||__|  |__| |______/   \______/      |__|     
                                                                                                    
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require(__dirname+'/CoreBot.js');
var request = require('request');
var smooch_api = require('smooch-core');
var express = require('express'),
    bodyParser = require("body-parser");

function Smoochbot(configuration) {

  // Create a core botkit bot
  var smooch_botkit = Botkit(configuration||{});

  // customize the bot definition, which will be used when new connections
  // spawn!
  smooch_botkit.defineBot(require(__dirname+'/SmoochBot_worker.js'));

  // set up configuration for smooch API
  smooch_botkit.configureSmooch = function(smooch_config,cb) {

    smooch_botkit.log('** Configuring app as a Smooch bot!');
    if (!smooch_config || !smooch_config.appToken || !smooch_config.key || !smooch_config.secret) {
      throw new Error('Missing Smooch config details',bot);
    } else {
      smooch_botkit.config.appToken = smooch_config.appToken;
      smooch_botkit.config.key = smooch_config.key;
      smooch_botkit.config.secret = smooch_config.secret;

      if (cb) cb(null,bot);
    }

    return smooch_botkit;

  }

  // set up a web route that is a landing page
  smooch_botkit.createHomepageEndpoint = function(webserver) {

    smooch_botkit.log('** Serving app landing page at : http://MY_HOST:' + smooch_botkit.config.port + '/');

    // FIX THIS!!!
    // this is obvs not right.
    webserver.get('/',function(req,res) {

      res.send('Howdy!');

    });

    return smooch_botkit;

  }

  // set up a web route for receiving outgoing webhooks and/or slash commands
  smooch_botkit.createWebhookEndpoints = function(webserver) {

    smooch_botkit.log('** Serving webhook endpoints for Smooch events at: http://MY_HOST:' + smooch_botkit.config.port + '/smooch/');
    webserver.post('/smooch/',function(req,res) {
      smooch_botkit.debug("RECEIVED A WEBHOOK");

      for(var i=0; i<req.body.messages.length; i++) {
        var msg = req.body.messages[i];
        var message = {};

        message.user = msg.authorId;
        message.name = msg.name;
        message.text = msg.text;
        message.channel = "smooch";
        message.type = "message";

        res.status(200);

        var bot = smooch_botkit.spawn(smooch_botkit.config);
        bot.res = res;

        if(req.body.trigger == "message:appUser") {
          smooch_botkit.receiveMessage(bot, message);
        }

        res.send();
      }
    });

    return smooch_botkit;
  }

  smooch_botkit.setupWebserver = function(port,cb) {

    if (!port) {
      throw new Error("Cannot start webserver without a port");
    }
    if (isNaN(port)) {
      throw new Error("Specified port is not a valid number");
    }

    smooch_botkit.config.port = port;

    smooch_botkit.webserver = express();
    smooch_botkit.webserver.use(bodyParser.json());
    smooch_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
    smooch_botkit.webserver.use(express.static(__dirname + '/public'));

    var server = smooch_botkit.webserver.listen(smooch_botkit.config.port, function () {
      smooch_botkit.log('** Starting webserver on port ' + smooch_botkit.config.port);
      if (cb) { cb(null,smooch_botkit.webserver); }
    });

    return smooch_botkit;

  }

  return smooch_botkit;
}

module.exports = Smoochbot;