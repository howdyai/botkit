var ws = require('ws');
var request = require('request');

module.exports = function(botkit,config) {

  var bot = {};
  bot.botkit = botkit;
  bot.config = config||{};

  // make these available at the bot level where they will be used by developers
  bot.utterances = botkit.utterances;



  bot.api = require(__dirname + '/Slack_web_api.js')(bot.botkit,bot.config);

  // set up API to send incoming webhook
  bot.configureIncomingWebhook = function(options) {

    if (!options.url) {
      throw new Error('No incoming webhook URL specified!');
    }

    bot.config.incoming_webhook = options;

    return bot;

  }

  bot.sendWebhook = function(options,cb) {
    if (!bot.config.incoming_webhook || !bot.config.incoming_webhook.url) {
      botkit.debug('CANNOT SEND WEBHOOK!!');
      if (cb) cb('No webhook url specified');
    } else {
      request.post(bot.config.incoming_webhook.url,function(err,res,body) {
          if (err) {
            botkit.debug('WEBHOOK ERROR',err);
            if (cb) cb(err);
          } else {
            botkit.debug('WEBHOOK SUCCESS',body);
            if (cb) cb(null,body);
          }
      }).form({payload: JSON.stringify(options)});
    }
  }

  bot.configureRTM = function(config) {
    bot.config.token = config.token;
    return bot;
  }

  bot.closeRTM = function() {
    if (bot.rtm) {
      bot.rtm.close();
    }
  }

  bot.startRTM = function(cb) {

    bot.api.rtm.start({
      no_unreads: true,
      simple_latest: true,
    },function(err,res) {

      if (err) {
        if (cb) {
          cb(err);
        }
      } else if (!res) {
        if (cb) {
          cb('Invalid response from rtm.start');
        }
      } else {
        bot.identity = res.self;
        bot.team_info = res.team;

        // also available
        // res.users
        // res.channels
        // res.groups
        // res.ims
        // res.bots
        // these could be stored and cached for later use!

        botkit.log("** BOT ID: ", bot.identity.name," ...attempting to connect to RTM!");

        bot.rtm = new ws(res.url);
        bot.msgcount = 1;

        bot.rtm.on('open',function() {
          botkit.trigger('rtm_open',[this]);

          bot.rtm.on('message', function(data, flags) {
            var message = JSON.parse(data);

            // Lets construct a nice quasi-standard botkit message
            // it leaves the main slack message at the root
            // but adds in additional fields for internal use!
            // (including the teams api details)

           botkit.receiveMessage(bot,message);

          });

          botkit.startTicking();

          if (cb) {
            cb(null,bot,res);
          }

        })

         bot.rtm.on('error',function(err) {
           botkit.log("RTM websocket error!",err)
           botkit.trigger('rtm_close',[bot,err]);
         });

         bot.rtm.on('close',function() {
           botkit.trigger('rtm_close',[bot]);
         });

       }
     });

     return bot;
  }

  bot.identifyBot = function(cb) {
    if (bot.identity) {
      bot.identifyTeam(function(err,team) {
        cb(null,{name: bot.identity.name,id:bot.identity.id,team_id:team});
      });
    } else {
      // Note: Are there scenarios other than the RTM
      // where we might pull identity info, perhaps from
      // bot.api.auth.test on a given token?
      cb('Identity Unknown: Not using RTM api');
    }
  }

  bot.identifyTeam = function(cb) {

    if (bot.team_info) {
      cb(null,bot.team_info.id);
    } else {
      // Note: Are there scenarios other than the RTM
      // where we might pull identity info, perhaps from
      // bot.api.auth.test on a given token?
      cb('Uknown Team!!');
    }
  }

  // convenience method for creating a DM convo
  bot.startPrivateConversation = function(message,cb) {
    botkit.startTask(this,message,function(task,convo) {
      bot._startDM(task,message.user,function(err,dm) {
        convo.stop();
        cb(err,dm);
      })
    })
  }

  bot.startConversation = function(message,cb) {
    botkit.startConversation(this,message,cb);
  }

  // convenience method for creating a DM convo
  bot._startDM = function(task,user_id,cb) {

    bot.api.im.open({user:user_id},function(err,channel) {
      if (err) {
        cb(err);
      } else {
        cb(null,task.startConversation({channel:channel.channel.id, user: user_id}));
      }
    });
  }

  bot.say = function(message,cb) {
    botkit.debug('SAY ',message);

    // construct a valid slack message
    var slack_message = {
      id: bot.msgcount++,
      type: message.type||'message',

      channel: message.channel,
      text: message.text||null,
      username: message.username||null,
      parse: message.parse||null,
      link_names: message.link_names||null,
      attachments: message.attachments?JSON.stringify(message.attachments):null,
      unfurl_links: message.unfurl_links||null,
      unfurl_media: message.unfurl_media||null,
      icon_url: message.icon_url||null,
      icon_emoji: message.icon_emoji||null,
    }

    if (message.icon_url || message.icon_emoji || message.username ){
      slack_message.as_user = false;
    } else {
      slack_message.as_user = message.as_user || true;
    }

    // these options are not supported by the RTM
    // so if they are specified, we use the web API to send messages
    if (message.attachments || message.icon_emoji || message.username || message.icon_url) {

      if (!bot.config.token) {
        throw new Error("Cannot use web API to send messages.")
      }

      bot.api.chat.postMessage(slack_message,function(err,res) {
        if (err) {
          if (cb) { cb(err); }
        } else {
          if (cb) { cb(null,res); }
        }

      });

    } else {
      if (!bot.rtm) {
        throw new Error("Cannot use the RTM API to send messages.")
      }

      try {
        bot.rtm.send(JSON.stringify(slack_message),function(err) {
          if (err) {
            // uhoh! RTM had an error sending
            if (cb) { cb(err); }
          } else {
            if (cb) { cb(null); }
          }
        });
      } catch(err) {
        // uhoh! the RTM failed and for some reason it didn't get caught elsewhere.
        // this happens sometimes when the rtm has closed but we are sending messages anyways
        // bot probably needs to reconnect!
        if (cb) { cb(err); }
      }
    }
  }

  bot.replyPublic = function(src,resp,cb) {

    if (!bot.res) {
      if (cb) { cb('No web response object found'); }
    } else {

      var msg = {};

      if (typeof(resp)=='string') {
          msg.text = resp;
          msg.channel = src.channel;
      } else {
        msg = resp;
        msg.channel = src.channel;
      }

      msg.response_type='in_channel';
      bot.res.json(msg);
      if (cb) { cb(null) }
    }

  }

  bot.replyPublicDelayed = function(src,resp,cb) {
    if (!src.response_url) {
      if (cb) { cb('No response_url found'); }
    } else {

      var msg = {};

      if (typeof(resp)=='string') {
          msg.text = resp;
          msg.channel = src.channel;
      } else {
        msg = resp;
        msg.channel = src.channel;
      }

      msg.response_type='in_channel';
      request.post(src.response_url,function(err,resp,body) {
        // do something?
        if (err) {
          botkit.log('Error sending slash command response:',err);
          if (cb) { cb(err); }
        } else {
          if (cb) { cb(null); }
        }
      }).form(JSON.stringify(msg));
    }

  }

  bot.replyPrivate = function(src,resp,cb) {

    if (!bot.res) {
      if (cb) { cb('No web response object found'); }
    } else {

      var msg = {};

      if (typeof(resp)=='string') {
          msg.text = resp;
          msg.channel = src.channel;
      } else {
        msg = resp;
        msg.channel = src.channel;
      }

      msg.response_type='ephemeral';
      bot.res.json(msg);
      if (cb) { cb(null) }
    }

  }

  bot.replyPrivateDelayed = function(src,resp,cb) {

    if (!src.response_url) {
      if (cb) { cb('No response_url found'); }
    } else {

      var msg = {};

      if (typeof(resp)=='string') {
          msg.text = resp;
          msg.channel = src.channel;
      } else {
        msg = resp;
        msg.channel = src.channel;
      }

      msg.response_type='ephemeral';
      request.post(src.response_url,function(err,resp,body) {
        // do something?
        if (err) {
          botkit.log('Error sending slash command response:',err);
          if (cb) { cb(err) }
        } else {
          if (cb) { cb(null) }
        }
      }).form(JSON.stringify(msg));
    }

  }

  bot.reply = function(src,resp,cb) {

    var msg = {};

    if (typeof(resp)=='string') {
        msg.text = resp;
        msg.channel = src.channel;
    } else {
      msg = resp;
      msg.channel = src.channel;
    }

    bot.say(msg,cb);

  }


  /***

    This handles the particulars of finding an existing conversation or
    topic to fit the message into...

   ***/

  bot.findConversation = function(message,cb) {
    botkit.debug('CUSTOM FIND CONVO',message.user,message.channel);
    if (message.type=='message' || message.type=='slash_command' || message.type=='outgoing_webhook') {
      for (var t = 0; t < botkit.tasks.length; t++) {
        for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
          if (
            botkit.tasks[t].convos[c].isActive()
            && botkit.tasks[t].convos[c].source_message.user==message.user
            && botkit.tasks[t].convos[c].source_message.channel==message.channel
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

  if (bot.config.incoming_webhook) {
    bot.configureIncomingWebhook(config.incoming_webhook);
  }

  if (bot.config.bot) {
    bot.configureRTM(config.bot);
  }

    return bot;
}
