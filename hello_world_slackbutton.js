var Bot = require('./Slackbot.js');

var bot = Bot({
  path: './db/',
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['incoming-webhook','commands'],
  }
);

bot.setupWebserver(process.env.port,function(err,webserver) {
  bot.createWebhookEndpoints(bot.webserver);

  bot.createOauthEndpoints(bot.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


bot.on('slash_command',function(message) {

  if (message.command=='/botkit') {

    if (message.text!='') {
      bot.replyPrivate(message,'Got a slash command! You sent ' + message.text);
    } else {
      bot.replyPublic(message,'Got a slash command! No additional text.');
    }
    setTimeout(function() {
      bot.replyPublicDelayed(message,'This is a delayed public response to the /botkit slash command.');
    },3000)
    setTimeout(function() {
      bot.replyPrivateDelayed(message,'This is a delayed private response to the /botkit slash command.');
    },5000)


    // or...
    // bot.replyPrivate(message,'');

    // then...
    // bot.replyPublicDelayed(message,'');
    // or...
    // bot.replyPrivateDelayed(message,'');

  }

});


bot.on('outgoing_webhook',function(message) {

  if (message.trigger_word=='hello') {
    bot.replyPublic(message,'Got an outgoing webhook!');
  }

});
