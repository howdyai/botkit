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
  bot.reply(message,{
    text: 'Hello!',
    // username: 'hellobot',
    // icon_emoji: ':shit:',
  });
});

bot.hears(['dm'],'direct_message,direct_mention',function(message) {
  bot.startConversation(message,function(err,convo) {
    convo.say('Heard ya');
  });

  bot.startPrivateConversation(message,function(err,dm) {
    dm.say('Private reply!');
  })

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
  bot.startConversation(message,function(err,convo) {
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
  bot.startConversation(message,function(err,convo) {

    convo.on('end',function(finished_convo) {

      var user_responses = finished_convo.extractResponses();

      bot.reply(message,'You went ' + user_responses.direction);
      bot.reply(message,'Your favorite color is ' + user_responses.color);

    });

    startTalking(convo);
  });
});
