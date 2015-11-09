var Bot = require('./Slackbot.js');

var bot = Bot();

bot.init();

bot.startRTM({
  team: {
    token: process.env.token
  }
});

bot.hears(['hello'],'direct_message,direct_mention',function(connection,message) {
  bot.reply(connection,message,'Hello!');
});

bot.hears(['lunch'],'direct_message,direct_mention',function(connection,message) {
  bot.startTask(connection,message,function(task,convo) {
    convo.ask('Say YES or NO',{
        'yes': {
          callback: function(response) { convo.say('YES! Good.'); },
          pattern: bot.utterances.yes,
        },
        'no': {
          callback: function(response) { convo.say('NO?!?! WTF?'); },
          pattern: bot.utterances.no,
        },
        'default': function(response) { convo.say('Huh?'); convo.repeat(); }
    });
  });
});
