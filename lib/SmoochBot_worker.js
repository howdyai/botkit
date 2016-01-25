/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _______..___  ___.   ______     ______     ______  __    __  .______     ______   .___________.
    /       ||   \/   |  /  __  \   /  __  \   /      ||  |  |  | |   _  \   /  __  \  |           |
   |   (----`|  \  /  | |  |  |  | |  |  |  | |  ,----'|  |__|  | |  |_)  | |  |  |  | `---|  |----`
    \   \    |  |\/|  | |  |  |  | |  |  |  | |  |     |   __   | |   _  <  |  |  |  |     |  |     
.----)   |   |  |  |  | |  `--'  | |  `--'  | |  `----.|  |  |  | |  |_)  | |  `--'  |     |  |     
|_______/    |__|  |__|  \______/   \______/   \______||__|  |__| |______/   \______/      |__|     
                                                                                                    
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var request = require('request');
var SmoochCore = require('smooch-core');

module.exports = function(botkit,config) {

  var bot = {};
  bot.botkit = botkit;
  bot.config = config||{};

  // make these available at the bot level where they will be used by developers
  bot.utterances = botkit.utterances;

  bot.api = new SmoochCore({
    keyId: botkit.config.key,
    secret: botkit.config.secret,
    scope: "app"
  });

  bot.createWebHook = function() {
    if (!bot.botkit.config.incoming_webhook.url) {
      throw new Error('No incoming webhook URL specified!');
    }

    botkit.debug(bot.api);
    bot.api.webhooks.create({"target":bot.botkit.config.incoming_webhook.url,"triggers":["message"]}).then(function(respponse) {
      botkit.debug("Created a webhook");
    });            
  }

  // set up API to send incoming webhook
  bot.configureIncomingWebhook = function() {
    if (!bot.botkit.config.incoming_webhook.url) {
      throw new Error('No incoming webhook URL specified!');
    }

    //List webhooks
    bot.api.webhooks.list().then(function(response) {
      botkit.debug("Found " + response.webhooks.length + " web hooks...");
      if(response.webhooks.length) {
        for(var i = 0; i<response.webhooks.length; i++) {
          var hook = response.webhooks[i];
          botkit.debug(hook);
          botkit.debug("Will delete the hook");
          bot.api.webhooks.delete(hook._id).then(function(response) {
            botkit.debug("Deleted a webhook");
          });
        }
      }

      botkit.debug("Should crteate a hook");
      bot.createWebHook();
    });

    return bot;
  }

  bot.say = function(message,cb) {
    botkit.debug('SAY ',message);

    message.role = "appMaker";
    message.name = botkit.config.bot_name;
    message.avatarUrl = botkit.config.avatar_url;

    bot.api.conversations.sendMessage(message.user, message).then(function(response) {
      cb(null, response);
    }).catch(function(e) {
      botkit.debug(e);
    })
  }

  bot.reply = function(src,resp,cb) {

    var msg = {};

    if (typeof(resp)=='string') {
        msg.text = resp;
        msg.user = src.user;
    } else {
      msg = resp;
      msg.user = src.user;
    }

    bot.say(msg,cb);
  }

  bot.startConversation = function(message, cb) {
    botkit.startConversation(this, message, cb);
  };

  /***
    This handles the particulars of finding an existing conversation or
    topic to fit the message into...
   ***/

  bot.findConversation = function(message,cb) {
    botkit.debug('CUSTOM FIND CONVO ',message.user);
    if (message.type=='message') {
      for (var t = 0; t < botkit.tasks.length; t++) {
        for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
          if (
            botkit.tasks[t].convos[c].isActive()
            && botkit.tasks[t].convos[c].source_message.user==message.user
          ) {
            botkit.debug('FOUND EXISTING CONVO!');
            cb(botkit.tasks[t].convos[c]);
            return;
          }
        }
      }
    }
    cb(null);
  }

  return bot;
}