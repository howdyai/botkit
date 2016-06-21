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
    console.log('------------------- recordStat --------------------------');
    console.log(bot);
    console.log('----------------------------------------------------------');
    console.log(data);
    var now = new Date();
    var post_body = {
      bot: '',
      botHash: generatebotHash('blah', 'blurp'),
      team: '',
      type: type,
      time: now,
      meta: data
    };
    console.log('----------------------------------------------------------');
    console.log(post_body);
    request.post({url:_BOTKIT_STATS_API + '/stats', formData: post_body}, function(err, httpResponse, body) {
      if (err) {
        return console.error('stats not saved:', err);
      }else {
        console.log('///////////////////////////');
        console.log(body);
      }
    });

  }

  botkit.on('message_received', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('message_received', bot, data);
    botkit.trigger('message_received', message);
  });

  botkit.on('sent', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('sent', data);
    botkit.trigger('sent', message);
  });

  botkit.on('spawn', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('spawn', data);
    botkit.trigger('spawn', message);
  });

  botkit.on('conversationStart', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('conversationStart', data);
    botkit.trigger('conversationStart', message);
  });

  botkit.on('conversationEnd', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('conversationEnd', data);
    botkit.trigger('conversationEnd', message);
  });

  botkit.on('command_triggered', function(bot, message) {
    console.log('/////////////////////////////////////');
    console.log(message);
    var data = {};
    recordStat('command_triggered', data);
    botkit.trigger('command_triggered', message);
  });

};
