var Bot = require('./Slackbot.js');

var bot = Bot().configureSlackApp({
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: [''],
  }
});

bot.init();

bot.setupWebserver(function(webserver) {
  bot.createWebhookEndpoints(bot.webserver);
});


bot.on('slash_command',function(message) {

  if (message.command=='/hello') {
    message._connection.res.send('Hello yourself');
  }

});
