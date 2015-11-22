var Bot = require('./Slackbot.js');

var bot = Bot();

bot.init();

bot.startRTM({
  team: {
    token: process.env.token
  }
});

bot.hears(['hello'],'direct_message,direct_mention',function(message) {
  bot.reply(message,'Hello!');
});

bot.hears(['question','ask'],'direct_message,direct_mention',function(message) {
  bot.startConversation(message,function(convo) {
    convo.ask('Say YES or NO',[
        {
          callback: function(response) { convo.say('YES! Good.'); convo.next(); },
          pattern: bot.utterances.yes,
        },
        {
          callback: function(response) { convo.say('NO?!?! WTF?'); convo.next(); },
          pattern: bot.utterances.no,
        },
        {
          default: true,
          callback:function(response) { convo.say('Huh?'); convo.repeat();  convo.next(); }
        }
    ]);
  });
});
