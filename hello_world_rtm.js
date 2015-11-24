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


function goLeft(convo) {

  convo.say('You turn `{{responses.direction}}` and walk for a while.');
  convo.ask('A small green elf appears. "What is your favorite color?" he says.',[
    {
      pattern: new RegExp(/(red|blue|green|purple|orange|pink|black|white|yellow)/i),
      callback: function(r,c) {
        convo.say('Ah, {{responses.color}}! A great choice.');
        convo.next();
      }
    },
    {
      default: true,
      callback: function(r,c) {
        convo.sayFirst('{{responses.color}} is not a color I recognize!!');
        convo.repeat();
        convo.next();
      }
    }
  ],{key: 'color'});

}

function goRight(convo) {

  convo.say('You turn `{{responses.direction}}` and walk for a while.');

}


/* Sample functions for a more involved conversation that ends with something happening... */
function startTalking(convo) {

  convo.say("You are standing at a fork in the road.");
  convo.ask("Do you want to go `left` or `right`?",[
    {
      pattern:'left',
      callback: function(r,c) {
        goLeft(c);
        convo.next();
      }
    },
    {
      pattern: 'right',
      callback: function(r,c) {
        goRight(c);
        convo.next();
      }
    },
    {
      default: true,
      callback: function(r) { convo.repeat(); convo.next(); }
    }
  ],{key: 'direction'})


}


bot.hears(['talk'],'direct_message,direct_mention',function(message) {
  bot.startConversation(message,function(convo) {

    convo.on('end',function(finished_convo) {

      var user_responses = finished_convo.extractResponses();

      bot.reply(message,'You went ' + user_responses.direction);
      bot.reply(message,'Your favorite color is ' + user_responses.color);

    });

    startTalking(convo);
  });
});
