var Bot = require('./Slackbot.js');

var bot = Bot({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
});

bot.init();

bot.setupWebserver();
bot.createWebhookEndpoints(bot.webserver);


bot.on('slash_command',function(connection,message) {

  if (message.command=='/hello') {
    connection.res.send('Hello yourself');
  }

});
