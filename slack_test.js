var Bot = require('./Slackbot.js');

var bot = Bot({
  debug: true,
  token: process.env.token,
  webhook_url: '',
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

  setInterval(function() {
    bot.tick();
  },1000);


});

bot.init();



bot.hears(['\/botkit'],'message_received',function(message) {




});

bot.hears(['^apis$'],'direct_mention,direct_message',function(message) {

  bot.reply(message,'Starting an API test...');

  bot.api.webhooks.send({
    text: 'This is an incoming webhook',
    channel: message.channel,
  },function(err,res) {
    bot.debug('INCOMING WEBHOOK:',err,res);

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

  bot.say({
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

});

bot.hears(['he.*?llo*','hey','hi'],'direct_mention,direct_message',function(message) {
  bot.debug('HEARS HANDLER');
  bot.reply(message,'Hello yourself, <@'+message.user+'>');
});

bot.hears(['ask'],'message_received,direct_message',function(message) {
  bot.startTask(message,function(task,convo) {
    convo.ask('Say YES or NO',{
        'yes': function(response) { bot.reply(response,'YES! Good.'); },
        'no': function(response) { bot.reply(response,'NO?!?! WTF?'); },
        'default': function(response) { bot.reply(response,'Huh?'); convo.repeat(); }
    });
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
    });

    task.on('end',function(task) {

      console.log('THIS SPECIFIC TASK ENDED');
      console.log('Can now extract info about responses:');


    });



    // and we can also start other conversations in this task.

  });

  bot.debug('MESSAGE RECEIVED EVENT HANDLER');
});
