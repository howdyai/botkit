var _BOTKIT_STATS_API = 'http://192.168.33.20:3000';
var request = require('request');
var md5 = require('md5');

module.exports = function(botkit){
  var token = botkit.config.token;

  function generatebotHash(team, bot_id){
    var x = md5(team + '|' + bot_id);
    return x;
  }

  function recordStat(type, bot, data){
    console.log('---------------------------------------------------');
    console.log('howdy_token: ' + bot.config.howdy_token);
    console.log('howdy_bot_id: ' + bot.config.howdy_bot_id);
    console.log('---------------------------------------------------');
    var now = new Date();
    var stats_uri = null;
    if(bot.config.howdy_token){
      stats_uri = _BOTKIT_STATS_API + '/api/v1/stats?access_token=' + bot.config.howdy_token;
    }else{
      stats_uri = _BOTKIT_STATS_API + '/api/v1/stats';
    }
    var post_body = {
      botHash: generatebotHash(bot.team_info.id, bot.identity.id),
      team: md5(bot.team_info.id),
      channel: data.channel,
      user: data.user,
      type: type,
      time: now,
      meta: data
    };
    console.log(stats_uri);
    console.log(post_body);
    console.log('---------------------------------------------------');
    function req_cb(err, httpResponse, body) {
     if (err) {
       return console.error('stats not saved:', err);
     }
    }
    if(stats_uri !== null){
      request.post({url: stats_uri, form: post_body}, req_cb);
    }
  }

  botkit.on('message_received', function(bot, message) {
    // console.log('/////////////////////////////////////');
    // console.log(message);
    // var data = {
    //   user: md5(message.user),
    //   channel: md5(message.channel)
    // };
    // recordStat('message_received', bot, data);
    botkit.trigger('stats_message_received', message);
  });

  botkit.on('sent', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {

      user: md5(message.user),
      channel: md5(message.channel)
    };
    // recordStat('sent', bot, data);
    botkit.trigger('stats_sent', message);
  });

  botkit.on('spawned', function(bot) {
    var data = {
      user: md5(bot.identity.id),
      channel: null
    };
    recordStat('spawned', bot, data);
    botkit.trigger('stats_spawned', bot);
  });

  botkit.on('conversationStarted', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log('cs');
    console.log(message);
    var data = {
      user: md5(message.user),
      channel: md5(message.channel)
    };
    // recordStat('conversationStart', bot, data);
    botkit.trigger('stats_conversationStarted', message);
  });

  botkit.on('conversationEnded', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log('ce');
    console.log(message);
    var data = {
      user: md5(message.user),
      channel: md5(message.channel)
    };
    // recordStat('conversationEnd', bot, data);
    botkit.trigger('stats_conversationEnded', message);
  });

  botkit.on('command_triggered', function(bot, message, command) {
    console.log('/////////////////////////////////////');
    console.log('command_triggered');
    console.log(message);
    console.log(command);
    var data = {
      user: md5(message.user),
      channel: md5(message.channel),
      command: command.command,
      timestamp: command.created
    };
    recordStat('command_triggered', bot, data);
    botkit.trigger('stats_command_triggered', message);
  });

  botkit.on('heard_trigger', function(bot, keywords, message) {
    console.log('/////////////////////////////////////');
    console.log('heard_trigger');
    console.log(keywords);
    console.log(message);
    var data = {
      user: md5(message.user),
      channel: md5(message.channel),
      meta: {
        command: 'command.command',
        timestamp: 'command.created'
      }
    };
    recordStat('command_triggered', bot, data);
    botkit.trigger('stats_heard_trigger', message);
  });

};
