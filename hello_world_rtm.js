var Bot = require('./Slackbot.js');

var bot = Bot({
 path: './db/',
});

bot.startRTM({
  team: {
    token: process.env.token
  }
},function(err) {

  if (err) {
    throw new Error(err);
  }

});

bot.hears(['hello'],'direct_message,direct_mention',function(message) {
  bot.reply(message,'Hello!');
});


bot.hears(['my name is (.*)'],'direct_message,direct_mention',function(message) {
  var matches = message.text.match(/my name is (.*)/i);
  var name = matches[1];
  bot.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    bot.storage.users.save(user,function(err,id) {
      bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
    })
  })
});


bot.hears(['what is my name'],'direct_message,direct_mention',function(message) {
  bot.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,'Your name is ' + user.name);
    } else {
      bot.reply(message,'I don\'t know your name yet');
    }
  })
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
