var Botkit = require('./Botkit.js');
var nlp = require("nlp_compromise")


var bot = Botkit.slackbot({
//  debug: true,
  path: './teams/',
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  port: process.env.port,
});

bot.on('ready',function() {

  bot.setupWebserver(function(err,webserver) {
    bot.createHomepageEndpoint(bot.webserver);
    bot.createOauthEndpoints(bot.webserver);
    bot.createWebhookEndpoints(bot.webserver);
  });

  bot.findTeamById('T024F7C87',function(err,connection) {

    console.log('FOUND TEAM? ',connection);
    bot.startRTM(connection);

  })
}).init();


bot.on('create_team',function(connection) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('CREATED A TEAM!!');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

});

bot.on('update_team',function(connection) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('UPDATED A TEAM!!');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');


});

bot.on('create_incoming_webhook',function(connection,webhook_config) {
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('CREATED INCOMING WEBHOOK!!');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

})

// bot.on('slash_command',function(connection,message) {
//
//   if (message.command=='/botkit') {
//
//     // just respond with this
//     connection.res.send('Ouch!')
//     bot.reply(connection,message,'<@' + message.user + '> touched my slash command!!');
//
//   } else {
//     connection.res.send('Unknown command!');
//   }
//
//   return false;
//
// });

bot.hears('^dm\\b','direct_mention,mention',function(message) {
  bot.startTask(message,function(task,convo) {
    bot.startDM(task,message.user,function(err,dm) {
      dm.say('Yo');
      dm.ask('What up?',function(res,dm) {
        dm.sayFirst('Bro,' + res.text + '???');
        dm.next();
      });

      dm.ask('WHA',[
        {
          pattern: 'ok',
          callback: function(res,dm) { dm.say('OK!!!'); dm.next(); },
        },
        {
          pattern: 'no',
          callback: function(res,dm) { dm.say('NO!!!'); dm.next(); },
        },
      ]);


      convo.say('On it.');
    });
  });
});

bot.on('outgoing_webhook',function(message) {

  message._connection.res.json({
    text: 'Oh!',
  });

  bot.reply(message,'<@' + message.user + '> I love it when you say that.');

  return false;

}).hears(['^apis$'],['slash_command','direct_mention','direct_message'],function(message) {

  bot.reply(message,'Starting an API test...');
  bot.useConnection(message._connection);
  bot.api.webhooks.send({
    text: 'This is an incoming webhook',
    channel: message.channel,
  },function(err,res) {
    bot.debug('INCOMING WEBHOOK:',err,res);
    if (err) {
      bot.reply(message,'Incoming webhook error'+err);
    } else {
      bot.reply(message,'Incoming webhook success');
    }
  });

  bot.api.channels.list({},function(err,channels) {

      if (err) {
        bot.reply(message,'Channel list error');
        bot.debug('CHANNEL ERROR',err);
      } else {
        bot.reply(message,'Channel list success');
        bot.debug('CHANNEL SUCCESS',channels);
      }

  });

  bot.api.channels.setTopic({
    channel: message.channel,
    topic: 'Testing API calls',
  },function(err,topic) {

      if (err) {
        bot.reply(message,'Topic set error');
        bot.debug('Topic set error',err);
      } else {
        bot.reply(message,'Topic set success');
        bot.debug('TOPIC SUCCESS',topic);
      }

  });


  bot.api.emoji.list({
  },function(err,res) {

      if (err) {
        bot.reply(message,'emoji error');
        bot.debug('emoji error',err);
      } else {
        bot.reply(message,'emoji success');
        var emojis = [];
        for (var emoji in res.emoji) {
          emojis.push(emoji);
        }
        if (emojis.length) {
          bot.reply(message,':' + emojis[Math.floor(Math.random()*emojis.length)]+":");
        } else {
          bot.reply(message,'but no custom emojis??');
        }
        bot.debug('emoji success',res);
      }

  });

  bot.say(message._connection,{
    text: 'Lets add some emoji reactions...',
    channel: message.channel,
  },function(err,res) {

    if (err) {
      bot.reply(message,'Failed to say...');
    } else {
      bot.api.reactions.add({
        timestamp: res.message.ts,
        channel: res.channel,
        name: 'thumbsup',
      },function(err,res) {
        if (err) {
          bot.reply(message,'Failed to add emoji reactions...');
        } else {
          bot.reply(message,'Boom! Reaction added!');
        }
      });
    }

  })

}).hears(['he.*?llo*','hey','hi'],['slash_command','outgoing_webhook','direct_mention','direct_message'],function(message) {
  bot.debug('HEARS HANDLER');
  bot.reply(message,'Hello yourself, <@'+message.user+'>');
}).hears(['ask'],['ambient','direct_message'],function(message) {
  bot.startTask(message,function(task,convo) {
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
          callback: function(response) {  convo.say('Huh?'); convo.repeat(); convo.next(); }
        }
      ]
    );
    });
  });

// this will only be called if one of the hears phrases isn't heard
bot.on('direct_message,direct_mention',function(message) {
  bot.startTask(message,function(task,convo) {
    bot.debug('Started a task, future messages should end up handled.')


    // we can add messages to this conversation...
    convo.say('Cool!');
    convo.ask('What?',function(response) {
      bot.debug('CUSTOM HANDLER');
      convo.say('Got it: ' + response.text);
      convo.next();
    });

    convo.on('end',function(convo) {

      // can get responses here
      console.log(convo.extractResponses());

      // and we can get a transcript
      console.log(convo.transcript);

    });

    task.on('end',function(task) {

      console.log('THIS SPECIFIC TASK ENDED');
      console.log('Can now extract info about responses:');
      var responses = task.getResponsesByUser();
      console.log(responses);

    });



    // and we can also start other conversations in this task.

  });

  bot.debug('MESSAGE RECEIVED EVENT HANDLER');
});
