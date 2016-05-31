var Botkit = require(__dirname + '/CoreBot.js');

function Testbot(configuration) {
  var test_botkit = Botkit(configuration || {});
  test_botkit.defineBot(function (botkit, config) {
    var bot = {
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances,
    };

    bot.startConversation = function (message, cb) {
      botkit.startConversation(this, message, cb);
    };

    bot.send = function (message, cb) {
      console.log('[BOT ]', message.text);
      test_botkit.botLastAnswer = message;
    };

    bot.reply = function (src, resp, cb) {
      var msg = {};

      if (typeof(resp) == 'string') {
        msg.text = resp;
      } else {
        msg = resp;
      }

      msg.channel = src.channel;

      bot.say(msg, cb);
    };

    bot.findConversation = function (message, cb) {
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

    test_botkit.userSay = function (line) {
      console.log('[USER]', line);
      var message = {
        text: line,
        user: 'user',
        channel: 'text',
        timestamp: Date.now
      };
      test_botkit.receiveMessage(bot, message);
    };

    test_botkit.botAnswer = function () {
      return test_botkit.botLastAnswer;
    };

    return bot;
  });

  return test_botkit;
}

module.exports = Testbot;
