var Botkit = require('./Botkit.js');

var controller = Botkit.slackbot({
 json_file_store: './db/',
 debug: false,
});

controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});

// controller.spawn({
//   token: process.env.token2
// }).configureIncomingWebhook({
//   url: 'https://hooks.slack.com/services/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',
// }).startRTM(function(err) {
//   if (err) {
//     throw new Error(err);
//   }
// }).sendWebhook({
//   text:'Configured'
// });


controller.hears(['^hook'],'direct_message,direct_mention',function(bot,message) {
  bot.sendWebhook({
    'text': 'Hey this is an incoming hook',
    'channel': message.channel,
  },function(err,res) {
    if(err) {
      bot.reply(message,'Could not send hook! ' + err);
    }
  })
});

controller.hears(['^identify'],'direct_message,direct_mention',function(bot,message) {

  bot.identifyBot(function(err,identity) {

    bot.reply(message,'I am ' + identity.name + ' from team id ' + identity.team_id);

  });

});

controller.hears(['hello'],'direct_message,direct_mention',function(bot,message) {
  bot.reply(message,{
    text: 'Hello!',
  });
});

controller.hears(['attach'],'direct_message,direct_mention',function(bot,message) {

  var attachments = [];
  var attachment = {
    title: 'This is an attachment',
    color: '#FFCC99',
    fields: [],
  }

  attachment.fields.push({
    label: 'Field',
    value: 'A longish value',
    short: false,
  })

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  })

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  })

  attachments.push(attachment);

  bot.reply(message,{
    text: 'See below...',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

controller.hears(['dm'],'direct_message,direct_mention',function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.say('Heard ya');
  });

  bot.startPrivateConversation(message,function(err,dm) {
    dm.say('Private reply!');
  })

});

controller.hears(['my name is (.*)'],'direct_message,direct_mention',function(bot,message) {
  var matches = message.text.match(/my name is (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
    })
  })
});

controller.hears(['what is my name'],'direct_message,direct_mention',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,'Your name is ' + user.name);
    } else {
      bot.reply(message,'I don\'t know your name yet');
    }
  })
});

controller.hears(['question','ask'],'direct_message,direct_mention',function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.ask('Say YES or NO',[
        {
          callback: function(response) { convo.say('YES! Good.'); convo.next(); },
          pattern: controller.utterances.yes,
        },
        {
          callback: function(response) { convo.say('NO?!?! WTF?'); convo.next(); },
          pattern: controller.utterances.no,
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

controller.hears(['talk'],'direct_message,direct_mention',function(bot,message) {
  bot.startConversation(message,function(err,convo) {

    convo.on('end',function(finished_convo) {

      var user_responses = finished_convo.extractResponses();

      bot.reply(message,'You went ' + user_responses.direction);
      bot.reply(message,'Your favorite color is ' + user_responses.color);

    });

    startTalking(convo);
  });
});
