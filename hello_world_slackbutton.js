var Botkit = require('./Botkit.js');

var controller = Botkit.slackbot({
  json_file_store: './db/',
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['incoming-webhook','commands'],
  }
);

controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


controller.on('create_user',function(bot,user_info) {

  console.log('HOLY COW I JUST CREATED A USER!');

})

controller.on('update_user',function(bot,user_info) {

  console.log('HOLY COW I JUST UPDATED A USER!');

})

controller.on('create_team',function(bot,team_info) {

  console.log('HOLY COW I JUST CREATED A TEAM!');

})

controller.on('update_team',function(bot,team_info) {

  console.log('HOLY COW I JUST UPDATED A TEAM!');

})

controller.on('create_incoming_webhook',function(bot,webhook) {

  console.log('HOLY COW I JUST CREATED AN INCOMING WEBHOOK!');
  bot.sendWebhook({
    text: 'Hey, this is a newly configured webhook!'
  })

})



controller.on('slash_command',function(bot,message) {

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


controller.on('outgoing_webhook',function(bot,message) {

  if (message.trigger_word=='hello') {
    bot.replyPublic(message,'Got an outgoing webhook!');
  }

});
